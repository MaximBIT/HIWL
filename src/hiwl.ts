import { DependencyContainer } from "@spt-aki/models/external/tsyringe";
import { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { StaticRouterModService } from "@spt-aki/services/mod/staticRouter/StaticRouterModService";
import { ProfileHelper } from "@spt-aki/helpers/ProfileHelper";
import { BodyPartsSettings, Effects } from "@spt-aki/models/eft/common/IGlobals";
import { BodyPartsHealth } from "@spt-aki/models/eft/common/tables/IBotBase";
import { PreAkiModLoader } from "@spt-aki/loaders/PreAkiModLoader";
import { VFS } from "@spt-aki/utils/VFS";
import { JsonUtil } from "@spt-aki/utils/JsonUtil";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { LogTextColor } from "@spt-aki/models/spt/logging/LogTextColor";
import { LogBackgroundColor } from "@spt-aki/models/spt/logging/LogBackgroundColor";
import https from "https";

class HIWL implements IPreAkiLoadMod, IPostDBLoadMod {

  private enabledPmc: boolean = true;  // linear health multiplier Pmc - true / false
  private multiplierPmc: number = 1;
  private enabledScav: boolean = true; // linear health multiplier Scav - true / false
  private multiplierScav: number = 1;
  private enabledNLPmc: boolean = false; // nonlinear health multiplier Pmc - true / false
  private nLMultiplierPmc: number = 100;
  private enabledNLScav: boolean = false; // nonlinear health multiplier Scav - true / false
  private nLMultiplierScav: number = 100;
  private enabledDebuffs: boolean = true; // Debuffs - true / false
  private autoUpdate = true; // automatic update of mod files - true / false
  private bodyPart: BodyPartsSettings;
  private effect: Effects;
  private bodyPartsPmc: BodyPartsHealth;
  private bodyPartsScav: BodyPartsHealth;
  private logger: ILogger;
  private reservefile: { [x: string]: { Health: { Current: any, Maximum: any; }; }; };
  private modPath: string = "user/mods/HIWL";
  private levelPmc: number;
  private levelScav: number;

  postDBLoad(container: DependencyContainer): void
  {
    const dbServer = container.resolve<DatabaseServer>("DatabaseServer").getTables().globals;
    this.bodyPart = dbServer.config.Health.ProfileHealthSettings.BodyPartsSettings;
    this.effect = dbServer.config.Health.Effects;
  }

  preAkiLoad(container: DependencyContainer): void
  {
    const staticRMS = container.resolve<StaticRouterModService>("StaticRouterModService");
    const pHelp = container.resolve<ProfileHelper>("ProfileHelper");
    const preAML = container.resolve<PreAkiModLoader>("PreAkiModLoader");
    const vfs = container.resolve<VFS>("VFS");
    const jsonUtil = container.resolve<JsonUtil>("JsonUtil");
    this.logger = container.resolve<ILogger>("WinstonLogger");
    staticRMS.registerStaticRouter("HealthMultiplier", 
    [
      {
        url: "/client/game/start",
        action: (url: any, info: any, sessionID: any, output: any) =>
        {
          try
          {
            let account = pHelp.getPmcProfile(sessionID);
            if(vfs.exists(`${this.modPath}/reservefile.json`) && account.Health)
            {
              let bodyP = pHelp.getPmcProfile(sessionID).Health.BodyParts;
              this.reservefile = jsonUtil.deserialize(vfs.readFile(`${this.modPath}/reservefile.json`));
              for(let eachPart in bodyP)
              {
                bodyP[eachPart].Health.Current = this.reservefile[eachPart].Health.Current;
                bodyP[eachPart].Health.Maximum = this.reservefile[eachPart].Health.Maximum;
              }
            }
          }
          catch(error)
          {
            this.logger.error(error.message);
          }
          return output;
        }
      },
      {
        url: "/client/items",
        action: (url: any, info: any, sessionID: any, output: any) =>
        {
          try
          {
            let account = pHelp.getPmcProfile(sessionID);
            if(account.Health)
            {
              this.bodyPartsPmc = pHelp.getPmcProfile(sessionID).Health.BodyParts;
              this.levelPmc = pHelp.getPmcProfile(sessionID).Info.Level;
              this.bodyPartsScav = pHelp.getScavProfile(sessionID).Health.BodyParts;
              this.levelScav = pHelp.getScavProfile(sessionID).Info.Level;
              this.CalculHealth(this.enabledPmc, this.enabledNLPmc, this.nLMultiplierPmc, this.bodyPartsPmc, this.HIWLPmc(this.bodyPartsPmc, this.levelPmc));
              this.CalculHealth(this.enabledScav, this.enabledNLScav, this.nLMultiplierScav, this.bodyPartsScav, this.HIWLScav(this.bodyPartsScav, this.levelScav));
            }
          }
          catch(error)
          {
            this.logger.error(error.message);
          }
          return output;
        }
      },
      {
        url: "/client/game/logout",
        action: (url: any, info: any, sessionID: any, output: any) =>
        {
          try
          {
            let bodyPP = pHelp.getPmcProfile(sessionID).Health.BodyParts;
            vfs.writeFile(`${preAML.getModPath("HIWL")}/reservefile.json`, jsonUtil.serialize(bodyPP, true));
            for(let eachPart in this.bodyPartsPmc && this.bodyPartsScav)
            {
              this.bodyPartsPmc[eachPart].Health.Current = this.bodyPart[eachPart].Default;
              this.bodyPartsPmc[eachPart].Health.Maximum = this.bodyPart[eachPart].Default;
              this.bodyPartsScav[eachPart].Health.Current = this.bodyPart[eachPart].Default;
              this.bodyPartsScav[eachPart].Health.Maximum = this.bodyPart[eachPart].Default;
            }
            this.Debuffs(this.effect, 1);
          }
          catch(error)
          {
            this.logger.error(error.message);
          }
          return output;
        }
    }
    ], "aki");
    this.Update(jsonUtil, vfs);
  }

  private HIWLPmc(bodParP: BodyPartsHealth, levP: number)
  {
    for(let eachPart in bodParP)
    {
      bodParP[eachPart].Health.Maximum = this.bodyPart[eachPart].Default + (levP * this.multiplierPmc);
    }
  }

  private HIWLScav(bodParS: BodyPartsHealth, levS: number)
  {
    for(let eachPart in bodParS)
    {
      bodParS[eachPart].Health.Current = this.bodyPart[eachPart].Default + (levS * this.multiplierScav);
      bodParS[eachPart].Health.Maximum = this.bodyPart[eachPart].Default + (levS * this.multiplierScav);
    }
  }

  private Mult(level: number): any
  {
    if(level <= 10) { return 1 }
    if(level >= 11 && level <= 20) { return 2 }
    if(level >= 21 && level <= 30) { return 3 }
    if(level >= 31 && level <= 40) { return 4 }
    if(level >= 41 && level <= 50) { return 5 }
    if(level >= 51 && level <= 60) { return 6 }
    if(level >= 61 && level <= 70) { return 7 }
    if(level >= 71) { return 8 }
  }

  private Debuffs(efft: Effects, mult: number)
  {
    efft.Fracture.BulletHitProbability.K = +(0.3 * mult).toFixed(3);
    efft.Fracture.BulletHitProbability.Threshold = +(0.3 / mult).toFixed(3);
    efft.Fracture.FallingProbability.K = +(1 * mult).toFixed(3);
    efft.Fracture.FallingProbability.Threshold = +(0.2 / mult).toFixed(3);
    efft.HeavyBleeding.Probability.K = +(0.45 * mult).toFixed(3);
    efft.HeavyBleeding.Probability.Threshold = +(0.5 / mult).toFixed(3);
    efft.LightBleeding.Probability.K = +(0.5 * mult).toFixed(3);
    efft.LightBleeding.Probability.Threshold = +(0.35 / mult).toFixed(3);
  }

  private CalculHealth(enabledPS:boolean, enabledNLPS: boolean, nLMPS: number, bodyParts: any, HIWLPS: any)
  {
    if(enabledPS)
    {
      HIWLPS;
      if(this.enabledDebuffs)
      {
        this.Debuffs(this.effect, this.Mult(this.levelPmc));
        // this.Debuffs(this.effect, this.Mult(this.levelScav));
      }
    }
    if(enabledNLPS)
    {
      for(let eachPart in bodyParts)
      {
        bodyParts[eachPart].Health.Current = this.bodyPart[eachPart].Default * nLMPS;
        bodyParts[eachPart].Health.Maximum = this.bodyPart[eachPart].Default * nLMPS;
      }
      if(this.enabledDebuffs)
      {
        // this.Debuffs(this.effect, nLMPS);
        // this.Debuffs(this.effect, (nLMultiplierPmc));
      }
    }
    if(!enabledPS && !enabledNLPS)
    {
      for(let eachPart in bodyParts)
      {
        bodyParts[eachPart].Health.Current = this.bodyPart[eachPart].Default;
        bodyParts[eachPart].Health.Maximum = this.bodyPart[eachPart].Default;
      }
      if(this.enabledDebuffs)
      {
        this.Debuffs(this.effect, 1);
      }
    }
  }

  private Update(jsonUtil, vfs)
  {
    try
    {
      https.get(`https://raw.githubusercontent.com/MaximBIT/HIWL/main/package.json`, (res) =>
      {
        let bodyPac = "";
        res.on("data", (chunk) =>
        {
          bodyPac += chunk;
        });
        res.on("end", () =>
        {
          const json = JSON.parse(bodyPac);
          const packg = jsonUtil.deserialize(vfs.readFile(`${this.modPath}/package.json`));
          if(json.version > packg.version)
          {
            this.logger.logWithColor(`New version HIWL: v${json.version}`, LogTextColor.BLACK, LogBackgroundColor.YELLOW);
            if(this.autoUpdate)
            {
              vfs.removeFile(`${this.modPath}/package.json`);
              vfs.writeFile(`${this.modPath}/package.json`, bodyPac);
              https.get(`https://raw.githubusercontent.com/MaximBIT/HIWL/main/src/hiwl.ts`,(res) => 
              {
                let bodyHiwl = "";
            
                res.on("data", (chun) => 
                {
                  bodyHiwl += chun;
                });
            
                res.on("end", () => 
                {
                  vfs.removeFile(`${this.modPath}/src/hiwl.ts`);
                  vfs.writeFile(`${this.modPath}/src/hiwl.ts`, bodyHiwl);
                  this.logger.logWithColor(`Updated: HIWL, restart the server`, LogTextColor.BLACK, LogBackgroundColor.GREEN);
                });
              
              }).on("error", (error) => 
              {
                this.logger.error(error.message);
              });
            }
          }
          else {
            this.logger.logWithColor(`No Updates HIWL v${json.version}`, LogTextColor.BLACK, LogBackgroundColor.GREEN);
          }
        })
      }).on("error", (error) =>
      {
        this.logger.error(error.message);
      });
    }
    catch (error) 
    {
      this.logger.error(error.message);
    }
  }

}
module.exports = {mod: new HIWL()}