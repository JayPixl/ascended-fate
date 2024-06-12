import { ITEMS, ItemStack } from "~/utils/engine/lib/generation"

export default function RenderedItemStack({
    itemStack
}: {
    itemStack: ItemStack
}) {
    return (
        <div className="flex flex-col">
            <div className="font-semibold">
                {ITEMS[itemStack.id].name} x {itemStack.amount}
            </div>
        </div>
    )
}
