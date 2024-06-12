import { Character, User } from "@prisma/client"
import { GameState } from "./engine/gamestate"

export interface UserWithCharacters extends User {
    characters: Character[]
}

export interface CorrectedCharacter extends Omit<Character, "gameState"> {
    gameState: GameState
}
