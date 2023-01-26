# HIWL
Health Increases With Level

Description:

In many games, bosses have a high level and a lot of HP, and a player of any level always has the same HP.

This mod increases HP by 1 for each body part on each level.



+ you can enable non-linear health for Scavs and PMC's or only for one.

For example: You want the PMC's health to increase with the level, and Scav to be the Rambo.



Install:

Unpack the contents of the archive into the "EFT/user/mods/" directory.



Settings:

In file hiwl.ts



includedPmc - to increase health with level for PMC's. (true - enable, false - disable)

multiplyPmc - value to change health with level for PMC's. (0.5 - 999)



includedScav - to increase health with level for Scav. (true - enable, false - disable)

multiplyScav - value to change health with level for Scav. (0.5 - 999)



nonLinearHealthMultiplierEnablePmc - non-linear health for PMC's. (true - enable, false - disable)

nonLinearHealthMultiplierPmc - the value for changing the nonlinear state for PMC's. (10, 100)



nonLinearHealthMultiplierEnableScav - non-linear health for Scav. (true - enable, false - disable)

nonLinearHealthMultiplierScav - the value for changing the nonlinear state for Scav. (10, 100)



Delete:

1. exit the game.

2. check the server log for the line "Changes in the profile are saved" should be the last.

3. delete mod folder.
