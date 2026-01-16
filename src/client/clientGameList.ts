import { SHARED_DESCRIPTIONS, SharedGameDescription } from "../gameDescriptions";
import { GClientPackice } from "../games/gpackice/GClientPackice";
import { StringMap } from "../StringMap";
import { ClientGameEngine } from "./ClientGameEngine";
import { ImageLoader } from "./ImageLoader";

interface GameDesc {
	create: (imageLoader: ImageLoader) => ClientGameEngine;
	desc: SharedGameDescription;
	name: string;
	images: StringMap;
}

export const CLIENT_DESCRIPTIONS: GameDesc[] = [
	{
		create: imageLoader => {return new GClientPackice(imageLoader);},
		desc: SHARED_DESCRIPTIONS.packice,
		name: "Banquise",
		images: GClientPackice.IMAGES

	}
];

