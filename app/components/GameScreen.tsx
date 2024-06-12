import { useContext } from "react"
import { GameContext } from "~/utils/gamecontext"

export default function GameScreen({
    children,
    id,
    permanent
}: {
    children: React.ReactNode
    id: string
    permanent: boolean
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
