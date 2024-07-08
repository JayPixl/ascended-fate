import { deepCopy } from "~/routes/play_.campaign_.action"
import { CorrectedCharacter } from "../types"
import { EncounterNode } from "./gamestate"
import { STATUS_EFFECTS } from "./lib/battle-effects"
import { ENEMIES, EnemyName } from "./lib/enemies"
import { SkillName } from "./lib/skills"
import { ISkillEntry, WeaponName, getWeaponById } from "./lib/weapons"
import { evolve } from "evolve-ts"
import { getRandomInt } from "../name-generator"

export const getCurrentSkills: (
    char: CorrectedCharacter
) => ISkillEntry[] = char => {
    let skills: ISkillEntry[] = []
    Object.entries(char.weapons).map(([weaponId, weaponEntry]) => {
        getWeaponById(weaponId as WeaponName, char.weapons).skills.current.map(
            s => skills.push(s)
        )
    })
    return skills
}

export const createEncounterBattleContext: (
    char: CorrectedCharacter,
    node: EncounterNode
) => IBattleContext = (char, node) => {
    return {
        participants: {
            ["@" + char.id]: {
                skills: getCurrentSkills(char).map(skill => skill.id),
                stats: {
                    HP: {
                        current: char.gameState.stats.HP.current,
                        max: char.gameState.stats.HP.max
                    },
                    RP: {
                        current: char.gameState.stats.RP.current,
                        max: char.gameState.stats.RP.max
                    },
                    DEF: {
                        base: 0
                    },
                    EDEF: {
                        base: 0,
                        electric: 0,
                        fire: 0,
                        ice: 0
                    },
                    MDEF: {
                        base: 0
                    },
                    dexterity: char.gameState.stats?.dexterity || 0,
                    luck: char.gameState.stats?.luck || 0,
                    moxie: char.gameState.stats?.moxie || 0,
                    SHD: {
                        current: char.gameState.stats?.SHD || 0,
                        max: char.gameState.stats?.fortitude || 0
                    }
                },
                stationary_effects: [],
                status_effects: []
            },
            [node.enemy]: {
                stats: {
                    DEF: ENEMIES[node.enemy].DEF,
                    MDEF: ENEMIES[node.enemy].MDEF,
                    EDEF: ENEMIES[node.enemy].EDEF,
                    HP: {
                        current: ENEMIES[node.enemy].HP,
                        max: ENEMIES[node.enemy].HP
                    },
                    RP: {
                        current: ENEMIES[node.enemy].RP,
                        max: ENEMIES[node.enemy].RP
                    },
                    SHD: {
                        current: ENEMIES[node.enemy].fortitude,
                        max: ENEMIES[node.enemy].fortitude
                    },
                    dexterity: ENEMIES[node.enemy].dexterity,
                    luck: ENEMIES[node.enemy].luck,
                    moxie: ENEMIES[node.enemy].moxie
                },
                skills: ENEMIES[node.enemy].skills,
                stationary_effects: [],
                status_effects: []
            }
        },
        turns: {
            "pre-0": {
                actions: []
            }
        }
    } as IBattleContext
}

// TODO Add start of battle effects

export const doRound: (
    char: CorrectedCharacter,
    data: Record<string, any>
) => { character?: CorrectedCharacter; error?: string } = (char, data) => {
    const activeBattleIndex = getActiveBattleIndex(char)

    if (activeBattleIndex === -1) return { error: "No active Battle!" }

    let battleContext = (
        char.gameState.currentTile.tileNodes[activeBattleIndex] as EncounterNode
    ).battleContext

    if (battleContext === null)
        return { error: "Corrupted Battle Context Data!" }

    const lastTurn = getBattleTurnKey(battleContext)

    if (!lastTurn || lastTurn.split("-")[0] === "recover") {
        // Do Pre Round
        const result = doPreRound(battleContext)
        if (result.errors.length) console.log(result.errors)
        return {
            character: fixBattleCharacter(
                char,
                result.battleContext,
                activeBattleIndex
            )
        }
    } else if (lastTurn.split("-")[0] === "pre") {
        // Do Battle Round
        if (
            !data?.selection ||
            !battleContext.participants["@" + char.id].skills.filter(
                sk => sk === data.selection
            ).length
        ) {
            return {
                error: "Invalid selection"
            }
        }
        const enemy = getBattleEnemy(battleContext)
        const selection = {
            ["@" + char.id]: [data.selection as SkillName],
            [enemy[0]]: [
                enemy[1].skills[
                    getRandomInt(0, enemy[1].skills.length - 1)
                ] as SkillName
            ]
        }
        const result = doBattleRound(battleContext, selection)
    } else if (lastTurn.split("-")[0] === "combat") {
        // Do Recover Round
    } else {
        return { error: "Invalid Round Data!" }
    }
}

const doPreRound: (battleContext: IBattleContext) => {
    battleContext: IBattleContext
    errors: string[]
} = battleContext => {
    const battleContextHandler = new BattleContextHandler(battleContext)

    const foundEffects = getBattleEffects("BOT", battleContextHandler.context)

    foundEffects.length && console.log(JSON.stringify(foundEffects))

    return {
        battleContext: battleContextHandler.context,
        errors: []
    }
}

const doBattleRound: (
    battleContext: IBattleContext,
    selected: Record<string, SkillName[]>
) => { battleContext: IBattleContext; errors: string[] } = (
    battleContext,
    selected
) => {
    const battleContextHandler = new BattleContextHandler(battleContext)

    const foundEffects = getBattleEffects("BOT", battleContextHandler.context)

    foundEffects.length && console.log(JSON.stringify(foundEffects))

    battleContextHandler.doTurn({
        [nextTurn(getBattleTurnKey(battleContext)!)]: { actions: [] }
    })

    return {
        battleContext: battleContextHandler.context,
        errors: []
    }
}

const fixBattleCharacter: (
    character: CorrectedCharacter,
    battleContext: IBattleContext,
    activeBattleIndex: number
) => CorrectedCharacter = (char, battleContext, activeBattleIndex) => {
    return evolve(
        {
            gameState: {
                stats: {
                    HP: battleContext.participants["@" + char.id].stats.HP,
                    RP: battleContext.participants["@" + char.id].stats.RP
                },
                currentTile: {
                    tileNodes: char.gameState.currentTile.tileNodes.map(
                        (node, idx) =>
                            idx === activeBattleIndex
                                ? { ...node, battleContext }
                                : node
                    )
                }
            }
        },
        char
    )
}

const getBattleEnemy: (
    battleContext: IBattleContext
) => [EnemyName, IBattleParticipant] = battleContext => {
    return (
        Object.entries(battleContext.participants) as [
            EnemyName,
            IBattleParticipant
        ][]
    ).filter(([n, e]) => n.indexOf("@") === -1)[0]
}

const getBattleEffects: (
    type: string,
    battleContext: IBattleContext
) => ExtendedUnifiedEffect[] = (type, battleContext) => {
    let foundEffects: ExtendedUnifiedEffect[] = []

    Object.entries(battleContext.participants).map(([userId, userEntry]) => {
        userEntry.stationary_effects.map(eff => {
            const statusEntry =
                STATUS_EFFECTS[eff.id as keyof typeof STATUS_EFFECTS]
            if (statusEntry && statusEntry.type === type) {
                foundEffects.push({
                    ...eff,
                    tickImmune: false,
                    turns: -1,
                    usages: -1,
                    user: userId
                })
            }
        })
        userEntry.status_effects.map(eff => {
            const statusEntry =
                STATUS_EFFECTS[eff.id as keyof typeof STATUS_EFFECTS]
            if (statusEntry && statusEntry.type === type) {
                foundEffects.push({
                    ...eff,
                    user: userId
                })
            }
        })
    })

    return foundEffects
}

class BattleContextHandler {
    public context: IBattleContext

    constructor(context: IBattleContext) {
        this.context = deepCopy(context)
    }

    public doTurn(turn: ICombatTurn | IPreTurn | IRecoveryTurn): void {
        this.context = evolve(
            {
                turns: {
                    ...turn
                }
            },
            this.context
        )
    }
}

export const getBattleTurnKey: (
    battleContext: IBattleContext
) => string | null = battleContext => {
    const turnKeys = Object.keys(battleContext.turns)

    if (turnKeys.length === 0) return null

    let compareIndex = 0
    let lastMatch = "pre-" + 0

    while (true) {
        const keysfromRound = turnKeys.filter(
            k => k.split("-")[1] === compareIndex.toString()
        )

        if (!keysfromRound.length) {
            if (!lastMatch) return null
            return lastMatch
        }

        if (keysfromRound.includes("pre-" + compareIndex)) {
            lastMatch = "pre-" + compareIndex
            if (keysfromRound.includes("combat-" + compareIndex)) {
                lastMatch = "combat-" + compareIndex
                if (keysfromRound.includes("recover-" + compareIndex)) {
                    lastMatch = "recover-" + compareIndex
                } else {
                    return lastMatch
                }
            } else {
                return lastMatch
            }
        } else {
            return lastMatch
        }

        compareIndex++
    }
}

export const nextTurn: (prevTurn?: string) => string = prevTurn => {
    return prevTurn?.indexOf("recovery") !== -1
        ? "pre-" + prevTurn?.split("-")[1]
        : prevTurn?.indexOf("pre") !== -1
        ? "combat-" + prevTurn?.split("-")[1]
        : prevTurn?.indexOf("combat") !== -1
        ? "recovery-" + prevTurn?.split("-")[1]
        : "pre-0"
}

export const getActiveBattleIndex: (
    char: CorrectedCharacter
) => number = char => {
    if (char.gameState.currentTile.status !== "battle") return -1

    const nodesWithBattleContext: EncounterNode[] =
        char.gameState.currentTile.tileNodes.filter(
            n => n.type === "encounter" && n.battleContext !== null
        ) as EncounterNode[]

    if (!(nodesWithBattleContext.length === 1)) return -1

    return char.gameState.currentTile.tileNodes.indexOf(
        nodesWithBattleContext[0]
    )
}

export interface IBattleContext {
    participants: Record<string, IBattleParticipant>
    turns: IPreTurn & ICombatTurn & IRecoveryTurn
}

export interface IBattleParticipant {
    stats: IBattleStats
    skills: string[]
    status_effects: IStatusEffect[]
    stationary_effects: IStationaryEffect[]
}

export interface ExtendedUnifiedEffect extends IStatusEffect {
    user: string
}

export interface IStationaryEffect {
    id: string
    source: IBattleSource
    data: Record<string, any>
}

export interface IStatusEffect extends IStationaryEffect {
    usages: number
    turns: number
    tickImmune: boolean
}

export interface IBattleSource {
    type: "equipment" | "skill" | "status_effect" | "stationary_effect" | "item"
    id: string
    user: string
}

export type IPreTurn = Record<
    `pre-${number}`,
    {
        actions: IBattleAction[]
    }
>

export type ICombatTurn = Record<
    `combat-${number}`,
    {
        selected: Record<string, SkillName[]>
        actions: IBattleAction[]
    }
>

export type IRecoveryTurn = Record<
    `recover-${number}`,
    {
        actions: IBattleAction[]
    }
>

export interface IBattleStats {
    HP: IMaxableStat
    RP: IMaxableStat
    SHD: IMaxableStat
    DEF: {
        base: number
    }
    MDEF: {
        base: number
    }
    EDEF: {
        base: number
        fire?: number
        ice?: number
        electric?: number
    }
    luck: number
    dexterity: number
    moxie: number
}

export interface IMaxableStat {
    current: number
    max: number
}

export type IBattleAction = DamageAction

export interface AbstractBattleAction<T extends string> {
    type: T
}

export interface DamageAction extends AbstractBattleAction<"damage"> {
    type: "damage"
}
