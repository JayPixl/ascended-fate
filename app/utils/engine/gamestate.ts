import { random } from "animejs"
import { getRandomInt } from "../name-generator"
import { CLASSES } from "./lib/classes"
import {
    BIOMES,
    ItemStack,
    TILE_NODES,
    calculateWeighted
} from "./lib/generation"
import { RACES } from "./lib/races"
import { PlayerUpgradeTree } from "./skill-tree"
import { Character, User } from "@prisma/client"
import { CorrectedCharacter } from "../types"

export interface GameState {
    inventory: ItemStack[]
    stats: CharacterStats
    currentTile: GameTile
}

export interface IGameContext {
    user: User
    character: CorrectedCharacter
    screenContext: IScreenContext
}

export interface IScreenContext {
    activePage: string
}

export interface CharacterStats {
    HP: UpgradableStat
    RP: UpgradableStat
    AP: number
}

export interface UpgradableStat {
    current: number
    max: number
    upgradableMax: number
}

export interface GameTile {
    status: "battle" | "screen"
    biome: Biome
    tileNodes: TileNode[]
}

export type TileNode = AscensionNode | MerchantNode | ResourceNode | DungeonNode

export interface AbstractTileNode<T extends string> {
    type: T
    title: string
    usages: number
    APCost: number
}

export interface AscensionNode extends AbstractTileNode<"ascension"> {}

export interface MerchantNode extends AbstractTileNode<"merchant"> {}

export interface ResourceNode extends AbstractTileNode<"resource"> {
    pool: ItemStack[]
}

export interface DungeonNode extends AbstractTileNode<"dungeon"> {}

export type Biome = keyof typeof BIOMES

export type TileNodeType = keyof typeof TILE_NODES

// export interface InventoryItem {
//     id: string
//     quantity: number
//     components: any
// }

export const createGameState: (
    upgradeTree: PlayerUpgradeTree,
    race: keyof typeof RACES,
    _class: keyof typeof CLASSES
) => GameState = (upgradeTree, race, _class) => {
    const hp = getRandomInt(RACES[race]["HP"][0], RACES[race]["HP"][1])
    const rp = getRandomInt(RACES[race]["RP"][0], RACES[race]["RP"][1])

    return {
        inventory: [],
        stats: {
            HP: {
                current: hp,
                max: hp,
                upgradableMax: upgradeTree[race]["HP"]
            },
            RP: {
                current: rp,
                max: rp,
                upgradableMax: upgradeTree[race]["RP"]
            },
            AP: getRandomInt(8, 12)
        },
        currentTile: generateTile(1)
    }
}

export const generateTile: (ascension: number) => GameTile = ascension => {
    const biome = calculateWeighted(BIOMES, ascension) as Biome
    let tileNodes: TileNode[] = []

    for (var i: number = 0; i < getRandomInt(1, 3); i++) {
        tileNodes.push(
            TILE_NODES[
                calculateWeighted(TILE_NODES, ascension) as TileNodeType
            ].factory(biome, ascension)
        )
    }

    return {
        biome,
        tileNodes,
        status: "screen"
    }
}
