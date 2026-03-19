import { GameInterface } from "../GameInterface";
import { gstars_game } from "../games/gstars/gstars_game";
import { packice_game } from "../games/gpackice/packice_game";
import { test_game } from "../games/gtest/test_game";


export const SERV_DESCRIPTIONS: GameInterface<any>[] = [
	packice_game,
	gstars_game,
	test_game
];