import { useContext } from "react"
import { GameContext } from "~/utils/gamecontext"

export default function GameScreen({
    children,
    id
}: {
    children: React.ReactNode
    id: string
}) {
    const { context, handler } = useContext(GameContext)
    return (
        <>
            {context && context.screenContext.activePage === id ? (
                <div className="h-full w-full bg-neutral-700">{children}</div>
            ) : (
                <></>
            )}
        </>
    )
}
