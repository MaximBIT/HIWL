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
import { ISyncHealthRequestData, Health } from "@spt-aki/models/eft/health/ISyncHealthRequestData";

class HIWL implements IPreAkiLoadMod, IPostDBLoadMod {

    private enabledPmc: boolean = true;  // linear health multiplier Pmc - true / false
    private multiplierPmc: number = 1;
    private enabledScav: boolean = true; // linear health multiplier Scav - true / false
    private multiplierScav: number = 1;
    private enabledNLPmc: boolean = false; // nonlinear health multiplier Pmc - true / false
    private nLMultiplierPmc: number = 100;
    private enabledNLScav: boolean = false; // nonlinear health multiplier Scav - true / false
    private nLMultiplierScav: number = 100;
    private enabledDebuffs: boolean = true; // true / false - Debuffs
    private bodyPart: BodyPartsSettings;
    private effect: Effects;
    private bodyPartsPmc: BodyPartsHealth;
    private bodyPartsScav: BodyPartsHealth;
    private logger: ILogger;
    private reservefile: { [x: string]: { Health: { Current: any, Maximum: any; }; }; };
    private modPath: string = "user/mods/HIWL";

    postDBLoad(container: DependencyContainer): void {
        const dbServer = container.resolve<DatabaseServer>("DatabaseServer").getTables().globals;
        this.bodyPart = dbServer.config.Health.ProfileHealthSettings.BodyPartsSettings;
        this.effect = dbServer.config.Health.Effects;
    }

    preAkiLoad(container: DependencyContainer): void {
        const staticRMS = container.resolve<StaticRouterModService>("StaticRouterModService");
        const pHelp = container.resolve<ProfileHelper>("ProfileHelper");
        const preAML = container.resolve<PreAkiModLoader>("PreAkiModLoader");
        const vfs = container.resolve<VFS>("VFS");
        const jsonUtil = container.resolve<JsonUtil>("JsonUtil");
        this.logger = container.resolve<ILogger>("WinstonLogger");
        staticRMS.registerStaticRouter("startgame", [ {
            url: "/client/game/start",
            action: (url: string, info: ISyncHealthRequestData, sessionID: string, output: any) => {
                try {
                    if(vfs.exists(`${this.modPath}/reservefile.json`)) {
                        let bodyP = pHelp.getPmcProfile(sessionID).Health.BodyParts;
                        this.reservefile = jsonUtil.deserialize(vfs.readFile(`${this.modPath}/reservefile.json`));
                        for(let eachPart in bodyP) {
                            bodyP[eachPart].Health.Current = this.reservefile[eachPart].Health.Current;
                            bodyP[eachPart].Health.Maximum = this.reservefile[eachPart].Health.Maximum;
                        }
                    }
                }
                catch(error) {
                    this.logger.error(error.message);
                    // https://www.youtube.com/watch?v=jfKfPfyJRdk&list=PLL4Ex1Cs9t0F5u6CY8EwKSWChx4YKjRGh&index=1&ab_channel=LofiGirl
                    // ⠄⠄⠄⢰⣧⣼⣯⠄⣸⣠⣶⣶⣦⣾⠄⠄⠄⠄⡀⠄⢀⣿⣿⠄⠄⠄⢸⡇⠄⠄
                    // ⠄⠄⠄⣾⣿⠿⠿⠶⠿⢿⣿⣿⣿⣿⣦⣤⣄⢀⡅⢠⣾⣛⡉⠄⠄⠄⠸⢀⣿⠄
                    // ⠄⠄⢀⡋⣡⣴⣶⣶⡀⠄⠄⠙⢿⣿⣿⣿⣿⣿⣴⣿⣿⣿⢃⣤⣄⣀⣥⣿⣿⠄
                    // ⠄⠄⢸⣇⠻⣿⣿⣿⣧⣀⢀⣠⡌⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠿⠿⣿⣿⣿⠄
                    // ⠄⢀⢸⣿⣷⣤⣤⣤⣬⣙⣛⢿⣿⣿⣿⣿⣿⣿⡿⣿⣿⡍⠄⠄⢀⣤⣄⠉⠋⣰
                    // ⠄⣼⣖⣿⣿⣿⣿⣿⣿⣿⣿⣿⢿⣿⣿⣿⣿⣿⢇⣿⣿⡷⠶⠶⢿⣿⣿⠇⢀⣤
                    // ⠘⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣽⣿⣿⣿⡇⣿⣿⣿⣿⣿⣿⣷⣶⣥⣴⣿⡗
                    // ⢀⠈⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠄
                    // ⢸⣿⣦⣌⣛⣻⣿⣿⣧⠙⠛⠛⡭⠅⠒⠦⠭⣭⡻⣿⣿⣿⣿⣿⣿⣿⣿⡿⠃⠄
                    // ⠘⣿⣿⣿⣿⣿⣿⣿⣿⡆⠄⠄⠄⠄⠄⠄⠄⠄⠹⠈⢋⣽⣿⣿⣿⣿⣵⣾⠃⠄
                    // ⠄⠘⣿⣿⣿⣿⣿⣿⣿⣿⠄⣴⣿⣶⣄⠄⣴⣶⠄⢀⣾⣿⣿⣿⣿⣿⣿⠃⠄⠄
                    // ⠄⠄⠈⠻⣿⣿⣿⣿⣿⣿⡄⢻⣿⣿⣿⠄⣿⣿⡀⣾⣿⣿⣿⣿⣛⠛⠁⠄⠄⠄
                    // ⠄⠄⠄⠄⠈⠛⢿⣿⣿⣿⠁⠞⢿⣿⣿⡄⢿⣿⡇⣸⣿⣿⠿⠛⠁⠄⠄⠄⠄⠄
                    // ⠄⠄⠄⠄⠄⠄⠄⠉⠻⣿⣿⣾⣦⡙⠻⣷⣾⣿⠃⠿⠋⠁⠄⠄⠄⠄⠄⢀⣠⣴
                    // ⣿⣿⣿⣶⣶⣮⣥⣒⠲⢮⣝⡿⣿⣿⡆⣿⡿⠃⠄⠄⠄⠄⠄⠄⠄⣠⣴⣿⣿⣿
                }
                return output;
            }
        } ], "start-game");
        staticRMS.registerStaticRouter("HealthMultiplier", [ {
            url: "/client/items",
            action: (url: string, info: ISyncHealthRequestData, sessionID: string, output: any) => {
                let account = pHelp.getPmcProfile(sessionID);
                if(account.Health) {
                    try {
                        this.bodyPartsPmc = pHelp.getPmcProfile(sessionID).Health.BodyParts;
                        this.bodyPartsScav = pHelp.getScavProfile(sessionID).Health.BodyParts;
                        const levelPmc = pHelp.getPmcProfile(sessionID).Info.Level;
                        const levelScav = pHelp.getScavProfile(sessionID).Info.Level;
                        this.CalculHealth(this.enabledPmc, this.enabledNLPmc, this.nLMultiplierPmc, this.bodyPartsPmc, this.HIWLPmc(this.bodyPartsPmc, levelPmc));
                        this.CalculHealth(this.enabledScav, this.enabledNLScav, this.nLMultiplierScav, this.bodyPartsScav, this.HIWLScav(this.bodyPartsScav, levelScav));
                    }
                    catch(error) {
                        this.logger.error(error.message);
                    }
                }
                return output;
            }
        } ], "health-multiplier");
        staticRMS.registerStaticRouter("reservefile", [ {
            url: "/client/game/logout",
            action: (url: string, info: ISyncHealthRequestData, sessionID: string, output: any) => {
                try {
                    let bodyPP = pHelp.getPmcProfile(sessionID).Health.BodyParts;
                    vfs.writeFile(`${preAML.getModPath("HIWL")}reservefile.json`, jsonUtil.serialize(bodyPP, true));
                    for(let eachPart in this.bodyPartsPmc && this.bodyPartsScav) {
                        this.bodyPartsPmc[eachPart].Health.Current = this.bodyPart[eachPart].Default;
                        this.bodyPartsPmc[eachPart].Health.Maximum = this.bodyPart[eachPart].Default;
                        this.bodyPartsScav[eachPart].Health.Current = this.bodyPart[eachPart].Default;
                        this.bodyPartsScav[eachPart].Health.Maximum = this.bodyPart[eachPart].Default;
                    }
                    this.Debuffs(this.effect, 1);
                }
                catch(error) {
                    this.logger.error(error.message);
                }
                return output;
            }
        } ], "reserve-file");
    }

    private CalculHealth(enabledPS: boolean, enabledNLPS: boolean, nLMPS: number, bodyParts: any, HIWLPS: any) {
        if(enabledPS) {
            HIWLPS;
        }
        else if(enabledNLPS) {
            for(let eachPart in bodyParts) {
                bodyParts[eachPart].Health.Current = this.bodyPart[eachPart].Default * nLMPS;
                bodyParts[eachPart].Health.Maximum = this.bodyPart[eachPart].Default * nLMPS;
            }
            if(this.enabledDebuffs) {
                // this.Debuffs(this.effect, nLMPS);
                // this.Debuffs(this.effect, (nLMultiplierPmc));
            }
        }
        else {
            for(let eachPart in bodyParts) {
                bodyParts[eachPart].Health.Current = this.bodyPart[eachPart].Default;
                bodyParts[eachPart].Health.Maximum = this.bodyPart[eachPart].Default;
            }
            if(this.enabledDebuffs) {
                // this.Debuffs(this.effect, 1);
            }
        }
    }

    private HIWLPmc(bodParP: BodyPartsHealth, levP: number) {
        for(let eachPart in bodParP) {
            bodParP[eachPart].Health.Maximum = this.bodyPart[eachPart].Default + (levP * this.multiplierPmc);
        }
        if(this.enabledDebuffs) {
            this.Debuffs(this.effect, ((levP * this.multiplierPmc)));
        }
    }
    
    private HIWLScav(bodParS: BodyPartsHealth, levS: number) {
        for(let eachPart in bodParS) {
            bodParS[eachPart].Health.Current = this.bodyPart[eachPart].Default + (levS * this.multiplierScav);
            bodParS[eachPart].Health.Maximum = this.bodyPart[eachPart].Default + (levS * this.multiplierScav);
        }
        if(this.enabledDebuffs) {
            // this.Debuffs(this.effect, (levS * multiplierScav));
        }
    }

    private Debuffs(efft: Effects, mult: number) {
        efft.Fracture.BulletHitProbability.K = +(0.3 * mult).toFixed(3);
        this.logger.info(`${efft.Fracture.BulletHitProbability.K}`);
        efft.Fracture.BulletHitProbability.Threshold = +(0.3 / mult).toFixed(3);
        this.logger.info(`${efft.Fracture.BulletHitProbability.Threshold}`);
        efft.Fracture.FallingProbability.K = +(1 * mult).toFixed(3);
        this.logger.info(`${efft.Fracture.FallingProbability.K}`);
        efft.Fracture.FallingProbability.Threshold = +(0.2 / mult).toFixed(3);
        this.logger.info(`${efft.Fracture.FallingProbability.Threshold}`);
        efft.HeavyBleeding.Probability.K = +(0.45 * mult).toFixed(3);
        this.logger.info(`${efft.HeavyBleeding.Probability.K}`);
        efft.HeavyBleeding.Probability.Threshold = +(0.5 / mult).toFixed(3);
        this.logger.info(`${efft.HeavyBleeding.Probability.Threshold}`);
        efft.LightBleeding.Probability.K = +(0.5 * mult).toFixed(3);
        this.logger.info(`${efft.LightBleeding.Probability.K}`);
        efft.LightBleeding.Probability.Threshold = +(0.35 / mult).toFixed(3);
        this.logger.info(`${efft.LightBleeding.Probability.Threshold}`);
    }
}
module.exports = {mod: new HIWL()}
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⣀⣤⣤⣤⣤⣀⡀
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⣠⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⣷⣦⡀
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⢀⣤⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣆
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡆
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⣸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⢿⢿⣿⣿⣿⣏⣿⣿⣿⣿⣿⡿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠈⠻⣿⡟⣯⣿⣿⡿⣿⣿⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⣰⣿⡇⠉⠁⠄⠁⠉⢹⣯⡯⢿⣿⣿⣿⣿⣿⣿⣿⣿⢳⡀
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⢠⣿⣿⡇⢀⡄⠄⠄⠄⠄⠄⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⡉
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⣠⣿⣿⣿⣿⡄⠰⡠⣤⠄⠄⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇⠈⠁
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠁⠸⣿⣿⣿⣿⣄⠉⠄⢀⣠⣰⣿⣿⣿⣿⣿⣿⡿⠿⠆
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠛⠉⠁⠋⠛⠒⡿⠟⠁⠄⠛⠿⣿⠉⠄⠁
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⢠⣄⡄⠄⠄⠄⠄⢩
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⢠⣦⣤⣤⣤⠟⣩⣿⠿⠿⣿⣷⣄⢳⡀
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⢠⣿⣿⣿⣿⣷⡿⠛⠁⠄⠄⠈⢻⣿⡄⡇
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⢀⣀⣴⣿⣿⣿⣿⣿⣿⡄⠄⠄⠄⠄⠄⠈⣿⣧⡇
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⢀⣠⣶⣿⣿⣿⣿⣿⣿⣿⣿⢿⣿⠄⠄⠄⠄⠄⠄⢹⣿⡇
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠄⠄⠄⠄⠄⠄⢸⣿⡗
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠄⠄⠄⠄⠄⠄⣾⣿⡇
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠄⠄⠄⠄⠄⢸⣿⠏
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠙⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠄⠄⠄⠄⠄⢸⡟
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⢹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠄⠄⠄⠄⠄⢸⡇
// ⠄⠈⢛⣿⣿⣿⣶⣤⣾⣧⠄⠄⠄⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠄⠄⠄⠄⠄⢸
// ⢠⣶⣿⣿⣿⣿⣿⣿⣿⣿⣧⣀⠄⠄⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠄⠄⠄⠄⠄⢈
// ⠿⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣶⣿⣿⣿⣿⣿⣿⣿⣿⠿⠿⡆⠄⠄⠄⠄⢸
// ⠄⠘⠛⠉⠉⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠇⠄⠄⠘⠂⠄⠄⠄⣾
// ⠄⠄⠄⠄⠄⠄⠙⠿⠿⠿⠿⠛⠿⣿⣿⣿⣿⣿⣿⣿⡿⠄⠄⠄⠄⠄⠄⠄⢀⡇
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⢠⣿⣿⣿⣿⣿⣿⣿⣿⣶⣤⣤⣤⣤⣀⠄⢸⠅
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣌⠄
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⣸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣆⡀
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣄
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣆
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡆
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⢀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠁
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⣾⣿⣿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⣿⣿⣿⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⣿⣿⣿⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡏
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⣿⣿⣿⠄⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠁
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⢹⣿⣿⠄⠸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⢸⣿⣿⠄⠄⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠈⣿⣿⡄⠄⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⢹⣿⣇⠄⠄⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠈⣿⣿⡄⠄⠄⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠘⣿⣷⡀⠄⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇
// ⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠹⠿⠧⠄⠄⠘⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠿⠃
