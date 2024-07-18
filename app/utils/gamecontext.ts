import { createContext } from "react"
import {
    EncounterNode,
    IGameContext,
    doCharUpgradeLookup
} from "./engine/gamestate"
import axios, { AxiosResponse } from "axios"
import { CorrectedCharacter } from "./types"
import { evolve, unset } from "evolve-ts"
import {
    getActiveBattleIndex,
    getDeadParticipants
} from "./engine/battlecontext"
import { NavigateFunction, useNavigate } from "@remix-run/react"

export class GameContextHandler {
    private gameContext: IGameContext
    private setGameContextDispatcher: React.Dispatch<
        React.SetStateAction<IGameContext>
    >
    private navigate: NavigateFunction

    constructor(
        gameContext: IGameContext,
        setGameContext: React.Dispatch<React.SetStateAction<IGameContext>>,
        navigate: NavigateFunction
    ) {
        const activeBattleIndex = getActiveBattleIndex(gameContext.character)
        const battleContext =
            activeBattleIndex === -1
                ? undefined
                : (
                      gameContext.character.gameState.currentTile.tileNodes[
                          activeBattleIndex
                      ] as EncounterNode
                  ).battleContext || undefined

        this.gameContext = {
            ...gameContext,
            battleState: battleContext
                ? {
                      context: battleContext
                  }
                : undefined
        }
        this.setGameContextDispatcher = setGameContext
        this.navigate = navigate
    }

    private setGameContext(ctx: IGameContext) {
        this.setGameContextDispatcher(ctx)
        this.gameContext = ctx
    }

    public collectResource(nodeIndex: number) {
        this.doAction<ResourceAction>(
            { type: "resource", index: nodeIndex },
            res => {
                res.data?.character
                    ? this.setGameContext({
                          ...this.gameContext,
                          character: res.data.character
                      })
                    : console.log(res.data?.error)
            }
        )
    }

    public doEncounter(nodeIndex: number) {
        this.doAction<EncounterAction>(
            { type: "encounter", index: nodeIndex },
            res => {
                res.data?.character
                    ? this.setGameContext({
                          ...this.gameContext,
                          character: res.data.character,
                          battleState: {
                              context: (
                                  res.data.character.gameState.currentTile
                                      .tileNodes[nodeIndex] as EncounterNode
                              ).battleContext!
                          }
                      })
                    : console.log(res.data?.error)
            }
        )
    }

    public doCombatAction(selection: string) {
        this.doAction<CombatAction>({ type: "combat", selection }, res => {
            if (res.data?.character) {
                const battleContext = (
                    res.data.character.gameState.currentTile.tileNodes[
                        getActiveBattleIndex(res.data.character)
                    ] as EncounterNode
                ).battleContext!

                this.setGameContext({
                    ...this.gameContext,
                    character: res.data.character,
                    battleState: {
                        context: battleContext
                    }
                })

                if (getDeadParticipants(battleContext).length) {
                    setTimeout(() => this.refreshGamestate(), 5000)
                }
            } else {
                console.log(res.data?.error)
            }
        })
    }

    public refreshGamestate(): void {
        this.doAction<RefreshAction>({ type: "refresh" }, res => {
            if (res.data?.character) {
                if (res.data.character.status !== "ACTIVE") {
                    this.navigate("/play")
                }
                this.setGameContext(
                    evolve(
                        {
                            character: res.data.character,
                            battleState: undefined
                        },
                        this.gameContext
                    )
                )
            } else {
                this.navigate("/play")
            }
        })
    }

    public travel() {
        this.doAction<TravelAction>({ type: "travel" }, res => {
            res.data?.character
                ? this.setGameContext(
                      evolve(
                          { character: res.data.character },
                          this.gameContext
                      )
                  )
                : console.log(res.data?.error)
        })
    }

    public rest() {
        this.doAction<RestAction>({ type: "rest" }, res => {
            res.data?.character
                ? this.setGameContext(
                      evolve(
                          { character: res.data.character },
                          this.gameContext
                      )
                  )
                : console.log(res.data?.error)
        })
    }

    public setScreen(screen: string) {
        this.setGameContext({
            ...this.gameContext,
            screenContext: {
                ...this.gameContext.screenContext,
                activePage: screen
            }
        })
    }

    public openSkillTreeNode(id: string) {
        this.setGameContext(
            evolve(
                {
                    screenContext: {
                        modal: {
                            type: "upgrade",
                            node: doCharUpgradeLookup(
                                id,
                                this.gameContext.character
                            )
                        }
                    }
                },
                this.gameContext
            )
        )
    }

    public closeModal() {
        this.setGameContext(
            evolve({ screenContext: { modal: unset } }, this.gameContext)
        )
    }

    public upgradeNode(id: string) {
        this.doAction<UpgradeNodeAction>({ type: "upgrade", id }, res => {
            res.data?.character
                ? this.setGameContext({
                      ...this.gameContext,
                      character: res.data.character
                  })
                : console.log(res.data?.error)
            this.openSkillTreeNode(id)
        })
    }

    private async doAction<T extends ActionType>(
        params: T["params"] & { type: T["type"] },
        callback: (res: AxiosResponse<T["response"]>) => void = res => {}
    ) {
        const myParams: string[][] = Object.entries(params).map(param => {
            return [param[0], param[1].toString()]
        })
        const searchParams = new URLSearchParams(myParams)
        const res = await axios.get("/play/campaign/action?" + searchParams)
        callback(res)
    }
}

export const GameContext = createContext<{
    context: IGameContext | null
    handler: GameContextHandler | null
}>({ context: null, handler: null })

export type ActionType =
    | ResourceAction
    | TravelAction
    | RestAction
    | UpgradeNodeAction
    | EncounterAction
    | CombatAction
    | RefreshAction

export interface AbstractAction<T extends string> {
    type: T
    params: Record<string, string | number>
    response: Record<string, any>
}

export interface ResourceAction extends AbstractAction<"resource"> {
    params: {
        index: number
    }
    response: {
        error?: string
        character?: CorrectedCharacter
    }
}

export interface RefreshAction extends AbstractAction<"refresh"> {
    response: {
        error?: string
        character?: CorrectedCharacter
    }
}

export interface EncounterAction extends AbstractAction<"encounter"> {
    params: {
        index: number
    }
    response: {
        error?: string
        character?: CorrectedCharacter
    }
}

export interface CombatAction extends AbstractAction<"combat"> {
    params: {
        selection: string
    }
    response: {
        error?: string
        character?: CorrectedCharacter
    }
}

export interface TravelAction extends AbstractAction<"travel"> {
    response: {
        error?: string
        character?: CorrectedCharacter
    }
}

export interface RestAction extends AbstractAction<"rest"> {
    response: {
        error?: string
        character?: CorrectedCharacter
    }
}

export interface UpgradeNodeAction extends AbstractAction<"upgrade"> {
    params: {
        id: string
    }
    response: {
        error?: string
        character?: CorrectedCharacter
    }
}
