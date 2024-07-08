import { Biome } from "../gamestate"
import { MultipliableWeighted } from "./generation"

export const ENEMIES = {
    "slime#0": {
        name: "Slime",
        HP: 5,
        RP: 2,
        fortitude: 1,
        DEF: {
            base: 1
        },
        EDEF: {
            base: 0
        },
        MDEF: {
            base: 1
        },
        luck: 3,
        dexterity: 2,
        moxie: 5,
        skills: ["slime:engulf#0", "slime:bash#0", "slime:pound#0"],
        equipment: [],
        spawnWeight: (
            biome: Biome,
            ascension: number
        ): MultipliableWeighted => {
            return {
                weight: biome === "forest" ? 10 : 8,
                multiplier: -0.2
            } as MultipliableWeighted
        }
    }
} as const

export type EnemyName = keyof typeof ENEMIES
