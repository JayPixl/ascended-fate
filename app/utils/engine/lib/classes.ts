export const CLASSES = {
    wanderer: {
        name: "Wanderer",
        equipment: ["wayfarers_tunic"],
        weapons: ["quarterstaff"],
        HP: [3, 5, 5, 12],
        RP: [4, 6, 6, 14]
    },
    scribe: {
        name: "Scribe",
        equipment: ["scholarly_robe"],
        weapons: ["soulbound_grimoire"],
        HP: [4, 5, 5, 10],
        RP: [3, 4, 4, 8]
    },
    brute: {
        name: "Brute",
        equipment: ["hardened_leather_armor"],
        weapons: ["battleaxe"],
        HP: [4, 6, 6, 18],
        RP: [3, 4, 4, 12]
    }
} as const
