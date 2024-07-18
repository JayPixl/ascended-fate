import { ActionResult, deepCopy } from "~/routes/play_.campaign_.action"
import { CorrectedCharacter } from "../types"
import { EncounterNode } from "./gamestate"
import { STATUS_EFFECTS } from "./lib/battle-effects"
import { ENEMIES, EnemyName } from "./lib/enemies"
import { ISkillEntry, WeaponName, getWeaponById } from "./lib/weapons"
import { evolve } from "evolve-ts"
import { append } from "ramda"
import { getRandomInt } from "../name-generator"
import { IBattleSkillEntry, getSkillEntry } from "./lib/skills"

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
        currentTurn: "pre-0",
        participants: {
            ["@" + char.id]: {
                skills: getCurrentSkills(char).map(skill => skill.id),
                queuedRPCost: 0,
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
                queuedRPCost: 0,
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

    const currentTurnType = battleContext.currentTurn.split("-")[0]

    if (currentTurnType === "pre") {
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
    } else if (currentTurnType === "combat") {
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
            ["@" + char.id]: [data.selection],
            [enemy[0]]: [
                enemy[1].skills[getRandomInt(0, enemy[1].skills.length - 1)]
            ]
        }
        const result = doBattleRound(battleContext, selection)
        if (result.errors.length) console.log(result.errors)
        console.log(JSON.stringify(result.battleContext.turns))
        return {
            character: fixBattleCharacter(
                char,
                result.battleContext,
                activeBattleIndex
            )
        }
    } else if (currentTurnType === "recovery") {
        // Do Recover Round
        if (!data?.selection || data.selection !== "recover") {
            return {
                error: "Invalid selection"
            }
        }
        const enemy = getBattleEnemy(battleContext)
        const selection = {
            ["@" + char.id]: [data.selection],
            [enemy[0]]: ["recover"]
        }
        const result = doRecoveryRound(battleContext, selection)
        if (result.errors.length) console.log(result.errors)

        if (getDeadParticipants(result.battleContext).length) {
            return {
                character: fixBattleCharacter(
                    char,
                    result.battleContext,
                    activeBattleIndex
                )
            }
        } else {
            return doRound(
                fixBattleCharacter(
                    char,
                    result.battleContext,
                    activeBattleIndex
                ),
                {}
            )
        }
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
        battleContext: battleContextHandler.finalize(),
        errors: []
    }
}

const doBattleRound: (
    battleContext: IBattleContext,
    selected: Record<string, string[]>
) => { battleContext: IBattleContext; errors: string[] } = (
    battleContext,
    selected
) => {
    const battleContextHandler = new BattleContextHandler(battleContext)

    const skillEntries: Record<string, IBattleSkillEntry> = {}

    Object.entries(selected).map(([userId, skills]) => {
        skillEntries[userId] = getSkillEntry(skills[0])
    })

    // Preliminary Skill Actions

    // Compare types, initiative, determine winner

    let combatResult: ICombatResult = {
        winner: undefined,
        critical: false,
        skills: selected
    }

    const card1 = Object.entries(skillEntries)[0]
    const card2 = Object.entries(skillEntries)[1]

    if (card1[1].type !== card2[1].type) {
        // One wins by type
        const typeWinner = typeBeats(card1[1].type, card2[1].type)
            ? card1[0]
            : card2[0]
        let initiative1 = card1[1].initiative
        let initiative2 = card2[1].initiative

        if (typeWinner === card1[0]) {
            if (initiative1 > initiative2) {
                // Roll for crit

                combatResult = {
                    critical:
                        rollBounded(
                            initiative1 - initiative2,
                            20 -
                                battleContextHandler.context.participants[
                                    card1[0]
                                ].stats.luck
                        ) === ActionResult.SUCCESS,
                    winner: typeWinner,
                    skills: selected
                }
            } else {
                // Roll for dodge

                combatResult = {
                    critical: false,
                    winner:
                        rollBounded(
                            initiative2 - initiative1,
                            20 -
                                battleContextHandler.context.participants[
                                    card2[0]
                                ].stats.dexterity
                        ) === ActionResult.SUCCESS
                            ? undefined
                            : typeWinner,
                    skills: selected
                }
            }
        } else {
            if (initiative2 > initiative1) {
                // Roll for crit

                combatResult = {
                    critical:
                        rollBounded(
                            initiative2 - initiative1,
                            20 -
                                battleContextHandler.context.participants[
                                    card2[0]
                                ].stats.luck
                        ) === ActionResult.SUCCESS,
                    winner: typeWinner,
                    skills: selected
                }
            } else {
                // Roll for dodge

                combatResult = {
                    critical: false,
                    winner:
                        rollBounded(
                            initiative1 - initiative2,
                            20 -
                                battleContextHandler.context.participants[
                                    card1[0]
                                ].stats.dexterity
                        ) === ActionResult.SUCCESS
                            ? undefined
                            : typeWinner,
                    skills: selected
                }
            }
        }
    } else {
        // Tie on type
        let initiative1 = card1[1].initiative
        let initiative2 = card2[1].initiative

        if (initiative1 > initiative2) {
            // Roll for hit

            combatResult = {
                critical: false,
                winner:
                    rollBounded(
                        initiative1 - initiative2,
                        12 -
                            battleContextHandler.context.participants[card1[0]]
                                .stats.moxie
                    ) === ActionResult.SUCCESS
                        ? undefined
                        : card1[0],
                skills: selected
            }
        } else if (initiative2 > initiative1) {
            // Roll for hit

            combatResult = {
                critical: false,
                winner:
                    rollBounded(
                        initiative2 - initiative1,
                        12 -
                            battleContextHandler.context.participants[card2[0]]
                                .stats.moxie
                    ) === ActionResult.SUCCESS
                        ? undefined
                        : card2[0],
                skills: selected
            }
        }
    }

    console.log("COMBAT RESULT")
    console.log(combatResult)

    // Do skill aftermath actions

    // Deal Damage

    if (combatResult.winner) {
        const winningCard =
            combatResult.winner === card1[0] ? card1[1] : card2[1]
        const loserId = combatResult.winner === card1[0] ? card2[0] : card1[0]
        battleContextHandler.damage({
            damage: combatResult.critical
                ? extendDamageEntry({
                      PDMG: {
                          base: getTotalDamage(
                              extendDamageEntry(winningCard.baseDMG),
                              extendDefenseEntry({})
                          )
                      }
                  })
                : extendDamageEntry(winningCard.baseDMG),
            source: {
                type: "skill",
                id: winningCard.id,
                user: combatResult.winner
            },
            target: loserId
        })

        // Queue RP Cost
        battleContextHandler.queueRPCost(
            combatResult.winner,
            winningCard.RPCost
        )
    }

    return {
        battleContext: battleContextHandler.finalize(),
        errors: []
    }
}

const doRecoveryRound: (
    battleContext: IBattleContext,
    selected: Record<string, string[]>
) => {
    battleContext: IBattleContext
    errors: string[]
} = (battleContext, selected) => {
    const battleContextHandler = new BattleContextHandler(battleContext)

    // Do recover RP
    Object.entries(selected).map(([userId, sel]) => {
        if (sel[0] === "recover") {
            battleContextHandler.modifyRP(userId, 1)
        }
    })

    // Do apply RP Cost
    battleContextHandler.applyRPCosts()

    // Do win/lose check

    return {
        battleContext: battleContextHandler.finalize(),
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

const typeBeats: (card1: IAttackType, card2: IAttackType) => boolean = (
    card1,
    card2
) => {
    switch (card1) {
        case IAttackType.FURY: {
            return card2 === IAttackType.VITALITY
        }
        case IAttackType.PRECISION: {
            return card2 === IAttackType.FURY
        }
        case IAttackType.VITALITY: {
            return card2 === IAttackType.PRECISION
        }
    }
}

const rollBounded: (value: number, upperBound: number) => ActionResult = (
    val,
    bound
) => {
    const n: number = getRandomInt(1, bound)
    return n <= val ? ActionResult.SUCCESS : ActionResult.FAIL
}

const extendDamageEntry: (
    damageEntry: Partial<IDamageEntry>
) => IDamageEntry = damageEntry => {
    return deepCopy(
        evolve(damageEntry, {
            DMG: { base: 0 },
            EDMG: { base: 0, electric: 0, fire: 0, ice: 0 },
            MDMG: {
                base: 0
            },
            PDMG: {
                base: 0
            }
        } as IDamageEntry)
    )
}

const extendDefenseEntry: (
    damageEntry: Partial<IDefenseEntry>
) => IDefenseEntry = defenseEntry => {
    return deepCopy(
        evolve(defenseEntry, {
            DEF: { base: 0 },
            EDEF: { base: 0, electric: 0, fire: 0, ice: 0 },
            MDEF: {
                base: 0
            }
        } as IDefenseEntry)
    )
}

const subtractDefense: (
    damageEntry: IDamageEntry,
    defenseEntry: IDefenseEntry
) => IDamageEntry = (damageEntry, defenseEntry) => {
    let workingDamageEntry = deepCopy(damageEntry)
    damageEntry.DMG.base = Math.max(
        0,
        damageEntry.DMG.base - defenseEntry.DEF.base
    )
    damageEntry.MDMG.base = Math.max(
        0,
        damageEntry.MDMG.base - defenseEntry.MDEF.base
    )
    damageEntry.EDMG.base = Math.max(
        0,
        damageEntry.EDMG.base - defenseEntry.EDEF.base
    )
    damageEntry.EDMG.electric = Math.max(
        0,
        damageEntry.EDMG.electric - defenseEntry.EDEF.electric
    )
    damageEntry.EDMG.fire = Math.max(
        0,
        damageEntry.EDMG.fire - defenseEntry.EDEF.fire
    )
    damageEntry.EDMG.ice = Math.max(
        0,
        damageEntry.EDMG.ice - defenseEntry.EDEF.ice
    )
    return workingDamageEntry
}

const getTotalDamage: (
    damageEntry: IDamageEntry,
    defenseEntry: IDefenseEntry
) => number = (damageEntry, defenseEntry) => {
    let newDamageEntry = subtractDefense(damageEntry, defenseEntry)
    return (
        newDamageEntry.DMG.base +
        newDamageEntry.EDMG.base +
        newDamageEntry.MDMG.base +
        newDamageEntry.PDMG.base +
        newDamageEntry.EDMG.electric +
        newDamageEntry.EDMG.fire +
        newDamageEntry.EDMG.ice
    )
}

const getParticipantDefense: (
    context: IBattleContext,
    id: string
) => IDefenseEntry = (context, id) => {
    const participant = context.participants[id]
    return extendDefenseEntry({
        DEF: participant.stats.DEF,
        EDEF: {
            base: participant.stats.EDEF.base,
            electric: participant.stats.EDEF.electric || 0,
            fire: participant.stats.EDEF.fire || 0,
            ice: participant.stats.EDEF.ice || 0
        },
        MDEF: participant.stats.MDEF
    })
}

class BattleContextHandler {
    public context: IBattleContext
    private locked: boolean = false

    constructor(context: IBattleContext) {
        this.context = deepCopy(
            evolve(
                {
                    turns: {
                        [context.currentTurn]: { actions: [] }
                    }
                },
                context
            )
        )
    }

    public finalize(): IBattleContext {
        getDeadParticipants(this.context).map(userId =>
            this.addAction({ type: "death", target: userId })
        )
        this.context.currentTurn = nextTurn(this.context.currentTurn)
        return this.context
    }

    public heal(): void {
        // If HP 0 don't heal unless "reviviable" true
    }

    public damage(damageContext: IDamageContext): void {
        const target = this.context.participants[damageContext.target]

        // Calculate against DEF
        console.log(JSON.stringify(damageContext))
        const totalDamage = getTotalDamage(
            damageContext.damage,
            getParticipantDefense(this.context, damageContext.target)
        )

        // Add Action
        this.addAction({
            type: "damage",
            amount: totalDamage,
            target: damageContext.target
        })

        // Change HP
        this.context = evolve(
            {
                participants: {
                    [damageContext.target]: {
                        stats: {
                            HP: {
                                current: cur => Math.max(0, cur - totalDamage)
                            }
                        }
                    }
                }
            },
            this.context
        )

        // If HP 0 try to revive (Random Phoenix Feather)
    }

    public queueRPCost(target: string, amount: number): void {
        this.context = evolve(
            {
                participants: {
                    [target]: {
                        queuedRPCost: amount
                    }
                }
            },
            this.context
        )
    }

    public modifyRP(
        target: string,
        amount: number,
        clearRPCost: boolean = false
    ) {
        const modifiedAmount =
            clamp(
                this.context.participants[target].stats.RP.current + amount,
                -this.context.participants[target].stats.RP.max,
                this.context.participants[target].stats.RP.max
            ) - this.context.participants[target].stats.RP.current

        // Add Action
        this.addAction({
            type: "modify_rp",
            amount: modifiedAmount,
            target
        })

        // Change HP
        this.context = evolve(
            {
                participants: {
                    [target]: {
                        queuedRPCost: cost => (clearRPCost ? 0 : cost),
                        stats: {
                            RP: {
                                current: cur => cur + modifiedAmount
                            }
                        }
                    }
                }
            },
            this.context
        )
    }

    public applyRPCosts(): void {
        Object.entries(this.context.participants).map(
            ([userId, participantEntry]) => {
                this.modifyRP(userId, participantEntry.queuedRPCost, true)
            }
        )
    }

    public addAction(action: IBattleAction): void {
        this.context = evolve(
            {
                turns: {
                    [this.context.currentTurn]: {
                        actions: append(action)
                    }
                }
            },
            this.context
        )
    }
}

function clamp(num: number, min: number, max: number) {
    return Math.max(Math.min(num, Math.max(min, max)), Math.min(min, max))
}

export const getDeadParticipants: (
    context: IBattleContext
) => string[] = context => {
    let returnList: string[] = []
    Object.entries(context.participants).map(([userId, userEntry]) => {
        if (userEntry.stats.HP.current <= 0) returnList.push(userId)
    })
    return returnList
}

export const getBattleTurnKey: (
    battleContext: IBattleContext
) => string | null = battleContext => {
    const turnKeys = Object.keys(battleContext.turns)

    if (turnKeys.length === 0) return null

    let compareIndex = 0
    let lastMatch = "pre-0"

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
        ? "pre-" + (Number(prevTurn?.split("-")[1]) + 1).toString()
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

export enum IAttackType {
    VITALITY = "VIT",
    FURY = "FRY",
    PRECISION = "PRC"
}

export interface IBattleContext {
    participants: Record<string, IBattleParticipant>
    turns: IPreTurn & ICombatTurn & IRecoveryTurn
    currentTurn: string
}

export interface IBattleParticipant {
    stats: IBattleStats
    skills: string[]
    queuedRPCost: number
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
        selected: Record<string, string[]>
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

export interface IDamageEntry {
    DMG: {
        base: number
    }
    PDMG: {
        base: number
    }
    EDMG: {
        base: number
        fire: number
        electric: number
        ice: number
    }
    MDMG: {
        base: number
    }
}

export type IBattleAction = DamageAction | ModifyRPAction | DeathAction

export interface AbstractBattleAction<T extends string> {
    type: T
}

export interface DamageAction extends AbstractBattleAction<"damage"> {
    type: "damage"
    amount: number
    target: string
}

export interface ModifyRPAction extends AbstractBattleAction<"modify_rp"> {
    type: "modify_rp"
    amount: number
    target: string
}

export interface DeathAction extends AbstractBattleAction<"death"> {
    type: "death"
    target: string
}

export interface ICombatResult {
    winner?: string
    critical: boolean
    skills: Record<string, string[]>
}

export interface IDamageContext {
    damage: IDamageEntry
    source: IBattleSource
    target: string
}

export interface IDefenseEntry {
    DEF: {
        base: number
    }
    EDEF: {
        base: number
        fire: number
        electric: number
        ice: number
    }
    MDEF: {
        base: number
    }
}
