import { ItemStack } from "~/utils/engine/lib/generation"
import RenderedItemStack from "./RenderedItemStack"

export default function ItemStackNodeInfoList({
    title,
    stacks,
    usages
}: {
    title: string
    stacks: ItemStack[]
    usages: number
}) {
    return (
        <div className="flex flex-col">
            <div className="font-semibold">
                {title} ({usages} Remaining)
            </div>
            <div className="flex flex-row">
                {stacks.map(stack => (
                    <RenderedItemStack itemStack={stack} />
                ))}
            </div>
        </div>
    )
}
