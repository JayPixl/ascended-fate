export const getRandomInt = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

export const generateName: () => string = () => {
    const syllables = [
        "e",
        "li",
        "an",
        "thor",
        "i",
        "mel",
        "vi",
        "trix",
        "lan",
        "zan",
        "al",
        "der",
        "win",
        "in",
        "lor",
        "ki",
        "a",
        "ri"
    ]

    const numOfSyllables = getRandomInt(2, 4)
    let name = ""

    for (let i = 0; i < numOfSyllables; i++) {
        const syllableIndex = getRandomInt(0, syllables.length - 1)
        name += syllables[syllableIndex]
        syllables.splice(syllableIndex, 1)
    }

    name = name[0].toUpperCase() + name.slice(1)
    return name
}
