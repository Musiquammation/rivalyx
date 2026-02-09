import { GameInterface } from "../GameInterface";
import { StringMap } from "../StringMap";
import { ClientGameEngine } from "./ClientGameEngine";
import { ImageLoader } from "./ImageLoader";

export interface ClientInterface<Snapshot, Memory> {
	game: GameInterface<Snapshot>;
	name: string;
	images: StringMap;
	gameSize: {width: number, height: number};


	createMemory(snapshot: Snapshot, client: ClientGameEngine,
		playerIndex: number): Memory;

	getTimer(snapshot: Snapshot): number;

	draw(snapshot: Snapshot,
		memory: Memory,
		ctx: CanvasRenderingContext2D,
		screenWidth: number,
		screenHeight: number,
		imageLoader: ImageLoader,
		playerIndex: number,
		applyToScreen: () => void): void;

	runPublicFrame(
		snapshot: Snapshot,
		memory: Memory,
		playerIndex: number,
		client: ClientGameEngine
	): void;

	handleSubTouchEvent(
		snapshot: Snapshot,
		kind: 'touchstart' | 'touchmove' | 'touchend',
		event: TouchEvent,
		screenWidth: number,
		screenHeight: number,
		canvasWidth: number,
		canvasHeight: number
	): void;
}