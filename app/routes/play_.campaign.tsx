import type { LoaderFunction, MetaFunction } from "@remix-run/node"
import { redirect, useLoaderData } from "@remix-run/react"
import { useState } from "react"
import ActionNode from "~/components/ActionNode"
import GameModal from "~/components/GameModal"
import GameScreen from "~/components/GameScreen"
import Navbar from "~/components/Navbar"
import RenderedItemStack from "~/components/RenderedItemStack"
import SkillTree from "~/components/SkillTree"
import { IGameContext } from "~/utils/engine/gamestate"
import { CLASSES } from "~/utils/engine/lib/classes"
import {
    EQUIPMENT,
    getEquipmentById,
    getEquipmentNodes
} from "~/utils/engine/lib/equipment"
import { BIOMES } from "~/utils/engine/lib/generation"
import { RACES } from "~/utils/engine/lib/races"
import { SKILLS } from "~/utils/engine/lib/skills"
import { WEAPONS, getWeaponNodes } from "~/utils/engine/lib/weapons"
import { ClassName, RaceName } from "~/utils/engine/skill-tree"
import { GameContext, GameContextHandler } from "~/utils/gamecontext"
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
            <div className="w-full h-[90vh] flex flex-col justify-center items-center relative">
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
                    <div
                        className=""
                        onClick={() => contextHandler.setScreen("skills")}
                    >
                        SKILLS
                    </div>
                </div>
                <GameScreen id="main">
                    <div className="flex flex-col items-center">
                        <div className="text-lg">
                            {activeCharacter.name} (
                            {RACES[activeCharacter.race as RaceName].name} /{" "}
                            {CLASSES[activeCharacter.class as ClassName].name})
                        </div>
                        <div className="font-bold">INVENTORY</div>
                        <div className="">
                            {gameContext.character.gameState.inventory.map(
                                item => (
                                    <RenderedItemStack itemStack={item} />
                                )
                            )}
                        </div>
                        <div className="font-bold">STATS</div>
                        <div className="">
                            HP:{" "}
                            {gameContext.character.gameState.stats.HP.current} /{" "}
                            {gameContext.character.gameState.stats.HP.max}
                        </div>
                        <div className="">
                            RP:{" "}
                            {gameContext.character.gameState.stats.RP.current} /{" "}
                            {gameContext.character.gameState.stats.RP.max}
                        </div>
                        <div className="font-bold">EQUIPMENT</div>
                        <div className="">
                            {Object.entries(activeCharacter.equipment).map(
                                equip => (
                                    <>
                                        <div className="font-bold">
                                            {
                                                EQUIPMENT[
                                                    equip[0] as keyof typeof EQUIPMENT
                                                ].name
                                            }
                                        </div>
                                        <div className="">REFINEMENT</div>
                                        <div className="">
                                            {Object.entries(
                                                equip[1].refining
                                            ).map(refNode => (
                                                <div className="">
                                                    {EQUIPMENT[
                                                        equip[0] as keyof typeof EQUIPMENT
                                                    ].refining[
                                                        refNode[0] as keyof (typeof EQUIPMENT)[keyof typeof EQUIPMENT]["refining"]
                                                    ].name +
                                                        ": " +
                                                        ((refNode[1] as any)
                                                            .unlocked
                                                            ? "UNLOCKED"
                                                            : "LOCKED")}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )
                            )}
                        </div>
                        <div className="font-bold">WEAPONS</div>
                        <div className="">
                            {Object.entries(activeCharacter.weapons).map(
                                weapon => (
                                    <>
                                        <div className="font-bold">
                                            {
                                                WEAPONS[
                                                    weapon[0] as keyof typeof WEAPONS
                                                ].name
                                            }
                                        </div>
                                        <div className="">REFINEMENT</div>
                                        <div className="">
                                            {Object.entries(
                                                weapon[1].refining
                                            ).map(refNode => (
                                                <div className="">
                                                    {WEAPONS[
                                                        weapon[0] as keyof typeof WEAPONS
                                                    ].refining[
                                                        refNode[0] as keyof (typeof WEAPONS)[keyof typeof WEAPONS]["refining"]
                                                    ].name +
                                                        ": " +
                                                        ((refNode[1] as any)
                                                            .unlocked
                                                            ? "UNLOCKED"
                                                            : "LOCKED")}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="">SKILLS</div>
                                        <div className="">
                                            {Object.entries(
                                                weapon[1].skills
                                            ).map(skill => (
                                                <>
                                                    <div className="">
                                                        {
                                                            SKILLS[
                                                                skill[0] as keyof typeof SKILLS
                                                            ].name
                                                        }
                                                    </div>
                                                    {Object.entries(
                                                        skill[1] as Record<
                                                            any,
                                                            any
                                                        >
                                                    ).map(lev => (
                                                        <>
                                                            <div className="">
                                                                {lev[0].toString()}
                                                                {": "}
                                                                {lev[1].unlocked
                                                                    ? "UNLOCKED"
                                                                    : "LOCKED"}
                                                            </div>
                                                        </>
                                                    ))}
                                                </>
                                            ))}
                                        </div>
                                    </>
                                )
                            )}
                        </div>
                        <div
                            onClick={() =>
                                Object.entries(activeCharacter.equipment).map(
                                    ([eId, eEntry]) => {
                                        getEquipmentById(
                                            eId,
                                            activeCharacter.equipment
                                        )
                                    }
                                )
                            }
                        >
                            YUMMY CHICKEN NUGGIES
                        </div>
                    </div>
                </GameScreen>
                <GameScreen id="path">
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
                        <button onClick={() => contextHandler.travel()}>
                            TRAVEL
                        </button>
                        <button onClick={() => contextHandler.rest()}>
                            REST
                        </button>
                    </div>
                </GameScreen>
                <GameScreen id="skills">
                    <div className="flex items-center justify-center w-full h-full">
                        <SkillTree
                            type={"character"}
                            nodes={[
                                {
                                    id: "main",
                                    name: activeCharacter.name,
                                    children: ["core", "equipment", "weapons"],
                                    entry: true,
                                    open: true,
                                    type: "static"
                                },
                                {
                                    id: "core",
                                    name: "Core",
                                    children: ["maxHp", "maxRp"],
                                    entry: false,
                                    open: false,
                                    type: "collapsible"
                                },
                                {
                                    id: "maxHp",
                                    name: "Max HP",
                                    children: [],
                                    entry: false,
                                    open: false,
                                    type: "collapsible"
                                },
                                {
                                    id: "maxRp",
                                    name: "Max RP",
                                    children: [],
                                    entry: false,
                                    open: false,
                                    type: "collapsible"
                                },
                                ...getEquipmentNodes(activeCharacter.equipment),
                                ...getWeaponNodes(activeCharacter.weapons)
                            ]}
                        />
                    </div>
                </GameScreen>
                <GameModal />
                <div className="w-full bg-neutral-900 h-[10vh] flex items-center justify-center">
                    LOGS
                </div>
            </div>
        </GameContext.Provider>
    )
}
