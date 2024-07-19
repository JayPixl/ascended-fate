import { ActionResult } from "~/routes/play_.campaign_.action"
import { BattleContextHandler, IUsageContext } from "../battlecontext"

export const ITEMS = {
    wood: {
        maxStack: 8,
        name: "Wood",
        tags: ["resource", "wood"]
    },
    life_shard: {
        maxStack: 8,
        name: "Life Shard",
        tags: ["resource", "mining", "magic"]
    },
    stamina_shard: {
        maxStack: 8,
        name: "Stamina Shard",
        tags: ["resource", "mining", "magic"]
    },
    string: {
        name: "String",
        maxStack: 8,
        tags: ["resource", "mining", "magic"]
    },
    potion: {
        name: "Potion",
        maxStack: 1,
        tags: ["consumable", "magic", "brewing"],
        battleUsage: (
            handler: BattleContextHandler,
            useContext: IUsageContext
        ): ActionResult => {
            if (
                handler.context.participants[useContext.user].stats.HP.current >
                0
            ) {
                return ActionResult.SUCCESS
            } else {
                return ActionResult.FAIL
            }
        }
    },
    phoenix_feather: {
        name: "Phoenix Feather",
        maxStack: 1,
        tags: ["consumable", "magic"]
    }
} as const
