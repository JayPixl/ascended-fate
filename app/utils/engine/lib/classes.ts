export const CLASSES = {
    wanderer: {
        name: "Wanderer",
        equipment: ["wayfarers_tunic"],
        weapons: ["quarterstaff"],
        HP: [8, 8, 12],
        RP: [7, 7, 11],
        luck: 8,
        dexterity: 9,
        moxie: 3,
        constitution: 4,
        stamina: 12,
        fortitude: 2
    },
    scribe: {
        name: "Scribe",
        equipment: ["scholarly_robe"],
        weapons: ["soulbound_grimoire"],
        HP: [10, 10, 15],
        RP: [10, 10, 15],
        luck: 6,
        dexterity: 3,
        moxie: 5,
        constitution: 2,
        stamina: 8,
        fortitude: 3
    },
    brute: {
        name: "Brute",
        equipment: ["hardened_leather_armor"],
        weapons: ["battleaxe"],
        HP: [15, 15, 24],
        RP: [6, 6, 10],
        luck: 2,
        dexterity: 3,
        moxie: 11,
        constitution: 3,
        stamina: 8,
        fortitude: 4
    }
} as const
