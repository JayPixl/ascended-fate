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
import { EQUIPMENT, getEquipmentById } from "./lib/equipment"
import { WEAPONS, getWeaponById } from "./lib/weapons"
import { SKILLS } from "./lib/skills"
import { ActionResult, hasItemStacks } from "~/routes/play_.campaign_.action"
import { EnemyName } from "./lib/enemies"
import { IBattleContext } from "./battlecontext"

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
        node: IUpgradeNode
    }
}

export interface IUpgradeNode {
    id: string
    title: string
    unlocked: boolean
    description: string
    cost: IUpgradeCost
    unlockable: boolean
}

export interface IUpgradeCost {
    xp?: number
    resources?: ItemStack[]
}

export interface CharacterStats {
    HP: UpgradableStat
    RP: UpgradableStat
    AP: number
    dexterity: number
    luck: number
    moxie: number
    SHD: number
    fortitude: number
    stamina: number
    constitution: number
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

export type TileNode =
    | AscensionNode
    | MerchantNode
    | ResourceNode
    | DungeonNode
    | EncounterNode

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

export interface EncounterNode extends AbstractTileNode<"encounter"> {
    enemy: EnemyName
    battleContext: IBattleContext | null
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
    const hp = CLASSES[_class]["HP"][0] //"HP"][0], CLASSES[_class]["HP"][1])
    const rp = CLASSES[_class]["RP"][0] //getRandomInt(CLASSES[_class]["RP"][0], CLASSES[_class]["RP"][1])

    const myClass = CLASSES[_class]

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
            AP: myClass.stamina,
            constitution: myClass.constitution,
            dexterity: myClass.dexterity,
            fortitude: myClass.fortitude,
            luck: myClass.luck,
            moxie: myClass.moxie,
            SHD: myClass.fortitude,
            stamina: myClass.stamina
        },
        currentTile: generateTile(1)
    } as GameState
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

export const getMaxRPUpgradeCost: (
    char: CorrectedCharacter
) => IUpgradeCost = char => {
    return {
        resources: [
            {
                id: "stamina_shard",
                amount: char.gameState.stats.RP.max + 1,
                components: {}
            }
        ]
    }
}

export const getMaxHPUpgradeCost: (
    char: CorrectedCharacter
) => IUpgradeCost = char => {
    return {
        resources: [
            {
                id: "life_shard",
                amount: char.gameState.stats.HP.max + 1,
                components: {}
            }
        ]
    }
}

export const doCharUpgradeLookup: (
    id: string,
    char: CorrectedCharacter
) => IUpgradeNode = (id, char) => {
    if (id === "maxHP") {
        const myCharHP = char.gameState.stats.HP
        const cost = getMaxHPUpgradeCost(char)
        return {
            id,
            title: "Max HP",
            description:
                myCharHP.max === myCharHP.upgradableMax
                    ? `Max HP cannot be upgraded further!`
                    : `Max HP ${myCharHP.max} -> ${myCharHP.max + 1}`,
            cost,
            unlocked: myCharHP.max === myCharHP.upgradableMax,
            unlockable:
                myCharHP.max !== myCharHP.upgradableMax &&
                hasItemStacks(cost.resources || [], char.gameState.inventory)
                    .result === ActionResult.SUCCESS
        } as IUpgradeNode
    } else if (id === "maxRP") {
        const myCharRP = char.gameState.stats.RP
        const cost = getMaxRPUpgradeCost(char)
        return {
            id,
            title: "Max RP",
            description:
                myCharRP.max === myCharRP.upgradableMax
                    ? `Max RP cannot be upgraded further!`
                    : `Max RP ${myCharRP.max} -> ${myCharRP.max + 1}`,
            cost,
            unlocked: myCharRP.max === myCharRP.upgradableMax,
            unlockable:
                myCharRP.max !== myCharRP.upgradableMax &&
                hasItemStacks(cost.resources || [], char.gameState.inventory)
                    .result === ActionResult.SUCCESS
        } as IUpgradeNode
    } else {
        if (Object.keys(char.equipment).filter(e => id.includes(e)).length) {
            console.log("FOUND EQUIPMENT!")
            const equipId = id.split("_refining_")[0]
            const refiningLv = id.split("_refining_")[1]
            const equipEntry = getEquipmentById(equipId, char.equipment)
            const equipEntryLevel = equipEntry.refining.levels.filter(
                l => l.id === refiningLv
            )[0]
            return {
                id,
                title: equipEntryLevel.name + " " + equipEntry.name,
                unlocked: equipEntryLevel.unlocked,
                cost: equipEntryLevel.cost,
                description: equipEntryLevel.description,
                unlockable:
                    (!equipEntryLevel.cost.resources?.length ||
                        hasItemStacks(
                            equipEntryLevel.cost.resources,
                            char.gameState.inventory
                        ).result === ActionResult.SUCCESS) &&
                    !equipEntryLevel.unlocked
            }
        } else if (Object.keys(char.weapons).filter(w => id.includes(w))) {
            console.log("FOUND WEAPON!")
            if (id.includes("_refining_")) {
                const weaponId = id.split("_refining_")[0]
                const refiningLv = id.split("_refining_")[1]
                const weaponEntry = getWeaponById(weaponId, char.weapons)
                const weaponEntryLevel = weaponEntry.refining.levels.filter(
                    l => l.id === refiningLv
                )[0]
                return {
                    id,
                    title: weaponEntryLevel.name + " " + weaponEntry.name,
                    unlocked: weaponEntryLevel.unlocked,
                    cost: weaponEntryLevel.cost,
                    description: weaponEntryLevel.description,
                    unlockable:
                        (!weaponEntryLevel.cost.resources?.length ||
                            hasItemStacks(
                                weaponEntryLevel.cost.resources,
                                char.gameState.inventory
                            ).result === ActionResult.SUCCESS) &&
                        !weaponEntryLevel.unlocked
                }
            } else {
                const weaponId = id.split(":")[0]
                const skillId = id.split(":")[1].split("#")[0]
                const skillLevel = id.split(":")[1].split("#")[1]
                const weaponEntry = getWeaponById(weaponId, char.weapons)
                const skillEntryLevel = weaponEntry.skills.levels.filter(
                    l => l.id === id
                )[0]
                return {
                    id,
                    title: weaponEntry.name + ": " + skillEntryLevel.name,
                    unlocked: skillEntryLevel.unlocked,
                    cost: skillEntryLevel.cost,
                    description: skillEntryLevel.description,
                    unlockable:
                        (!skillEntryLevel.cost.resources?.length ||
                            hasItemStacks(
                                skillEntryLevel.cost.resources,
                                char.gameState.inventory
                            ).result === ActionResult.SUCCESS) &&
                        (!skillEntryLevel.cost.xp ||
                            skillEntryLevel.unlockProgress >=
                                skillEntryLevel.cost.xp) &&
                        !skillEntryLevel.unlocked
                }
            }
        }
        return {
            id,
            cost: {
                resources: []
            },
            description: "",
            title: "",
            unlockable: false,
            unlocked: false
        } as IUpgradeNode
    }
}
