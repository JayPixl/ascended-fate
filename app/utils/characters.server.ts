import { Character, Prisma, User } from "@prisma/client"
import { RACES } from "./engine/lib/races"
import { ClassName, PlayerUpgradeTree, RaceName } from "./engine/skill-tree"
import { prisma } from "./prisma.server"
import { generateName } from "./name-generator"
import { createGameState } from "./engine/gamestate"

export const createCharacter: (
    user: User,
    race: RaceName,
    _class: ClassName
) => Promise<{
    error?: string
    character?: Character
}> = async (user, race, _class) => {
    const character = await prisma.character.create({
        data: {
            race: race,
            class: _class,
            ascension: 1,
            name: generateName(),
            status: "ACTIVE",
            statTracker: {},
            equipment: {},
            weapons: {},
            stats: {},
            gameState: createGameState(
                JSON.parse(
                    user.upgradeTree?.valueOf() as string
                ) as unknown as PlayerUpgradeTree,
                race,
                _class
            ) as unknown as Prisma.InputJsonObject,
            user: {
                connect: {
                    id: user.id
                }
            }
        }
    })

    if (!character) return { error: "Error while creating character." }

    return { character }
}

export const newTile: (
    character: Character,
    user: User
) => Promise<{
    error?: string
    character?: Character
}> = async (char, user) => {
    const character = await prisma.character.update({
        where: {
            id: char.id
        },
        data: {
            gameState: createGameState(
                JSON.parse(
                    user.upgradeTree?.valueOf() as string
                ) as unknown as PlayerUpgradeTree,
                char.race as RaceName,
                char.class as ClassName
            ) as unknown as Prisma.InputJsonObject
        }
    })

    if (!character) return { error: "Error while performing action." }

    return { character }
}
