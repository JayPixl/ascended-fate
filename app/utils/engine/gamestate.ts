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
import {
    ClassName,
    EquipmentUpgradeNode,
    PlayerUpgradeTree,
    RaceName
} from "./skill-tree"
import { User } from "@prisma/client"
import { CorrectedCharacter } from "../types"
import { EQUIPMENT } from "./lib/equipment"
import { WEAPONS } from "./lib/weapons"
import { SKILLS } from "./lib/skills"

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
    modal?: {
        type: "upgrade"
        node: {
            id: string
        }
    }
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

type EquipmentName<C extends ClassName = ClassName> =
    (typeof CLASSES)[C]["equipment"][number]

export type CharEquipmentMap = Record<EquipmentName, CharEquipTree>

interface CharEquipTree {
    refining: Record<string, { unlocked: boolean }>
}

type WeaponName<C extends ClassName = ClassName> =
    (typeof CLASSES)[C]["weapons"][number]

export type CharWeaponMap = Record<WeaponName, CharWeaponTree>

interface CharWeaponTree {
    refining: Record<string, { unlocked: boolean }>
    skills: Record<
        string,
        Record<string, { unlocked: boolean; unlockProgress: number }>
    >
}

export const getDefaultEquipment: (
    playerUpgradeTree: PlayerUpgradeTree,
    race: RaceName,
    _class: ClassName
) => CharEquipmentMap = (playerUpgradeTree, race, _class) => {
    let workingUpgradeTree = {}
    CLASSES[_class].equipment.map(equipName => {
        ;(
            Object.entries(EQUIPMENT) as [
                keyof typeof EQUIPMENT,
                (typeof EQUIPMENT)[keyof typeof EQUIPMENT]
            ][]
        )
            .filter(val => CLASSES[_class].equipment.includes(val[0] as never))
            .map(val => {
                let mappedNode = { refining: {} }
                Object.entries(val[1].refining).map(val2 => {
                    mappedNode = {
                        ...mappedNode,
                        refining: {
                            ...mappedNode.refining,
                            [val2[0]]: {
                                unlocked: val2[1].beginUnlocked
                            }
                        }
                    }
                })
                workingUpgradeTree = {
                    ...workingUpgradeTree,
                    [val[0]]: mappedNode
                }
            })
    })
    return workingUpgradeTree as CharEquipmentMap
}

export const getDefaultWeapons: <C extends ClassName>(
    playerUpgradeTree: PlayerUpgradeTree,
    race: RaceName,
    _class: ClassName
) => CharWeaponMap = (playerUpgradeTree, race, _class) => {
    let workingUpgradeTree = {}
    CLASSES[_class].weapons.map(weaponName => {
        ;(
            Object.entries(WEAPONS) as [
                keyof typeof WEAPONS,
                (typeof WEAPONS)[keyof typeof WEAPONS]
            ][]
        )
            .filter(val => CLASSES[_class].weapons.includes(val[0] as never))
            .map(val => {
                let mappedNode = { refining: {}, skills: {} } as any
                Object.entries(val[1].refining).map(val2 => {
                    mappedNode = {
                        ...mappedNode,
                        refining: {
                            ...mappedNode.refining,
                            [val2[0]]: {
                                unlocked: val2[1].beginUnlocked
                            }
                        }
                    }
                })
                ;(
                    Object.entries(SKILLS) as [
                        keyof typeof SKILLS,
                        (typeof SKILLS)[keyof typeof SKILLS]
                    ][]
                )
                    .filter(val2 =>
                        val[1].skills.includes(val2[0].split(":")[1] as never)
                    )
                    .map(val2 => {
                        Object.entries(val2[1].levels).map(val3 => {
                            mappedNode = {
                                ...mappedNode,
                                skills: {
                                    ...mappedNode.skills,
                                    [val2[0]]: {
                                        ...(mappedNode.skills?.[val2[0]] || {}),
                                        [val3[0]]: {
                                            unlocked: val3[1].beginUnlocked,
                                            unlockProgress: 0
                                        }
                                    }
                                }
                            }
                        })
                    })
                workingUpgradeTree = {
                    ...workingUpgradeTree,
                    [val[0]]: mappedNode
                }
            })
    })
    return workingUpgradeTree as CharWeaponMap
}

export const createGameState: (
    upgradeTree: PlayerUpgradeTree,
    _class: keyof typeof CLASSES
) => GameState = (upgradeTree, _class) => {
    const hp = getRandomInt(CLASSES[_class]["HP"][0], CLASSES[_class]["HP"][1])
    const rp = getRandomInt(CLASSES[_class]["RP"][0], CLASSES[_class]["RP"][1])

    return {
        inventory: [],
        stats: {
            HP: {
                current: hp,
                max: hp,
                upgradableMax: upgradeTree[_class]["HP"]
            },
            RP: {
                current: rp,
                max: rp,
                upgradableMax: upgradeTree[_class]["RP"]
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
