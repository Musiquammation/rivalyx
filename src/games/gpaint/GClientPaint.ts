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
	dir: number;
	vx = 0;
	vy = 0;

	static WIDTH = 40;
	static HEIGHT = 200;

	constructor(x: number, y: number, dir: number) {
		this.x = x;
		this.y = y;
		this.dir = dir;
	}
}


export class GClientPaint extends ClientGameEngine {
	static IMAGES: StringMap = {
		playerRed: "assets/gpaint/player-red.svg",
		playerBlue: "assets/gpaint/player-blue.svg",
		boost_speed: "assets/gpaint/boost-speed.svg",
	};

	static BOOST_LIST = ["boost_speed", "boost_splash", "boost_big"];
	static BOOST_RADIUS = 128;

	static WIDTH = 1080;
	static HEIGHT = 2400;

	players: Player[] = [
		new Player(540, 290, Math.PI/2),
		new Player(540, 2090, Math.PI*3/2)
	];

	boostType = -1;
	boostX = 0;
	boostY = 0;

	offscreen = new OffscreenCanvas(GClientPaint.WIDTH, GClientPaint.HEIGHT);
	
	constructor(imageLoader: ImageLoader) {
		super(imageLoader);
	}

	async start() {
		super.appendJoystick(new Joystick(
			0.9, 0.9, JoystickPlacement.SCREEN_RATIO, JoystickPlacement.SCREEN_RATIO,
			this.playerIndex === 0 ? JOYSTICK_COLORS.red : JOYSTICK_COLORS.blue,
			'move'
		));

		const subctx = this.offscreen.getContext("2d")!;
		subctx.fillStyle = "#F3E9DC";
		subctx.fillRect(0, 0, 1080, 2400);
	}

	timer = -1;

	override getTimer() {
		return this.timer;
	}


	
	getGameSize() {
		return {width: GClientPaint.WIDTH, height: GClientPaint.HEIGHT};
	}

	

	draw(
		ctx: CanvasRenderingContext2D,
		screenWidth: number,
		screenHeight: number,
		applyToScreen: ()=>void
	): void {
		// Apply to screen
		ctx.save();
		applyToScreen();

		// Draw background
		ctx.drawImage(this.offscreen, 0, 0);

		// Draw boost
		if (this.boostType >= 0) {
			ctx.save();
			ctx.translate(this.boostX, this.boostY);
			ctx.drawImage(
				this.imageLoader.getImage(GClientPaint.BOOST_LIST[this.boostType]),
				-GClientPaint.BOOST_RADIUS/2, -GClientPaint.BOOST_RADIUS/2,
				GClientPaint.BOOST_RADIUS, GClientPaint.BOOST_RADIUS
			)
			ctx.restore();
		}
		
		const imagesNames = ["playerRed", "playerBlue"];

		// Draw players
		for (let i = 0; i < 2; i++) {
			const player = this.players[i];
			const px = player.x;
			const py = player.y;
			const width = Player.WIDTH;
			const height = Player.HEIGHT;

			ctx.save();
			ctx.translate(px, py);
			ctx.rotate(player.dir);
			ctx.drawImage(
				this.imageLoader.getImage(imagesNames[i]),
				-width/2, -height/2, width, height
			);
			ctx.restore();
		}

		// Cancel screen apply
		ctx.restore();
	}

	clientNetwork(reader: DataReader | null): DataWriter {
		if (reader) {
			this.timer = reader.readInt32() / 60;

			const boostType = reader.readInt8();
			this.boostType = boostType;
			if (boostType >= 0) {
				this.boostX = reader.readFloat32();
				this.boostY = reader.readFloat32();
			}
			console.log(boostType, this.boostX, this.boostY);

			for (let i = 0; i < this.players.length; i++) {
				const player = this.players[i];
				// Collect positions
				const next_x = reader.readFloat32();
				const next_y = reader.readFloat32();
				const next_vx = reader.readFloat32();
				const next_vy = reader.readFloat32();

				let next_dir;
				if (next_vx != 0 || next_vy != 0) {
					next_dir = Math.atan2(next_vy, next_vx);
				} else {
					next_dir = player.dir;
				}

				// Paint between those points
				const subctx = this.offscreen.getContext("2d")!;
				subctx.save();
				
				const steps = 10;
				const colors = ["#FF6B6B", "#4ECDC4"]; // red and blue
				subctx.fillStyle = colors[i];
				
				for (let step = 0; step <= steps; step++) {
					const t = step / steps;
					const x = player.x + (next_x - player.x) * t;
					const y = player.y + (next_y - player.y) * t;
					const dir = player.dir + (next_dir - player.dir) * t;

					subctx.save();
					subctx.translate(x, y);
					subctx.rotate(dir);
					subctx.fillRect(-Player.WIDTH/2, -Player.HEIGHT/2, Player.WIDTH, Player.HEIGHT);
					subctx.restore();
				}
				
				subctx.restore();

				// Update player position
				player.x = next_x;
				player.y = next_y;
				player.dir = next_dir;
				player.vx = next_vx;
				player.vy = next_vy;
			}
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

