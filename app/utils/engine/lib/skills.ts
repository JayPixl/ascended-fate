import { IAttackType, IDamageEntry } from "../battlecontext"
import { IUpgradeCost } from "../gamestate"
import { ISkillEntry } from "./weapons"

export const SKILLS = {
    "quarterstaff:heavy_strike": {
        name: "Heavy Strike",
        levels: {
            "0": {
                entry: true,
                beginUnlocked: true,
                description: "3 DMG",
                cost: {
                    resources: [],
                    xp: 0
                },
                children: ["quarterstaff:heavy_strike#1"],
                baseDMG: {
                    DMG: {
                        base: 1
                    }
                },
                RPCost: 2,
                type: "VIT",
                initiative: 3
            },
            "1": {
                entry: false,
                beginUnlocked: false,
                description: "4 DMG",
                cost: {
                    resources: [],
                    xp: 8
                },
                children: [],
                baseDMG: {
                    DMG: {
                        base: 2
                    }
                },
                RPCost: 2,
                type: "VIT",
                initiative: 4
            }
        }
    },
    "soulbound_grimoire:focused_blast": {
        name: "Focused Blast",
        levels: {
            "0": {
                entry: true,
                beginUnlocked: true,
                description: "3 DMG",
                cost: {
                    resources: [],
                    xp: 0
                },
                children: [],
                baseDMG: {
                    MDMG: {
                        base: 1
                    }
                },
                RPCost: 1,
                type: "PRC",
                initiative: 5
            }
        }
    },
    "battleaxe:crushing_blow": {
        name: "Crushing Blow",
        levels: {
            "0": {
                entry: true,
                beginUnlocked: true,
                description: "3 DMG",
                cost: {
                    resources: [],
                    xp: 0
                },
                children: [],
                baseDMG: {
                    DMG: {
                        base: 1
                    },
                    PDMG: {
                        base: 1
                    }
                },
                RPCost: 1,
                type: "FRY",
                initiative: 4
            }
        }
    },
    "slime:engulf": {
        name: "Engulf",
        levels: {
            "0": {
                entry: true,
                beginUnlocked: true,
                description: "3 DMG",
                cost: { resources: [], xp: 0 },
                children: [],
                baseDMG: {
                    DMG: {
                        base: 1
                    },
                    PDMG: {
                        base: 1
                    }
                },
                RPCost: 1,
                type: "VIT",
                initiative: 7
            }
        }
    },
    "slime:bash": {
        name: "Bash",
        levels: {
            "0": {
                entry: true,
                beginUnlocked: true,
                description: "3 DMG",
                cost: { resources: [], xp: 0 },
                children: [],
                baseDMG: {
                    DMG: {
                        base: 1
                    },
                    PDMG: {
                        base: 1
                    }
                },
                RPCost: 3,
                type: "FRY",
                initiative: 4
            }
        }
    },
    "slime:pound": {
        name: "Pound",
        levels: {
            "0": {
                entry: true,
                beginUnlocked: true,
                description: "3 DMG",
                cost: { resources: [], xp: 0 },
                children: [],
                baseDMG: {
                    DMG: {
                        base: 1
                    },
                    PDMG: {
                        base: 1
                    }
                },
                RPCost: 2,
                type: "PRC",
                initiative: 5
            }
        }
    }
} as const

export type SkillName = keyof typeof SKILLS

export interface IBattleSkillEntry {
    id: string
    name: string
    description: string
    type: IAttackType
    RPCost: number
    baseDMG: Partial<IDamageEntry>
    initiative: number
}

export const getSkillEntry: (entry: string) => IBattleSkillEntry = entry => {
    const skillEntry = SKILLS[entry.split("#")[0] as SkillName]
    const levelEntry =
        skillEntry.levels[entry.split("#")[1] as keyof typeof skillEntry.levels]

    return {
        id: entry.split("#")[0],
        description: levelEntry.description,
        name: skillEntry.name,
        baseDMG: levelEntry.baseDMG,
        RPCost: levelEntry.RPCost,
        type: levelEntry.type as IAttackType,
        initiative: levelEntry.initiative
    }
}
