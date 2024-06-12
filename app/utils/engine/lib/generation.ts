import { getRandomInt } from "~/utils/name-generator"
import { Biome, DungeonNode, MerchantNode, ResourceNode } from "../gamestate"

export interface MultipliableWeighted {
    weight: number
    multiplier: number
}

export const BIOMES = {
    forest: {
        title: "Forest",
        weight: 5,
        multiplier: -0.1
    },
    desert: {
        title: "Desert",
        weight: 2,
        multiplier: 0.5
    },
    mountain: {
        title: "Mountain",
        weight: 1,
        multiplier: 0.2
    }
} as const

export const ITEMS = {
    wood: {
        maxStack: 8,
        usable: false,
        name: "Wood"
    }
} as const

export interface ItemStack {
    id: keyof typeof ITEMS
    amount: number
    components: Record<string, any>
}

const getMultipliableWeightedForResourcePool: (
    biomeMultipliers: Partial<Record<keyof typeof BIOMES, [number, number]>>,
    biome: Biome
) => MultipliableWeighted = (biomeMultipliers, biome) => {
    for (let entry of Object.entries(biomeMultipliers)) {
        if (entry[0] === biome)
            return {
                weight: entry[1][0],
                multiplier: entry[1][1]
            }
    }

    return {
        weight: 0,
        multiplier: 0
    }
}

export interface ResourcePoolEntry extends MultipliableWeighted {
    quantity: [number, number]
}

const buildResourcePool: (
    poolSize: number,
    poolWeighting: Partial<Record<keyof typeof ITEMS, ResourcePoolEntry>>,
    ascension: number
) => ItemStack[] = (size, map, ascension) => {
    let pool: ItemStack[] = []

    for (var i: number = 0; i < size; i++) {
        const chosenStack = calculateWeighted(
            map,
            ascension
        ) as keyof typeof ITEMS
        pool.push({
            id: chosenStack,
            amount: getRandomInt(
                map[chosenStack]!.quantity[0],
                map[chosenStack]!.quantity[1]
            ),
            components: {}
        })
    }

    return pool
}

export const RESOURCE_POOL = {
    woodcutting: {
        title: "Woodcutting",
        getWeight: (biome: Biome): MultipliableWeighted => {
            return getMultipliableWeightedForResourcePool(
                {
                    forest: [5, 0],
                    mountain: [2, 0]
                },
                biome
            )
        },
        resourcePool: (ascension: number): ItemStack[] => {
            return buildResourcePool(
                getRandomInt(5, 8),
                {
                    wood: {
                        weight: 5,
                        multiplier: 0,
                        quantity: [1, 5]
                    }
                },
                ascension
            )
        }
    },
    mining: {
        title: "Mining",
        getWeight: (biome: Biome): MultipliableWeighted => {
            return getMultipliableWeightedForResourcePool(
                {
                    mountain: [2, 0],
                    desert: [5, 0]
                },
                biome
            )
        },
        resourcePool: (ascension: number): ItemStack[] => {
            return buildResourcePool(
                getRandomInt(5, 8),
                {
                    wood: {
                        weight: 5,
                        multiplier: 0,
                        quantity: [1, 5]
                    }
                },
                ascension
            )
        }
    }
} as const

// DO CHARACTER AP

export const TILE_NODES = {
    merchant: {
        weight: 2,
        multiplier: 0,
        factory: (biome: Biome, ascension: number): MerchantNode => {
            return {
                title: "My Shop",
                APCost: 0,
                type: "merchant",
                usages: -1
            }
        }
    },
    resource: {
        weight: 2,
        multiplier: 0,
        factory: (biome: Biome, ascension: number): ResourceNode => {
            let resourcePoolWeighting: Partial<
                Record<keyof typeof RESOURCE_POOL, MultipliableWeighted>
            > = {}
            for (let entry of Object.entries(RESOURCE_POOL)) {
                resourcePoolWeighting[entry[0] as keyof typeof RESOURCE_POOL] =
                    RESOURCE_POOL[
                        entry[0] as keyof typeof RESOURCE_POOL
                    ].getWeight(biome)
            }
            const poolType: keyof typeof RESOURCE_POOL = calculateWeighted(
                resourcePoolWeighting,
                ascension
            ) as keyof typeof RESOURCE_POOL
            const myPool = RESOURCE_POOL[poolType]
            return {
                title: myPool.title,
                pool: myPool.resourcePool(ascension),
                APCost: 1,
                type: "resource",
                usages: getRandomInt(1, 3)
            }
        }
    },
    dungeon: {
        weight: 2,
        multiplier: 0,
        factory: (biome: Biome, ascension: number): DungeonNode => {
            return {
                title: "My Dungeon",
                APCost: 0,
                type: "dungeon",
                usages: -1
            }
        }
    }
} as const

export const calculateWeighted: (
    map: Record<string, MultipliableWeighted & Record<string, any>>,
    ascension: number
) => string = (map, ascension) => {
    let weightList: string[] = []
    let totalWeight: number = 0

    for (let item of Object.entries(map)) {
        const weight = Math.floor(
            Math.max(0, item[1].weight + item[1].multiplier * (ascension - 1))
        )
        totalWeight += weight
        for (var i = 0; i < weight; i++) {
            weightList.push(item[0])
        }
    }

    return weightList[getRandomInt(0, totalWeight - 1)]
}
