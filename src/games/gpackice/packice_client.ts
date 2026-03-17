import { ClientInterface } from "../../client/ClientInterface";
import { ClientGameEngine} from "../../client/ClientGameEngine"
import { ImageLoader } from "../../client/ImageLoader"
import { packice_game } from "./packice_game";
import { gpackice } from "./packice_commons";
import { Joystick, JOYSTICK_COLORS, JoystickPlacement } from "../../client/Joystick";
import { DataWriter } from "../../net/DataWriter";


const Snapshot = gpackice.Snapshot;
type Snapshot = InstanceType<typeof gpackice.Snapshot>;

const TILES_X = Snapshot.TILES_X;
const TILES_Y = Snapshot.TILES_Y;

interface Memory {
	playerDirections: number[];
	lastSentX: number;
	lastSentY: number;
}

function drawRoundedRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number
) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
    ctx.fill();
}

export const packice_client: ClientInterface<Snapshot, Memory> = {
	game: packice_game,
	name: "Pingouins",

	images: {
		playerRed: "assets/gpackice/player-red.svg",
		playerBlue: "assets/gpackice/player-blue.svg"
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

		// Draw tiles
		let tile = 0;
		ctx.save();
		for (let y = 0; y < TILES_Y; y++) {
			for (let x = 0; x < TILES_X; x++) {
				const line = snapshot.tiles[tile];
				tile++;

				if (line === 0)
					continue;

				ctx.fillStyle = `rgba(255,255,255,${line/Snapshot.LIFETIME})`;
				drawRoundedRect(ctx, 100*x+100, 100*y+150, 80, 80, 10);
			}
		}
		ctx.restore();



		const imagesNames = ["playerRed", "playerBlue"];

		// Draw players
		for (let i = 0; i < 2; i++) {
			const player = snapshot.players[i];
			const px = player.x;
			const py = player.y;
			const half = Snapshot.PLAYER_RADIUS;
			const size = half*2;

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

	clientFrame(
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
