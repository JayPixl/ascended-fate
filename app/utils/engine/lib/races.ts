export const RACES = {
    lapine: {
        name: "Lapine",
        HP: [3, 5, 5, 12],
        RP: [4, 6, 6, 14],
        classes: [
            "wanderer"
            //"scout",
            //"guardian"
        ]
    },
    tytovi: {
        name: "Tytovi",
        HP: [4, 5, 5, 10],
        RP: [3, 4, 4, 8],
        classes: [
            "scribe"
            //"sage",
            //"seer"
        ]
    },
    swineig: {
        name: "Swineig",
        HP: [4, 6, 6, 18],
        RP: [3, 4, 4, 12],
        classes: [
            "brute"
            //"champion",
            //"lancer"
        ]
    }
} as const
