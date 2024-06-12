import { createContext } from "react"
import { IGameContext } from "./engine/gamestate"
import axios, { AxiosResponse } from "axios"
import { CorrectedCharacter } from "./types"
import { evolve } from "evolve-ts"

export class GameContextHandler {
    private gameContext: IGameContext
    private setGameContext: React.Dispatch<React.SetStateAction<IGameContext>>

    constructor(
        gameContext: IGameContext,
        setGameContext: React.Dispatch<React.SetStateAction<IGameContext>>
    ) {
        this.gameContext = gameContext
        this.setGameContext = setGameContext
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

    public setScreen(screen: string) {
        this.setGameContext({
            ...this.gameContext,
            screenContext: {
                ...this.gameContext.screenContext,
                activePage: screen
            }
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

export const doAction: (
    values: Record<string, string>,
    callback?: (res: AxiosResponse<any, any>) => any
) => Promise<void> = async (values, callback) => {
    const searchParams = new URLSearchParams(values)
    const res = await axios.get("/play/campaign/action?" + searchParams)
    callback && callback(res)
}

export type ActionType = ResourceAction | TravelAction | RestAction

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
