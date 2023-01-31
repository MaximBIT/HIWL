# HIWL
Health Increases With Level

## Summary
- [Description](#Description)
- [Install](#Install)
- [Settings](#Settings)
- [Delete](#Delete)

## Description:

In many games, bosses have a high level and a lot of HP, and a player of any level always has the same HP.

* This mod increases HP by 1 for each body part on each level.

* you can enable non-linear health for Scavs and PMC's or only for one.

For example: You want the PMC's health to increase with the level, and Scav to be the Rambo.

## Install:

* Unpack the contents of the archive into the "EFT/user/mods/" directory.

## Settings: In file hiwl.ts

* enabledPmc - linear health multiplier PMC's. (true - enable, false - disable)

* multiplierPmc - value to change health with level for PMC's.

* enabledScav - linear health multiplier Scav. (true - enable, false - disable)

* multiplierScav - value to change health with level for Scav.

* enabledNLPmc - nonlinear health for PMC's. (true - enable, false - disable)

* nLMultiplierPmc - the value for changing the nonlinear state for PMC's.

* enabledNLScav - nonlinear health for Scav. (true - enable, false - disable)

* nLMultiplierScav - the value for changing the nonlinear state for Scav.

* enabledDebuffs - Debuffs. (true - enable, false - disable)

* autoUpdate - automatic update of mod files. (true - enable, false - disable)

## Delete:

1. exit the game.

2. check the server log for the line "Changes in the profile are saved" should be the last.

3. delete mod folder.