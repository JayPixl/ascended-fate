import { useContext } from "react"
import { GameContext } from "~/utils/gamecontext"

export default function GameModal({}: {}) {
    const { context, handler } = useContext(GameContext)
    return handler && context?.screenContext.modal ? (
        <>
            <div
                className="w-full h-full z-40 bg-opacity-50 bg-neutral-900 fixed inset-0 flex justify-center items-center"
                onClick={() => handler.closeModal()}
            ></div>
            <div className="w-full h-full z-50 pointer-events-none fixed inset-0 flex justify-center items-center">
                <div className="bg-neutral-700 p-8 rounded-lg pointer-events-auto">
                    {context.screenContext.modal.type === "upgrade" ? (
                        <>{context.screenContext.modal.node.id}</>
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
