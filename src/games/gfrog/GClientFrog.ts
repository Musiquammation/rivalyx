import { ClientGameEngine } from "../../client/ClientGameEngine";

import { ImageLoader } from "../../client/ImageLoader";
import { Joystick, JOYSTICK_COLORS, JoystickPlacement } from "../../client/Joystick";
import { DataReader } from "../../net/DataReader";
import { DataWriter } from "../../net/DataWriter";
import { SERVER_IDS } from "../../net/SERVER_IDS";
import { StringMap } from "../../StringMap";

class Player {
	x: number;
	y: number;
	a: number;
	airKind = 1;

	constructor(x: number, y: number, a: number) {
		this.x = x;
		this.y = y;
		this.a = a;
	}
}


export class GClientPackice extends ClientGameEngine {
	static IMAGES: StringMap = {
		playerRed: "assets/gpackice/player-red.svg",
		playerBlue: "assets/gpackice/player-blue.svg",
		floor: "assets/gpackice/floor.svg",
	};

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
	}

	override getTimer() {
		return -1;
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
			ctx.rotate(player.a);
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
				player.a = reader.readFloat32();
				player.airKind = reader.readInt8();
			}
		}
		

		const writer = new DataWriter();
		writer.writeInt8(SERVER_IDS.GAME_DATA);
		writer.writeInt8(SERVER_IDS.FINISH);
		return writer;
	}
}