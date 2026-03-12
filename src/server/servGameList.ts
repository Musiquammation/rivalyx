import { GameInterface } from "../GameInterface";
import { cowboy_game } from "../games/gcowboy/cowboy_game";
import { packice_game } from "../games/gpackice/packice_game";
import { test_game } from "../games/gtest/test_game";


export const SERV_DESCRIPTIONS: GameInterface<any>[] = [
	packice_game,
	cowboy_game,
	test_game
];