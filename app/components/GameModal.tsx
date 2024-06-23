import { useContext } from "react"
import { GameContext } from "~/utils/gamecontext"
import RenderedItemStack from "./RenderedItemStack"

export default function GameModal({}: {}) {
    const { context, handler } = useContext(GameContext)
    return handler && context?.screenContext.modal ? (
        <>
            <div
                className="w-full h-full z-40 bg-opacity-50 bg-neutral-900 fixed inset-0 flex justify-center items-center"
                onClick={() => handler.closeModal()}
            ></div>
            <div className="w-full h-full z-50 pointer-events-none fixed inset-0 flex justify-center items-center">
                <div className="bg-neutral-700 p-8 rounded-lg pointer-events-auto flex flex-col">
                    {context.screenContext.modal.type === "upgrade" ? (
                        <>
                            <div className="self-start font-bold text-xl">
                                {context.screenContext.modal.node.title}
                            </div>
                            <div className="">
                                {context.screenContext.modal.node.description}
                            </div>
                            {context.screenContext.modal.node.unlocked ? (
                                <></>
                            ) : (
                                <>
                                    {context.screenContext.modal.node.cost
                                        .resources ? (
                                        <div className="flex flex-row w-full">
                                            {context.screenContext.modal.node.cost.resources.map(
                                                r => (
                                                    <RenderedItemStack
                                                        itemStack={r}
                                                    />
                                                )
                                            )}
                                        </div>
                                    ) : (
                                        <></>
                                    )}
                                    {context.screenContext.modal.node.cost
                                        .xp ? (
                                        <div className="w-full">
                                            ? /{" "}
                                            {
                                                context.screenContext.modal.node
                                                    .cost.xp
                                            }{" "}
                                            XP
                                        </div>
                                    ) : (
                                        <></>
                                    )}
                                    {context.screenContext.modal.node
                                        .unlockable ? (
                                        <div
                                            className="flex flex-row w-full"
                                            onClick={() =>
                                                handler.upgradeNode(
                                                    context.screenContext.modal
                                                        ?.node.id || ""
                                                )
                                            }
                                        >
                                            UNLOCK
                                        </div>
                                    ) : (
                                        <div className="w-full">
                                            Can't Unlock
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        <></>
                    )}
                </div>
            </div>
        </>
    ) : (
        <></>
    )
}
