import { Character, Prisma, User } from "@prisma/client"
import { JsonValue } from "@prisma/client/runtime/library"
import type { LoaderFunction, MetaFunction } from "@remix-run/node"
import { Link, json, redirect, useLoaderData } from "@remix-run/react"
import { evolve } from "evolve-ts"
import { generate } from "randomstring"
import {
    CharEquipmentMap,
    CharWeaponMap,
    GameState,
    createGameState,
    generateTile,
    getDefaultEquipment,
    getDefaultWeapons
} from "~/utils/engine/gamestate"
import { getEquipmentById } from "~/utils/engine/lib/equipment"
import { ITEMS, ItemStack } from "~/utils/engine/lib/generation"
import { getWeaponById } from "~/utils/engine/lib/weapons"
import {
    ClassName,
    PlayerUpgradeTree,
    RaceName
} from "~/utils/engine/skill-tree"
import { getRandomInt } from "~/utils/name-generator"
import { prisma } from "~/utils/prisma.server"
import { CorrectedCharacter, UserWithCharacters } from "~/utils/types"
import { getUser } from "~/utils/users.server"

export const meta: MetaFunction = () => {
    return [
        { title: "New Remix App" },
        { name: "description", content: "Welcome to Remix!" }
    ]
}

export const loader: LoaderFunction = async ({ request }) => {
    const { user } = (await getUser(request)) as { user: UserWithCharacters }
    if (!user) return redirect("/play")

    let activeCharacter = user.characters.filter(
        char => char.status === "ACTIVE"
    )?.[0]
    if (!activeCharacter) return redirect("/play/campaign/new")
    let char: CorrectedCharacter =
        activeCharacter as unknown as CorrectedCharacter

    let { searchParams } = new URL(request.url)

    const action = (searchParams.get("type") as string) || ""

    console.log("RECEIVED ACTION " + action)

    switch (action) {
        case "reset-character": {
            const character = await prisma.character.update({
                where: {
                    id: char.id
                },
                data: {
                    ascension: 1,
                    equipment: getDefaultEquipment(
                        JSON.parse(
                            user.upgradeTree?.valueOf() as string
                        ) as unknown as PlayerUpgradeTree,
                        char.race as RaceName,
                        char.class as ClassName
                    ) as unknown as Prisma.InputJsonObject,
                    weapons: getDefaultWeapons(
                        JSON.parse(
                            user.upgradeTree?.valueOf() as string
                        ) as unknown as PlayerUpgradeTree,
                        char.race as RaceName,
                        char.class as ClassName
                    ) as unknown as Prisma.InputJsonObject,
                    gameState: createGameState(
                        JSON.parse(
                            user.upgradeTree as string
                        ) as unknown as PlayerUpgradeTree,
                        char.class as ClassName
                    ) as unknown as Prisma.InputJsonObject
                }
            })
            return json({ character })
        }
        case "resource": {
            const nodeIndex = Number(searchParams.get("index") as string)
            if (Number.isNaN(nodeIndex) || nodeIndex < 0 || nodeIndex > 2) {
                return json({ error: "Invalid node index!" })
            }
            const targetNode = char.gameState.currentTile.tileNodes[nodeIndex]
            if (targetNode.type !== "resource" || targetNode.usages === 0) {
                return json({ error: "Invalid node!" })
            }

            if (targetNode.APCost > char.gameState.stats.AP) {
                return json({ error: "Not enough AP!" })
            }

            const itemStackToAdd =
                targetNode.pool[getRandomInt(0, targetNode.pool.length - 1)]
            const addResult = addInventoryItem(
                char.gameState.inventory,
                itemStackToAdd
            )

            if (!(addResult.result === ActionResult.SUCCESS)) {
                return json({ error: "Could not add to inventory!" })
            }

            const character = await prisma.character.update({
                where: {
                    id: activeCharacter.id
                },
                data: {
                    gameState: updateJsonValue<GameState>(char.gameState, {
                        inventory: addResult.inventory,
                        stats: {
                            ...char.gameState.stats,
                            AP: char.gameState.stats.AP - targetNode.APCost
                        },
                        currentTile: {
                            ...char.gameState.currentTile,
                            tileNodes: char.gameState.currentTile.tileNodes.map(
                                (node, index) =>
                                    index === nodeIndex
                                        ? { ...node, usages: node.usages - 1 }
                                        : node
                            )
                        }
                    })
                }
            })

            if (!character) {
                return json({ error: "Could not update character!" })
            }

            return json({ character })
        }
        case "travel": {
            if (char.gameState.stats.AP < 1) {
                return json({ error: "Not enough AP to travel!" })
            }

            const character = await prisma.character.update({
                where: {
                    id: char.id
                },
                data: {
                    gameState: evolve(
                        {
                            currentTile: generateTile(char.ascension),
                            stats: { AP: char.gameState.stats.AP - 1 }
                        },
                        char.gameState
                    ) as unknown as Prisma.InputJsonValue
                }
            })
            if (!character)
                return json({ error: "Error while performing action." })

            return json({ character })
        }
        case "rest": {
            if (char.gameState.stats.AP < 1) {
                return json({ error: "Not enough AP to rest!" })
            }

            if (
                char.gameState.stats.HP.current ===
                    char.gameState.stats.HP.max &&
                char.gameState.stats.RP.current === char.gameState.stats.RP.max
            ) {
                return json({ error: "HP and RP are already full!" })
            }

            const character = await prisma.character.update({
                where: {
                    id: char.id
                },
                data: {
                    gameState: evolve(
                        {
                            stats: {
                                AP: char.gameState.stats.AP - 1,
                                HP: {
                                    current: Math.min(
                                        char.gameState.stats.HP.current + 1,
                                        char.gameState.stats.HP.max
                                    )
                                },
                                RP: {
                                    current: Math.min(
                                        char.gameState.stats.RP.current + 1,
                                        char.gameState.stats.RP.max
                                    )
                                }
                            }
                        },
                        char.gameState
                    ) as unknown as Prisma.InputJsonValue
                }
            })
            if (!character)
                return json({ error: "Error while performing action." })

            return json({ character })
        }
        case "upgrade": {
            const nodeId = searchParams.get("id") as string
            if (!nodeId) return json({ error: "Invalid upgrade ID." })

            if (nodeId === "maxHP") {
                console.log("UPGRADING MAX HP!")
                return json({ character: char })
            } else if (nodeId === "maxRP") {
                console.log("UPGRADING MAX RP!")
                return json({ character: char })
            } else if (
                Object.keys(char.weapons).filter(w => nodeId.includes(w)).length
            ) {
                if (nodeId.includes("_refining_")) {
                    console.log("UPGRADING WEAPON REFINEMENT!")
                    const refiningEntry = getWeaponById(
                        nodeId.split("_refining_")[0],
                        char.weapons
                    ).refining.levels.filter(
                        l => l.id === nodeId.split("_refining_")[1]
                    )[0]
                    if (
                        !refiningEntry ||
                        refiningEntry.unlocked ||
                        !refiningEntry.cost.resources
                    )
                        return json({
                            error: "Cannot upgrade!",
                            character: char
                        })
                    if (
                        !hasItemStacks(
                            refiningEntry.cost.resources,
                            char.gameState.inventory
                        )
                    )
                        return json({
                            error: "You lack sufficient resources to upgrade!"
                        })

                    const removeResult = removeItemStacks(
                        refiningEntry.cost.resources,
                        char.gameState.inventory
                    )
                    if (removeResult.result === ActionResult.FAIL) {
                        return json({
                            error: "Could not modify inventory!",
                            character: char
                        })
                    }

                    const character = await prisma.character.update({
                        where: { id: char.id },
                        data: {
                            weapons: evolve(
                                {
                                    [nodeId.split("_refining_")[0]]: {
                                        refining: {
                                            [nodeId.split("_refining_")[1]]: {
                                                unlocked: true
                                            }
                                        }
                                    }
                                },
                                char.weapons
                            ) as unknown as Prisma.InputJsonObject,
                            gameState: evolve(
                                { inventory: removeResult.inventory },
                                char.gameState
                            ) as unknown as Prisma.InputJsonObject
                        }
                    })

                    return json({ character })
                } else {
                    console.log("UPGRADING WEAPON SKILL!")
                    const skillEntry = getWeaponById(
                        nodeId.split(":")[0],
                        char.weapons
                    ).skills.levels.filter(l => l.id === nodeId)[0]

                    if (
                        !skillEntry ||
                        skillEntry.unlocked ||
                        !skillEntry.cost.resources ||
                        !skillEntry.cost.xp
                    )
                        return json({
                            error: "Cannot upgrade!",
                            character: char
                        })
                    if (
                        !hasItemStacks(
                            skillEntry.cost.resources,
                            char.gameState.inventory
                        ) ||
                        skillEntry.unlockProgress < skillEntry.cost.xp
                    )
                        return json({
                            error: "You lack sufficient resources to upgrade!"
                        })

                    const removeResult = removeItemStacks(
                        skillEntry.cost.resources,
                        char.gameState.inventory
                    )
                    if (removeResult.result === ActionResult.FAIL) {
                        return json({
                            error: "Could not modify inventory!",
                            character: char
                        })
                    }

                    const character = await prisma.character.update({
                        where: { id: char.id },
                        data: {
                            weapons: evolve(
                                {
                                    [nodeId.split(":")[0]]: {
                                        skills: {
                                            [nodeId.split("#")[0]]: {
                                                [nodeId.split("#")[1]]: {
                                                    unlocked: true,
                                                    unlockProgress: 0
                                                }
                                            }
                                        }
                                    }
                                },
                                char.weapons
                            ) as unknown as Prisma.InputJsonObject,
                            gameState: evolve(
                                { inventory: removeResult.inventory },
                                char.gameState
                            ) as unknown as Prisma.InputJsonObject
                        }
                    })

                    return json({ character })
                }
                return json({ character: char })
            } else if (
                Object.keys(char.equipment).filter(e => nodeId.includes(e))
                    .length
            ) {
                console.log("UPGRADING EQUIPMENT!")
                //return json({ character: char })
                const refiningEntry = getEquipmentById(
                    nodeId.split("_refining_")[0],
                    char.equipment
                ).refining.levels.filter(
                    l => l.id === nodeId.split("_refining_")[1]
                )[0]
                if (
                    !refiningEntry ||
                    refiningEntry.unlocked ||
                    !refiningEntry.cost.resources
                )
                    return json({
                        error: "Cannot upgrade!",
                        character: char
                    })
                if (
                    !hasItemStacks(
                        refiningEntry.cost.resources,
                        char.gameState.inventory
                    )
                )
                    return json({
                        error: "You lack sufficient resources to upgrade!"
                    })

                const removeResult = removeItemStacks(
                    refiningEntry.cost.resources,
                    char.gameState.inventory
                )

                if (removeResult.result === ActionResult.FAIL) {
                    return json({
                        error: "Could not modify inventory!",
                        character: char
                    })
                }

                const character = await prisma.character.update({
                    where: { id: char.id },
                    data: {
                        equipment: evolve(
                            {
                                [nodeId.split("_refining_")[0]]: {
                                    refining: {
                                        [nodeId.split("_refining_")[1]]: {
                                            unlocked: true
                                        }
                                    }
                                }
                            },
                            char.equipment
                        ) as unknown as Prisma.InputJsonObject,
                        gameState: evolve(
                            { inventory: removeResult.inventory },
                            char.gameState
                        ) as unknown as Prisma.InputJsonObject
                    }
                })

                return json({ character })
            } else {
                return json({ error: "Invalid upgrade ID." })
            }
        }
        case "loot": {
            const item = searchParams.get("item") as string
            const amount = Number((searchParams.get("amount") as string) || "1")
            const addResult = addInventoryItem(char.gameState.inventory, {
                id: item as keyof typeof ITEMS,
                amount,
                components: {}
            })
            if (addResult.result === ActionResult.FAIL)
                return json({
                    error: "Could not update inventory.",
                    character: char
                })
            const character = await prisma.character.update({
                where: {
                    id: char.id
                },
                data: {
                    gameState: evolve(
                        { inventory: addResult.inventory },
                        char.gameState
                    ) as unknown as Prisma.InputJsonObject
                }
            })
            return json({ character })
        }
        default: {
            return json({ error: "Invalid action type!" })
        }
    }
}

export const INVENTORY_SIZE = 20

export const addInventoryItem: (
    inventory: ItemStack[],
    added: ItemStack
) => { result: ActionResult; inventory: ItemStack[] } = (inventory, added) => {
    let stackToAdd = { ...added }
    let editedInventory = [...inventory]
    editedInventory = editedInventory.map(stack => {
        if (
            stack.id === added.id &&
            JSON.stringify(stack.components) ===
                JSON.stringify(added.components)
        ) {
            let totalToAdd = Math.min(
                stackToAdd.amount,
                ITEMS[stack.id].maxStack - stack.amount
            )
            stackToAdd.amount -= totalToAdd
            return {
                ...stack,
                amount: stack.amount + totalToAdd
            }
        }
        return stack
    })

    if (editedInventory.length < INVENTORY_SIZE && stackToAdd.amount > 0) {
        editedInventory.push({ ...stackToAdd })
        stackToAdd.amount = 0
    }

    if (stackToAdd.amount > 0) {
        return {
            result: ActionResult.FAIL,
            inventory
        }
    }
    return {
        result: ActionResult.SUCCESS,
        inventory: editedInventory
    }
}

export const hasItemStacks: (
    itemStacks: ItemStack[],
    inventory: ItemStack[]
) => { result: ActionResult } = (itemStacks, inventory) => {
    const copiedInventory: ItemStack[] = deepCopy(inventory)

    if (
        removeItemStacks(itemStacks, copiedInventory).result ===
        ActionResult.SUCCESS
    ) {
        return {
            result: ActionResult.SUCCESS
        }
    }
    return {
        result: ActionResult.FAIL
    }
}

export const removeItemStacks: (
    itemStacks: ItemStack[],
    inventory: ItemStack[]
) => { result: ActionResult; inventory: ItemStack[] } = (
    itemStacks,
    inventory
) => {
    const copiedInventory: ItemStack[] = deepCopy(inventory)

    for (let i = 0; i < itemStacks.length; i++) {
        const stackToRemove: ItemStack = deepCopy(itemStacks[i])

        const matchingStacks = copiedInventory
            .filter(
                item =>
                    item.id === stackToRemove.id &&
                    JSON.stringify(item.components) ===
                        JSON.stringify(stackToRemove.components)
            )
            .sort((a, b) => a.amount - b.amount)

        while (stackToRemove.amount > 0 && matchingStacks.length > 0) {
            const matchingStack = matchingStacks[0]
            const amountToRemove = Math.min(
                matchingStack.amount,
                stackToRemove.amount
            )

            stackToRemove.amount -= amountToRemove
            matchingStack.amount -= amountToRemove

            if (matchingStack.amount <= 0) {
                const index = copiedInventory.indexOf(matchingStack)
                if (index > -1) {
                    copiedInventory.splice(index, 1)
                }
                matchingStacks.shift()
            }
        }

        if (stackToRemove.amount > 0) {
            return {
                result: ActionResult.FAIL,
                inventory
            }
        }
    }

    return {
        result: ActionResult.SUCCESS,
        inventory: copiedInventory
    }
}

export enum ActionResult {
    SUCCESS,
    FAIL
}

export const fixCharacter: (
    character: Character
) => CorrectedCharacter = character => {
    return {
        ...character,
        gameState: JSON.parse(
            character.gameState?.valueOf() as string
        ) as GameState,
        equipment: JSON.parse(
            character.equipment as string
        ) as CharEquipmentMap,
        weapons: JSON.parse(character.weapons as string) as CharWeaponMap
    } as CorrectedCharacter
}

export function updateJsonValue<T extends Object>(
    original: T,
    updates: Partial<T>
): Prisma.InputJsonObject {
    return {
        ...original,
        ...updates
    } as unknown as Prisma.InputJsonObject
}

export function deepCopy<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
}
