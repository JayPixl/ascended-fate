import { Character, Prisma, User } from "@prisma/client"
import { JsonValue } from "@prisma/client/runtime/library"
import type { LoaderFunction, MetaFunction } from "@remix-run/node"
import { Link, json, redirect, useLoaderData } from "@remix-run/react"
import { newTile } from "~/utils/characters.server"
import { GameState } from "~/utils/engine/gamestate"
import { ITEMS, ItemStack } from "~/utils/engine/lib/generation"
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
        case "new-tile": {
            const { error, character } = await newTile(activeCharacter, user)
            return json({ error, character })
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
    editedInventory.map(stack => {
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
        ) as GameState
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
