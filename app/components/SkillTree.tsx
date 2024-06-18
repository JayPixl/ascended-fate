import { createContext, useContext, useRef, useState } from "react"
import SkillTreeNode from "./SkillTreeNode"
import { evolve } from "evolve-ts"
import { GameContext } from "~/utils/gamecontext"

export interface ISkillTreeNode {
    // size: "small" | "medium" | "large"
    // borderColor: string
    // color: string
    // imageURL: string
    id: string
    name: string
    entry: boolean
    open: boolean
    type: "static" | "collapsible" | "vanishing"
    children: string[]
}

export interface IExtendedSkillTreeNode extends ISkillTreeNode {
    collapseNodes: string[]
    x: number
    y: number
}

export const SkillTreeContext = createContext<{
    nodes: ISkillTreeNode[]
    handler: SkillTreeHandler
}>({
    nodes: [],
    handler: {
        registerListener: () => {},
        handleClick: () => {},
        setNodeState: () => {}
    }
})

export interface NodeState {
    open: boolean
}

export interface SkillTreeHandler {
    registerListener: (
        id: string,
        callback: (id: string, payload: Record<string, any>) => void
    ) => void
    handleClick: (
        id: string,
        parentId: string,
        nodeState: Record<string, NodeState>
    ) => void
    setNodeState: (newState: Record<string, NodeState>) => void
}

export default function SkillTree({
    nodes,
    type
}: {
    nodes: ISkillTreeNode[]
    type: "character" | "player"
}) {
    let listeners = useRef<
        Record<string, (id: string, payload: Record<string, any>) => void>
    >({})

    const gameContext = useContext(GameContext)

    const handleClick: SkillTreeHandler["handleClick"] = (id, parentId) => {
        console.log(id + " CLICKED!")

        const matchingNode = nodes.filter(n => n.id === id)[0]
        if (!matchingNode) return

        if (matchingNode.type === "collapsible") {
            const parentNode = nodes.filter(n => n.id === parentId)[0]
            if (!parentNode) return

            parentNode.children
                .filter(n => n !== matchingNode.id)
                .map(n => {
                    listeners.current[n](n, { command: "collapse" })
                })

            if (nodeState[matchingNode.id].open) {
                listeners.current[matchingNode.id](matchingNode.id, {
                    command: "collapse"
                })
            } else {
                listeners.current[matchingNode.id](matchingNode.id, {
                    command: "open"
                })
            }
        } else if (
            matchingNode.type === "static" &&
            matchingNode.id !== "main"
        ) {
            if (type === "character") {
                gameContext.handler?.openSkillTreeNode(matchingNode.id)
            }
        }
    }

    const handler: SkillTreeHandler = {
        registerListener: (id, callback) => {
            listeners.current = { ...listeners.current, [id]: callback }
        },
        handleClick,
        setNodeState: newState => {
            setNodeState(n => {
                return { ...n, ...newState }
            })
        }
    }

    const [nodeState, setNodeState] = useState(
        nodes.reduce((acc, n) => {
            acc[n.id] = { open: n.open }
            return acc
        }, {} as Record<string, NodeState>)
    )

    return (
        <SkillTreeContext.Provider value={{ nodes, handler }}>
            <div className="w-[500px] h-[500px] relative bg-neutral-800 border-2 border-neutral-950">
                <div className="absolute left-0 top-0 w-full h-full z-10"></div>
                <SkillTreeNode
                    node={{
                        ...nodes.filter(n => n.entry)[0],
                        collapseNodes: [],
                        x: 0,
                        y: 1
                    }}
                    parentId=""
                    nodeState={nodeState}
                />
            </div>
        </SkillTreeContext.Provider>
    )
}
