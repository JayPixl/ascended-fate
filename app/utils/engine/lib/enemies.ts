export const ENEMIES = {
    slime: {
        name: "Slime",
        variants: {
            "0": {
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
                skills: ["slime:engulf#0", "slime:bash#0", "slime:pound#0"]
            }
        }
    }
} as const

export type EnemyName = keyof typeof ENEMIES
