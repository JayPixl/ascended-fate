import { TileNode } from "~/utils/engine/gamestate"
import ItemStackNodeInfoList from "./ItemStackNodeInfoList"
import { GameContext, GameContextHandler } from "~/utils/gamecontext"
import { useContext } from "react"

export default function ActionNode({
    node,
    index
}: {
    node: TileNode
    index: number
}) {
    const { context, handler } = useContext(GameContext)
    return (
        <div className="w-full flex flex-col">
            <div className="">{node.title}</div>
            {node.type === "resource" ? (
                <ItemStackNodeInfoList
                    stacks={node.pool}
                    usages={node.usages}
                    title="Possible Resources"
                />
            ) : (
                <></>
            )}

            {node.type === "resource" ? (
                <button
                    disabled={
                        !context ||
                        node.usages === 0 ||
                        node.APCost > context?.character.gameState.stats.AP
                    }
                    onClick={() => handler!.collectResource(index)}
                >
                    Collect (1 AP)
                </button>
            ) : node.type === "encounter" ? (
                <button
                    disabled={
                        !context ||
                        node.usages === 0 ||
                        node.APCost > context?.character.gameState.stats.AP
                    }
                    onClick={() => handler!.doEncounter(index)}
                >
                    Battle (1 AP)
                </button>
            ) : (
                <></>
            )}
        </div>
    )
}
