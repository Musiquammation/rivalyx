import { ClientGameEngine, Joystick, JOYSTICK_COLORS, JoystickPlacement } from "../../client/ClientGameEngine";
import { ImageLoader } from "../../client/ImageLoader";
import { DataReader } from "../../net/DataReader";
import { DataWriter } from "../../net/DataWriter";
import { SERVER_IDS } from "../../net/SERVER_IDS";
import { StringMap } from "../../StringMap";

class Player {
	x: number;
	y: number;
	dir: number;
	vx = 0;
	vy = 0;

	constructor(x: number, y: number, dir: number) {
		this.x = x;
		this.y = y;
		this.dir = dir;
	}
}



export class GClientPackice extends ClientGameEngine {
	static IMAGES: StringMap = {
		playerRed: "assets/gpackice/player-red.svg",
		playerBlue: "assets/gpackice/player-blue.svg",
		floor: "assets/gpackice/floor.svg",
	};

	static TILES_X = 9;
	static TILES_Y = 21;
	tiles = new Uint8Array(GClientPackice.TILES_Y * GClientPackice.TILES_X);

	players: Player[] = [
		new Player(540, 290, Math.PI/2),
		new Player(540, 2090, Math.PI*3/2)
	];
	
	constructor(imageLoader: ImageLoader) {
		super(imageLoader);
	}

	async start() {
		super.appendJoystick(new Joystick(
			0.9, 0.9, JoystickPlacement.SCREEN_RATIO, JoystickPlacement.SCREEN_RATIO,
			this.playerIndex === 0 ? JOYSTICK_COLORS.red : JOYSTICK_COLORS.blue,
			'move'
		));

		this.tiles.fill(255);
	}
	
	getGameSize() {
		return {width: 1080, height: 2400};
	}

	

	draw(
		ctx: CanvasRenderingContext2D,
		screenWidth: number,
		screenHeight: number,
		applyToScreen: ()=>void
	): void {
		// Draw background
		if (this.playerIndex === 0) {
			ctx.fillStyle = "rgb(98, 25, 25)";
		} else {
			ctx.fillStyle = "rgb(25, 39, 98)";
		}
		ctx.fillRect(0, 0, screenWidth, screenHeight);


		// Apply to screen
		ctx.save();
		applyToScreen();

		// Draw tiles
		const floorImg = this.imageLoader.getImage("floor");
		let tile = 0;
		for (let y = 0; y < GClientPackice.TILES_Y; y++) {
			for (let x = 0; x < GClientPackice.TILES_X; x++) {
				const line = this.tiles[tile];
				ctx.save();
				ctx.globalAlpha = line/255;
				ctx.drawImage(floorImg, 100*x + 90, 100*y + 140, 100, 100);
				ctx.restore();
				// ctx.fillStyle = "red";
				// ctx.fillRect(100*x + 150, 100*y + 140, 100, 100);
				tile++;
			}
		}


		const imagesNames = ["playerRed", "playerBlue"];

		// Draw players
		for (let i = 0; i < 2; i++) {
			const player = this.players[i];
			const px = player.x;
			const py = player.y;
			const size = 100;
			const half = size / 2;

			ctx.save();
			ctx.translate(px, py);
			ctx.rotate(player.dir);
			ctx.drawImage(
				this.imageLoader.getImage(imagesNames[i]),
				-half, -half, size, size
			);
			ctx.restore();
		}

		// Cancel screen apply
		ctx.restore();
	}

	clientNetwork(reader: DataReader | null): DataWriter {
		if (reader) {
			for (let player of this.players) {
				player.x = reader.readFloat32();
				player.y = reader.readFloat32();
				player.vx = reader.readFloat32();
				player.vy = reader.readFloat32();

				if (player.vx != 0 || player.vy != 0) {
					player.dir = Math.atan2(player.vy, player.vx);
				}
			}

			this.tiles = reader.readUint8Array(GClientPackice.TILES_Y * GClientPackice.TILES_X);
		}
		

		const writer = new DataWriter();
		writer.writeInt8(SERVER_IDS.GAME_DATA);

		const joystick = super.getJoyStickDirection("move");
		if (joystick) {
			writer.writeInt8(1);
			writer.writeFloat32(joystick.x);
			writer.writeFloat32(joystick.y);
		} else {
			writer.writeInt8(0);
		}

		writer.writeInt8(SERVER_IDS.FINISH);
		return writer;
	}
}