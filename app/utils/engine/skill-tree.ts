import { CLASSES } from "./lib/classes"
import { EQUIPMENT } from "./lib/equipment"
import { RACES } from "./lib/races"
import { SKILLS } from "./lib/skills"
import { WEAPONS } from "./lib/weapons"

export const defaultUpgradeTree: PlayerUpgradeTree = {
    // RACES
    lapine: { HP: 5, RP: 6, unlocked: true },
    tytovi: { HP: 5, RP: 4, unlocked: true },
    swineig: { HP: 6, RP: 4, unlocked: true },

    // CLASSES
    wanderer: { unlocked: true },
    brute: { unlocked: true },
    scribe: { unlocked: true },

    // EQUIPMENT
    hardened_leather_armor: {
        "0": { unlocked: true }
    },
    scholarly_robe: {
        "0": { unlocked: true }
    },
    wayfarers_tunic: {
        "0": { unlocked: true }
    },

    // WEAPONS
    battleaxe: {
        "0": { unlocked: true }
    },
    quarterstaff: {
        "0": { unlocked: true }
    },
    soulbound_grimoire: {
        "0": { unlocked: true }
    },

    // SKILLS
    "battleaxe:crushing_blow": {
        "0": { unlocked: true }
    },
    "quarterstaff:heavy_strike": {
        "0": { unlocked: true }
    },
    "soulbound_grimoire:focused_blast": {
        "0": { unlocked: true }
    }
}

export interface PlayerUpgradeTree
    extends RaceUpgradeTree,
        ClassesUpgradeTree,
        EquipmentUpgradeTree,
        WeaponsUpgradeTree,
        SkillsUpgradeTree {}

export type RaceName = keyof typeof RACES

type RaceUpgradeTree = {
    [K in RaceName]: RaceUpgradeNode
}

interface RaceUpgradeNode {
    HP: number
    RP: number
    unlocked: boolean
}

export type ClassName = keyof typeof CLASSES

type ClassesUpgradeTree = {
    [K in ClassName]: ClassesUpgradeNode
}

interface ClassesUpgradeNode {
    unlocked: boolean
}

type EquipmentName = keyof typeof EQUIPMENT

type EquipmentUpgradeTree = {
    [K in EquipmentName]: EquipmentUpgradeNode<K>
}

type EquipmentUpgradeNode<K extends EquipmentName> = Record<
    keyof (typeof EQUIPMENT)[K]["refining"],
    { unlocked: boolean }
>

type WeaponName = keyof typeof WEAPONS

type WeaponsUpgradeTree = {
    [K in WeaponName]: WeaponsUpgradeNode<K>
}

type WeaponsUpgradeNode<K extends WeaponName> = Record<
    keyof (typeof WEAPONS)[K]["refining"],
    { unlocked: boolean }
>

type SkillName = keyof typeof SKILLS

type SkillsUpgradeTree = {
    [K in SkillName]: SkillsUpgradeNode<K>
}

type SkillsUpgradeNode<K extends SkillName> = Record<
    keyof (typeof SKILLS)[K]["levels"],
    { unlocked: boolean }
>

// type Race<T extends RaceName> = (typeof RACES)[T]

// type ClassName<R extends RaceName> = Race<R>["classes"][number]

// type Class<R extends RaceName, C extends ClassName<R>> = (typeof CLASSES)[C]

// type WeaponName<R extends RaceName, C extends ClassName<R>> = Class<
//     R,
//     C
// >["weapons"][number]

// type Weapon<
//     R extends RaceName,
//     C extends ClassName<R>,
//     W extends WeaponName<R, C>
// > = (typeof WEAPONS)[W]

// type WeaponRefiningName<
//     R extends RaceName,
//     C extends ClassName<R>,
//     W extends WeaponName<R, C>
// > = keyof Weapon<R, C, W>["refining"]

// type SkillName<
//     R extends RaceName,
//     C extends ClassName<R>,
//     W extends WeaponName<R, C>
// > = Weapon<R, C, W>["skills"][number]

// type SkillKey = keyof typeof SKILLS

// type Skill<
//     R extends RaceName,
//     C extends ClassName<R>,
//     W extends WeaponName<R, C>,
//     S extends SkillName<R, C, W>
// > = `${W}:${S}` extends SkillKey ? (typeof SKILLS)[`${W}:${S}`] : never

// type SkillLevelName<
//     R extends RaceName,
//     C extends ClassName<R>,
//     W extends WeaponName<R, C>,
//     S extends SkillName<R, C, W>
// > = keyof Skill<R, C, W, S>["levels"]

// type EquipmentName<R extends RaceName, C extends ClassName<R>> = Class<
//     R,
//     C
// >["equipment"][number]

// type Equipment<
//     R extends RaceName,
//     C extends ClassName<R>,
//     E extends EquipmentName<R, C>
// > = (typeof EQUIPMENT)[E]

// type EquipRefiningName<
//     R extends RaceName,
//     C extends ClassName<R>,
//     E extends EquipmentName<R, C>
// > = keyof Equipment<R, C, E>["refining"]

// type ExtractAfterColon<T extends string> = T extends `${string}:${infer After}`
//     ? After
//     : never

// let i: SkillName<"lapine", "wanderer", "quarterstaff">
// type PlayerUpgradeTree = {
//     [K in RaceName]: RaceUpgradeTree<K>
// }

// interface RaceUpgradeTree<T extends RaceName> {
//     unlocked: boolean
//     classes: ClassesUpgradeTree<T>
// }

// type ClassesUpgradeTree<T extends RaceName> = Record<
//     ClassName<T>,
//     ClassesUpgradeNode<T, ClassName<T>>
// >

// interface ClassesUpgradeNode<T extends RaceName, C extends ClassName<T>> {
//     weapons: WeaponUpgradeTree<T, C>
//     equipment: EquipmentUpgradeTree<T, C>
// }

// type WeaponUpgradeTree<T extends RaceName, C extends ClassName<T>> = Record<
//     WeaponName<T, C>,
//     WeaponUpgradeNode<T, C, WeaponName<T, C>>
// >

// interface WeaponUpgradeNode<
//     T extends RaceName,
//     C extends ClassName<T>,
//     E extends WeaponName<T, C>
// > {
//     refining: WeaponRefiningUpgradeTree<T, C, WeaponName<T, C>>
//     skills: SkillsUpgradeTree<T, C, E, SkillName<T, C, E>>
// }

// type SkillsUpgradeTree<
//     T extends RaceName,
//     C extends ClassName<T>,
//     E extends WeaponName<T, C>,
//     S extends SkillName<T, C, E>
// > = Record<
//     S,
//     Record<
//         SkillLevelName<T, C, E, S>,
//         SkillLevelNode<T, C, E, SkillLevelName<T, C, E, S>>
//     >
// >

// interface SkillLevelNode<
//     T extends RaceName,
//     C extends ClassName<T>,
//     E extends WeaponName<T, C>,
//     S extends SkillLevelName<T, C, E, SkillName<T, C, E>>
// > {
//     unlocked: boolean
// }

// type WeaponRefiningUpgradeTree<
//     T extends RaceName,
//     C extends ClassName<T>,
//     E extends WeaponName<T, C>
// > = Record<
//     WeaponRefiningName<T, C, E>,
//     WeaponRefiningNode<T, C, E, WeaponRefiningName<T, C, E>>
// >

// interface WeaponRefiningNode<
//     T extends RaceName,
//     C extends ClassName<T>,
//     E extends WeaponName<T, C>,
//     R extends WeaponRefiningName<T, C, E>
// > {
//     unlocked: boolean
// }

// type EquipmentUpgradeTree<T extends RaceName, C extends ClassName<T>> = Record<
//     EquipmentName<T, C>,
//     EquipmentUpgradeNode<T, C, EquipmentName<T, C>>
// >

// interface EquipmentUpgradeNode<
//     T extends RaceName,
//     C extends ClassName<T>,
//     E extends EquipmentName<T, C>
// > {
//     refining: EquipRefiningUpgradeTree<T, C, E>
// }

// type EquipRefiningUpgradeTree<
//     T extends RaceName,
//     C extends ClassName<T>,
//     E extends EquipmentName<T, C>
// > = Record<
//     EquipRefiningName<T, C, E>,
//     EquipRefiningNode<T, C, E, EquipRefiningName<T, C, E>>
// >

// interface EquipRefiningNode<
//     T extends RaceName,
//     C extends ClassName<T>,
//     E extends EquipmentName<T, C>,
//     R extends EquipRefiningName<T, C, E>
// > {
//     unlocked: boolean
// }
