import { ISkillTreeNode } from "~/components/SkillTree"
import { CharWeaponMap, IUpgradeCost } from "../gamestate"
import { IRefining, IRefiningEntry } from "./equipment"
import { SKILLS, SkillName } from "./skills"

export const WEAPONS = {
    quarterstaff: {
        name: "Quarterstaff",
        refining: {
            "0": {
                name: "Basic",
                beginUnlocked: true,
                children: ["1"],
                description: "+1 EDEF",
                cost: {
                    resources: [],
                    xp: 0
                }
            },
            "1": {
                name: "Refined",
                beginUnlocked: false,
                children: [],
                description: "+1 EDEF",
                cost: {
                    resources: [{ id: "wood", amount: 8, components: {} }],
                    xp: 0
                }
            }
        },
        skills: ["heavy_strike"]
    },
    soulbound_grimoire: {
        name: "Soulbound Grimoire",
        refining: {
            "0": {
                name: "Basic",
                beginUnlocked: true,
                children: [],
                description: "+1 EDEF",
                cost: {
                    resources: [],
                    xp: 0
                }
            }
        },
        skills: ["focused_blast"]
    },
    battleaxe: {
        name: "Battleaxe",
        refining: {
            "0": {
                name: "Basic",
                beginUnlocked: true,
                children: [],
                description: "+1 EDEF",
                cost: {
                    resources: [],
                    xp: 0
                }
            }
        },
        skills: ["crushing_blow"]
    }
} as const

export type WeaponName = keyof typeof WEAPONS

export type WeaponRefiningName = keyof (typeof WEAPONS)[WeaponName]["refining"]

export interface IWeapon {
    id: WeaponName
    name: (typeof WEAPONS)[WeaponName]["name"]
    refining: IRefining<"equipment">
    skills: ISkills
}

export interface ISkills {
    current: ISkillEntry[]
    entry: ISkillEntry[]
    levels: ISkillEntry[]
}

export interface ISkillEntry {
    id: string
    name: string
    children: string[]
    unlocked: boolean
    unlockProgress: number
    description: string
    cost: IUpgradeCost
}

export const getWeaponById: (
    id: string,
    upgradeTree: CharWeaponMap
) => IWeapon = (id, upgradeTree) => {
    const levels: IRefiningEntry<"weapon">[] = Object.entries(
        Object.entries(upgradeTree).filter(e => e[0] === id)[0][1].refining
    ).reduce((acc, [refId, refEntry]) => {
        const refiningEntry =
            WEAPONS[id as WeaponName]["refining"][refId as WeaponRefiningName]
        acc.push({
            id: refId,
            children: refiningEntry.children as unknown as string[],
            name: refiningEntry.name as string,
            unlocked: refEntry.unlocked,
            cost: refiningEntry.cost as unknown as IUpgradeCost,
            description: refiningEntry.description
        })
        //console.log(id + "|" + refId + "|" + JSON.stringify(refEntry))
        return acc
    }, [] as IRefiningEntry<"weapon">[])

    const refining: IRefining<"weapon"> = {
        current: levels
            .filter(l => l.unlocked && !isNaN(Number(l.id)))
            .sort((a, b) => Number(b.id) - Number(a.id))[0],
        entry: levels.filter(l => l.id === "0")[0],
        levels
    }

    let currentSkills: ISkillEntry[] = []
    let entrySkills: ISkillEntry[] = []

    const skillLevels: ISkillEntry[] = Object.entries(
        upgradeTree[id as WeaponName].skills
    ).reduce((acc, [skillId, sklEntry]) => {
        //console.log(skillId, sklEntry)
        const skillEntry = SKILLS[skillId as SkillName]

        Object.entries(sklEntry).map(([lvId, lvEntry]) => {
            const children =
                skillEntry.levels[lvId as keyof typeof skillEntry.levels]
                    .children
            const addedSkill = {
                name: skillEntry.name + " " + (Number(lvId) + 1),
                id: skillId + "#" + lvId,
                children: children as unknown as string[],
                unlocked: lvEntry.unlocked,
                unlockProgress: lvEntry.unlockProgress,
                cost: skillEntry.levels[lvId as keyof typeof skillEntry.levels]
                    .cost as unknown as IUpgradeCost,
                description:
                    skillEntry.levels[lvId as keyof typeof skillEntry.levels]
                        .description
            } as ISkillEntry
            if (
                skillEntry.levels[lvId as keyof typeof skillEntry.levels].entry
            ) {
                entrySkills.push(addedSkill)
            }
            const matchingCurrentSkills = currentSkills.filter(
                sk => sk.id.split("#")[0] === skillId
            )
            if (!matchingCurrentSkills.length) {
                currentSkills.push(addedSkill)
            } else {
                currentSkills[currentSkills.indexOf(matchingCurrentSkills[0])] =
                    addedSkill
            }
            acc.push(addedSkill)
        })
        return acc
    }, [] as ISkillEntry[])

    const skills: ISkills = {
        current: currentSkills,
        entry: entrySkills,
        levels: skillLevels
    }

    return {
        id,
        name: WEAPONS[id as WeaponName].name,
        refining,
        skills
    } as IWeapon
}

export const getWeaponNodes: (
    upgradeTree: CharWeaponMap
) => ISkillTreeNode[] = upgradeTree => {
    let nodes: ISkillTreeNode[] = [
        {
            id: "weapons",
            name: "Weapons",
            children: Object.keys(upgradeTree),
            entry: false,
            open: false,
            type: "collapsible"
        }
    ]

    Object.entries(upgradeTree).map(([weaponId, equipEntry], idx) => {
        const weapon = getWeaponById(weaponId, upgradeTree)
        //console.log(weapon)
        nodes.push({
            id: weaponId,
            entry: false,
            name: weapon.name,
            children: [
                weaponId + "_refining_" + weapon.refining.entry.id,
                ...weapon.skills.entry.map(l => l.id)
            ],
            open: idx === 0,
            type: "collapsible"
        })
        weapon.refining.levels.map(l => {
            nodes.push({
                id: weaponId + "_refining_" + l.id,
                name: l.name,
                entry: false,
                children: l.children.map(c => weaponId + "_refining_" + c),
                open: true,
                type: "static"
            })
        })
        weapon.skills.levels.map(l => {
            //console.log(l)
            nodes.push({
                id: l.id,
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
