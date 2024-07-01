import { CorrectedCharacter } from "../types"
import { EncounterNode } from "./gamestate"
import { SkillName } from "./lib/skills"

export const createBattleContext: (
    char: CorrectedCharacter,
    node: EncounterNode
) => IBattleContext = (char, node) => {}

export interface IBattleContext {
    participants: Record<string, IBattleParticipant>
    turns: IPreTurn & ICombatTurn & IRecoveryTurn
}

export interface IBattleParticipant {
    stats: IBattleStats
    skills: SkillName[]
    status_effects: IStatusEffect[]
    stationary_effects: IStationaryEffect[]
}

export interface IStationaryEffect {
    id: string
    source: IBattleSource
    level: number
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
