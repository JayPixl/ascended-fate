export const SKILLS = {
    "quarterstaff:heavy_strike": {
        name: "Heavy Strike",
        levels: {
            "0": {
                entry: true,
                beginUnlocked: true
            }
        }
    },
    "soulbound_grimoire:focused_blast": {
        name: "Focused Blast",
        levels: {
            "0": {
                entry: true,
                beginUnlocked: true
            }
        }
    },
    "battleaxe:crushing_blow": {
        name: "Crushing Blow",
        levels: {
            "0": {
                entry: true,
                beginUnlocked: true
            }
        }
    }
} as const

export type SkillName = keyof typeof SKILLS
