import { SHARED_DESCRIPTIONS, SharedGameDescription } from "../gameDescriptions";
import { GServPackice } from "../games/gpackice/GServPackice";
import { GServPaint } from "../games/gpaint/GServPaint";

import { ServerGameEngine } from "./ServerGameEngine";

interface GameDesc {
	create: () => ServerGameEngine;
	desc: SharedGameDescription;
}

export const SERV_DESCRIPTIONS: GameDesc[] = [
	{
		create: () => {return new GServPackice();},
		desc: SHARED_DESCRIPTIONS.packice,
	},

	{
		create: () => {return new GServPaint();},
		desc: SHARED_DESCRIPTIONS.paint,
	}
]