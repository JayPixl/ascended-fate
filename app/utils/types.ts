import { Character, User } from "@prisma/client"
import { CharEquipmentMap, CharWeaponMap, GameState } from "./engine/gamestate"
import { ClassName } from "./engine/skill-tree"

export interface UserWithCharacters extends User {
    characters: Character[]
}

export interface CorrectedCharacter
    extends Omit<Omit<Omit<Character, "weapons">, "equipment">, "gameState"> {
    gameState: GameState
    equipment: CharEquipmentMap
    weapons: CharWeaponMap
}
