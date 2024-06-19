import { useContext, useEffect, useState } from "react"
import {
    IExtendedSkillTreeNode,
    ISkillTreeNode,
    NodeState,
    SkillTreeContext
} from "./SkillTree"

export default function SkillTreeNode({
    node,
    parentId,
    nodeState
}: {
    node: IExtendedSkillTreeNode
    parentId: string
    nodeState: Record<string, NodeState>
}) {
    const { nodes, handler } = useContext(SkillTreeContext)

    const [display, setDisplay] = useState(
        node.collapseNodes.filter(n =>
            nodeState[n] ? !nodeState[n].open : true
        ).length
            ? "hidden"
            : "block"
    )

    useEffect(() => {
        handler.registerListener(node.id, (id, payload) => {
            if (id === node.id) {
                console.log(id + JSON.stringify(payload))
                if (payload.command === "collapse") {
                    handler.setNodeState({ [node.id]: { open: false } })
                } else if (payload.command === "open") {
                    handler.setNodeState({ [node.id]: { open: true } })
                }
            }
        })
        setDisplay(
            node.collapseNodes.filter(n =>
                nodeState[n] ? !nodeState[n].open : true
            ).length
                ? "hidden"
                : "block"
        )
    }, [nodeState])

    function calculateNodeWidth(
        node: ISkillTreeNode,
        callback: (amt: number) => void
    ) {
        node.children.map(id => {
            const matchingNode: ISkillTreeNode = nodes.filter(
                n => n.id === id
            )[0]
            if (!matchingNode) return 0
            callback(Math.max(0, matchingNode.children.length - 1))
            calculateNodeWidth(matchingNode, callback)
        })
    }

    function calculateWidth(childIndex: number) {
        const thisNode: ISkillTreeNode = nodes.filter(
            n => n.id === node.children[childIndex]
        )[0]
        if (!thisNode) return 0
        let w: number = Math.max(1, thisNode.children.length)
        calculateNodeWidth(thisNode, num => {
            w += num
        })
        return w
    }

    function calculateOffset(idx: number) {
        let offset: number = 0

        const centerIndex = (node.children.length - 1) / 2

        if (idx < centerIndex) {
            let compareIndex: number = idx
            while (true) {
                compareIndex++
                if (compareIndex > centerIndex) break
                else if (compareIndex === centerIndex)
                    offset -= calculateWidth(compareIndex)
                else offset -= calculateWidth(compareIndex) * 2
            }
            offset -= calculateWidth(idx)
        } else if (idx > centerIndex) {
            let compareIndex: number = idx
            while (true) {
                compareIndex--
                if (compareIndex < centerIndex) break
                else if (compareIndex === centerIndex)
                    offset += calculateWidth(compareIndex)
                else offset += calculateWidth(compareIndex) * 2
            }
            offset += calculateWidth(idx)
        }
        return offset
    }

    return (
        <>
            <div
                className={`w-8 h-8 bg-white border-red-400 absolute rounded-full border-2 -translate-x-[50%] -translate-y-[50%] z-20 ${
                    display === "block" ? "block" : "hidden"
                }`}
                style={{
                    top: node.y * 50,
                    left: 250 + node.x * 35
                }}
                onClick={() => {
                    console.log(node)
                    handler.handleClick(node.id, parentId, nodeState)
                }}
            >
                <div className="relative w-full h-full group">
                    <div
                        className={`absolute left-[50%] top-16 -translate-x-[50%] -translate-y-[130%] ${
                            // size === "small" ? "p-2 text-sm" :
                            "p-3"
                        } rounded-lg bg-zinc-900 hidden opacity-0 group-hover:block group-hover:opacity-100 group-hover:top-0 transition-all text-primary-light-200 font-semibold`}
                    >
                        {node.name}
                        <div className="absolute left-[50%] bottom-0 -translate-x-[50%] translate-y-[100%] border-transparent border-8 border-t-zinc-900" />
                    </div>
                </div>
            </div>
            <>
                {node.children.map((id, idx) => {
                    const matchingNode: ISkillTreeNode = nodes.filter(
                        n => n.id === id
                    )[0]
                    if (!matchingNode) return <></>

                    const offset =
                        matchingNode.type === "static"
                            ? calculateOffset(idx)
                            : (node.children.length - 1) * -1 + idx * 2

                    const newNode: IExtendedSkillTreeNode = {
                        ...matchingNode,
                        collapseNodes: [
                            ...node.collapseNodes,
                            ...(node.type !== "static" ? [node.id] : [])
                        ],
                        x: node.x + offset,
                        y: node.y + 1
                    }
                    return (
                        <SkillTreeNode
                            node={newNode}
                            parentId={node.id}
                            nodeState={nodeState}
                            key={newNode.id}
                        />
                    )
                })}
            </>
        </>
    )
}
