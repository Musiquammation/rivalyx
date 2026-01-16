import { SHARED_DESCRIPTIONS, SharedGameDescription } from "../gameDescriptions";
import { GServPackice } from "../games/gpackice/GServPackice";

import { ServerGameEngine } from "./ServerGameEngine";

interface GameDesc {
	create: () => ServerGameEngine;
	desc: SharedGameDescription;
}

export const SERV_DESCRIPTIONS: GameDesc[] = [
	{
		create: () => {return new GServPackice();},
		desc: SHARED_DESCRIPTIONS.packice,
	}
]