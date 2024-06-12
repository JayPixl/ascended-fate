import { Character, User } from "@prisma/client"
import type { LoaderFunction, MetaFunction } from "@remix-run/node"
import { Link, redirect, useLoaderData } from "@remix-run/react"
import axios, { Axios, AxiosResponse } from "axios"
import { act, createContext, useContext, useEffect, useState } from "react"
import ActionNode from "~/components/ActionNode"
import GameScreen from "~/components/GameScreen"
import Navbar from "~/components/Navbar"
import { IGameContext, GameState } from "~/utils/engine/gamestate"
import { BIOMES } from "~/utils/engine/lib/generation"
import { GameContext, GameContextHandler, doAction } from "~/utils/gamecontext"
import { CorrectedCharacter, UserWithCharacters } from "~/utils/types"
import { createGuestUser, getUser } from "~/utils/users.server"

export const meta: MetaFunction = () => {
    return [
        { title: "New Remix App" },
        { name: "description", content: "Welcome to Remix!" }
    ]
}

export const loader: LoaderFunction = async ({ request }) => {
    const { user } = (await getUser(request)) as { user: UserWithCharacters }

    if (!user) return redirect("/play")

    const activeCharacter = user.characters.filter(
        char => char.status === "ACTIVE"
    )?.[0]

    if (!activeCharacter) return redirect("new")

    return { user, activeCharacter }
}

export default function Campaign() {
    let { user, activeCharacter } = useLoaderData() as unknown as {
        user: UserWithCharacters
        activeCharacter: CorrectedCharacter
    }

    const [gameContext, setGameContext] = useState<IGameContext>({
        user,
        character: activeCharacter,
        screenContext: {
            activePage: "main"
        }
    })

    const [contextHandler] = useState(
        new GameContextHandler(gameContext, setGameContext)
    )

    return (
        <GameContext.Provider
            value={{ context: gameContext, handler: contextHandler }}
        >
            <Navbar user={user} />
            <div className="w-full h-[90vh] flex flex-col justify-center items-center">
                <div className="w-full h-[10vh] flex justify-center items-center">
                    <div
                        className=""
                        onClick={() => contextHandler.setScreen("main")}
                    >
                        MAIN
                    </div>
                    <div
                        className=""
                        onClick={() => contextHandler.setScreen("path")}
                    >
                        PATH
                    </div>
                </div>
                <GameScreen id="main" permanent={true}>
                    Hello World
                </GameScreen>
                <GameScreen id="path" permanent={true}>
                    <div className="flex flex-col items-center">
                        <div className="">
                            {gameContext.character.gameState.stats.AP} AP
                        </div>
                        <div className="font-bold">
                            {
                                BIOMES[
                                    gameContext.character.gameState.currentTile
                                        .biome
                                ].title
                            }
                        </div>
                        <div className="flex flex-col">
                            {gameContext.character.gameState.currentTile.tileNodes.map(
                                (node, idx) => (
                                    <ActionNode node={node} index={idx} />
                                )
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() =>
                            doAction({ type: "new-tile" }, res => {
                                res.data?.character
                                    ? setGameContext({
                                          ...gameContext,
                                          character: res.data.character
                                      })
                                    : console.log(res?.data.error)
                            })
                        }
                    >
                        NEW TILE
                    </button>
                </GameScreen>
                <div className="w-full bg-neutral-900 h-[10vh] flex items-center justify-center">
                    LOGS
                </div>
            </div>
        </GameContext.Provider>
    )
}
