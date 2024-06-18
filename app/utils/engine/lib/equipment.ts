import { Children } from "react"
import { CharEquipmentMap, CharWeaponMap } from "../gamestate"
import { PlayerUpgradeTree } from "../skill-tree"
import { ISkillTreeNode } from "~/components/SkillTree"

export const EQUIPMENT = {
    wayfarers_tunic: {
        name: "Wayfarer's Tunic",
        refining: {
            "0": {
                name: "Basic",
                beginUnlocked: true,
                children: ["1"]
            },
            "1": {
                name: "Refined",
                beginUnlocked: false,
                children: []
            }
        }
    },
    scholarly_robe: {
        name: "Scholarly Robe",
        refining: {
            "0": {
                name: "Basic",
                beginUnlocked: true,
                children: []
            }
        }
    },
    hardened_leather_armor: {
        name: "Hardened Leather Armor",
        refining: {
            "0": {
                name: "Basic",
                beginUnlocked: true,
                children: []
            }
        }
    }
} as const

export type EquipmentName = keyof typeof EQUIPMENT

export type EquipRefiningName =
    keyof (typeof EQUIPMENT)[EquipmentName]["refining"]

export interface IEquipment {
    id: EquipmentName
    name: (typeof EQUIPMENT)[EquipmentName]["name"]
    refining: IRefining<"equipment">
}

export interface IRefining<T extends "equipment" | "weapon"> {
    current: IRefiningEntry<T>
    entry: IRefiningEntry<T>
    levels: IRefiningEntry<T>[]
}

export interface IRefiningEntry<T extends "equipment" | "weapon"> {
    id: string
    name: string
    children: string[]
    unlocked: boolean
}

//export const getRefiningEntry: ()

export const getEquipmentById: (
    id: string,
    upgradeTree: CharEquipmentMap
) => IEquipment = (id, upgradeTree) => {
    const levels: IRefiningEntry<"equipment">[] = Object.entries(
        Object.entries(upgradeTree).filter(e => e[0] === id)[0][1].refining
    ).reduce((acc, [refId, refEntry]) => {
        const refiningEntry =
            EQUIPMENT[id as EquipmentName]["refining"][
                refId as EquipRefiningName
            ]
        acc.push({
            id: refId,
            children: refiningEntry.children as unknown as string[],
            name: refiningEntry.name as string,
            unlocked: refEntry.unlocked
        })
        //console.log(id + "|" + refId + "|" + JSON.stringify(refEntry))
        return acc
    }, [] as IRefiningEntry<"equipment">[])

    const refining: IRefining<"equipment"> = {
        current: levels
            .filter(l => l.unlocked && !isNaN(Number(l.id)))
            .sort((a, b) => Number(b.id) - Number(a.id))[0],
        entry: levels.filter(l => l.id === "0")[0],
        levels
    }
    return {
        id,
        name: EQUIPMENT[id as EquipmentName].name,
        refining
    } as IEquipment
}

export const getEquipmentNodes: (
    upgradeTree: CharEquipmentMap
) => ISkillTreeNode[] = upgradeTree => {
    let nodes: ISkillTreeNode[] = [
        {
            id: "equipment",
            name: "Equipment",
            children: Object.keys(upgradeTree),
            entry: false,
            open: false,
            type: "collapsible"
        }
    ]

    Object.entries(upgradeTree).map(([equipId, equipEntry], idx) => {
        const equipment = getEquipmentById(equipId, upgradeTree)
        nodes.push({
            id: equipId,
            entry: false,
            name: equipment.name,
            children: [equipId + "_refining_" + equipment.refining.entry.id],
            open: idx === 0,
            type: "collapsible"
        })
        equipment.refining.levels.map(l => {
            nodes.push({
                id: equipId + "_refining_" + l.id,
                name: l.name,
                entry: false,
                children: l.children,
                open: true,
                type: "static"
            })
        })
    })

    return nodes
}
