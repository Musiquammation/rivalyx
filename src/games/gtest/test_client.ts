import { ClientInterface } from "../../client/ClientInterface";
import { ClientGameEngine} from "../../client/ClientGameEngine"
import { ImageLoader } from "../../client/ImageLoader"
import { test_game } from "./test_game";
import { gtest } from "./test_commons";
import { Joystick, JOYSTICK_COLORS, JoystickPlacement } from "../../client/Joystick";
import { DataWriter } from "../../net/DataWriter";


const Snapshot = gtest.Snapshot;
type Snapshot = InstanceType<typeof gtest.Snapshot>;


interface Memory {
	playerDirections: number[];
	lastSentX: number;
	lastSentY: number;
}

export const test_client: ClientInterface<Snapshot, Memory> = {
	game: test_game,
	name: "Test",

	images: {
		playerRed: "assets/gpackice/player-red.svg",
		playerBlue: "assets/gpackice/player-blue.svg",
		floor: "assets/gpackice/floor.svg",
	},

	gameSize: {width: 1080, height: 2400},


	createMemory(snapshot: Snapshot, client: ClientGameEngine, playerIndex: number) {
		client.appendJoystick(new Joystick(
			0.9, 0.9, JoystickPlacement.SCREEN_RATIO, JoystickPlacement.SCREEN_RATIO,
			playerIndex === 0 ? JOYSTICK_COLORS.red : JOYSTICK_COLORS.blue,
			'move'
		));

		
		return {
			playerDirections: [Math.PI * 1/2, Math.PI * 3/2],
			lastSentX: Infinity,
			lastSentY: Infinity,
		};
	},

	getTimer(snapshot: Snapshot) {
		return -1;
	},

	draw(snapshot: Snapshot,
		memory: Memory,
		ctx: CanvasRenderingContext2D,
		screenWidth: number,
		screenHeight: number,
		imageLoader: ImageLoader,
		playerIndex: number,
		applyToScreen: () => void
	) {
		// Draw background
		if (playerIndex === 0) {
			ctx.fillStyle = "rgb(98, 25, 25)";
		} else {
			ctx.fillStyle = "rgb(25, 39, 98)";
		}
		ctx.fillRect(0, 0, screenWidth, screenHeight);


		// Apply to screen
		ctx.save();
		applyToScreen();


		const imagesNames = ["playerRed", "playerBlue"];

		// Draw players
		for (let i = 0; i < snapshot.players.length; i++) {
			const player = snapshot.players[i];
			const px = player.x;
			const py = player.y;
			const size = 100;
			const half = size / 2;

			ctx.save();
			ctx.translate(px, py);
			ctx.rotate(memory.playerDirections[i]);
			ctx.drawImage(
				imageLoader.getImage(imagesNames[i]),
				-half, -half, size, size
			);
			ctx.restore();
		}

		// Cancel screen apply
		ctx.restore();
	},

	runPublicFrame(
		snapshot: Snapshot, memory: Memory,
		playerIndex: number, client: ClientGameEngine
	) {
		for (let i = 0; i < snapshot.players.length; i++) {
			if (i == playerIndex)
				continue;

			const vx = snapshot.players[i].vx;
			const vy = snapshot.players[i].vy;
			if (vx != 0 || vy != 0) {
				memory.playerDirections[i] = Math.atan2(vy, vx);
			}
		}

		let dir = client.getJoyStickDirection('move');
		if (!dir) {
			dir = {x: 0, y: 0};
		}
		
		if (dir.x != memory.lastSentX || dir.y != memory.lastSentY) {
			memory.lastSentX = dir.x;
			memory.lastSentY = dir.y;
			
			if (dir.x != 0 || dir.y != 0) {
				memory.playerDirections[playerIndex] = Math.atan2(dir.y, dir.x);
			}

			const writer = new DataWriter();
			writer.writeFloat32(dir.x);
			writer.writeFloat32(dir.y);
			client.addInput(writer.toArrayBuffer());
		}
	},

	handleSubTouchEvent(
		snapshot: Snapshot,
		kind: 'touchstart' | 'touchmove' | 'touchend',
		event: TouchEvent,
		screenWidth: number,
		screenHeight: number,
		canvasWidth: number,
		canvasHeight: number
	) {

	}
};