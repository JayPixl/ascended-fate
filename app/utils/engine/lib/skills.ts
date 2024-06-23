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
                children: ["quarterstaff:heavy_strike#1"]
            },
            "1": {
                entry: false,
                beginUnlocked: false,
                description: "4 DMG",
                cost: {
                    resources: [],
                    xp: 8
                },
                children: []
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
                children: []
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
                children: []
            }
        }
    }
} as const

export type SkillName = keyof typeof SKILLS
