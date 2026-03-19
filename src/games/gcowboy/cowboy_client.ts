import { ClientInterface } from "../../client/ClientInterface";
import { ClientGameEngine} from "../../client/ClientGameEngine"
import { ImageLoader } from "../../client/ImageLoader"
import { cowboy_game } from "./cowboy_game";
import { gcowboy } from "./cowboy_commons";
import { Joystick, JOYSTICK_COLORS, JoystickPlacement } from "../../client/Joystick";
import { DataWriter } from "../../net/DataWriter";
import { drawBlock } from "./drawBlock";
import { Player } from "./Player";
import { flags } from "./flags";
import { Button, BUTTON_COLORS, ButtonPlacement } from "../../client/Button";
import { Star } from "./Star";
import { PowerUpEntity } from "./PowerUp";
import { Projectile, ProjectileType } from "./Projectile";


const Snapshot = gcowboy.Snapshot;
type Snapshot = InstanceType<typeof gcowboy.Snapshot>;




class Memory {
	sentX = NaN;
	sentFlag = 0;
	respawnCouldown = -1;

	camX = 0;
	camY = 0;
	camZ = 1;
}


const POWERUP_TEXTURES = [
	"powerup-default",
	"powerup-fire",
	"powerup-ice",
	"powerup-shell",
	"powerup-jump",
]

export const cowboy_client: ClientInterface<Snapshot, Memory> = {
	game: cowboy_game,
	name: "Cowboy",

	images: {
		playerRed: "assets/gpackice/player-red.svg",
		playerBlue: "assets/gpackice/player-blue.svg",
	},

	gameSize: {width: 1600, height: 900},


	createMemory(snapshot: Snapshot, client: ClientGameEngine, playerIndex: number) {
		client.appendJoystick(new Joystick(
			0.9, 0.9, JoystickPlacement.SCREEN_RATIO, JoystickPlacement.SCREEN_RATIO,
			playerIndex === 0 ? JOYSTICK_COLORS.red : JOYSTICK_COLORS.blue,
			'move'
		));


		client.appendButton(new Button(
			0.1, 0.9, ButtonPlacement.SCREEN_RATIO, ButtonPlacement.SCREEN_RATIO,
			playerIndex === 0 ? BUTTON_COLORS.red : BUTTON_COLORS.blue,
			'jump', 1, 1
		));

		client.appendButton(new Button(
			0.1, 0.8, ButtonPlacement.SCREEN_RATIO, ButtonPlacement.SCREEN_RATIO,
			BUTTON_COLORS.yellow,
			'powerup', 1, 1
		));

		
		return new Memory();
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



		// Apply to camera
		ctx.save();
		ctx.translate(800, 450);
		ctx.scale(memory.camZ, memory.camZ);
		ctx.translate(-memory.camX, -memory.camY);


		// Draw blocks
		for (const block of snapshot.map.blocks) {
			drawBlock(ctx, block);
		}

		// Draw projectiles
		for (const player of snapshot.map.players) {
			for (const p of player.projectiles) {
				switch (p.type) {
				case ProjectileType.ICE:
					ctx.fillStyle = "#0ff";
					break;
					
				case ProjectileType.FIRE:
					ctx.fillStyle = "#f70";
					break;
				}

				ctx.beginPath();
				ctx.arc(p.x, p.y, Projectile.RADIUS, 0, 2 * Math.PI);
				ctx.fill();
			}
		}


		// Draw powerups
		for (const powerup of snapshot.map.powerups) {
			ctx.save();
			ctx.translate(powerup.x, powerup.y);

			const path = POWERUP_TEXTURES[powerup.type]
			ctx.drawImage(
				imageLoader.getImage(path),
				-PowerUpEntity.WIDTH/2, -PowerUpEntity.HEIGHT/2,
				PowerUpEntity.WIDTH, PowerUpEntity.HEIGHT
			);


			ctx.restore();
		}

		// Draw stars
		const starImg = imageLoader.getImage("star");
		for (const star of snapshot.map.stars) {
			ctx.save();
			ctx.translate(star.x, star.y);

			ctx.drawImage(
				starImg,
				-Star.WIDTH/2, -Star.HEIGHT/2,
				Star.WIDTH, Star.HEIGHT
			);

			ctx.restore();
		}
		

		
		// Draw players
		const imagesNames = ["playerRed", "playerBlue"];
		for (let i = 0; i < 2; i++) {
			const player = snapshot.map.players[i];
			if (player.respawnCouldown > 0)
				continue;

			const px = player.x;
			const py = player.y;

			ctx.save();
			ctx.translate(px, py);
			ctx.scale(
				(snapshot.map.players[i].flags & flags.LOOK_LEFT) ? -1 : 1,
				1
			);
			ctx.drawImage(
				imageLoader.getImage(imagesNames[i]),
				-Player.WIDTH/2, -Player.HEIGHT/2,
				Player.WIDTH, Player.HEIGHT
			);
			ctx.restore();
		}

		// Cancel camera
		ctx.restore();

		// Cancel screen apply
		ctx.restore();
	},

	clientFrame(
		snapshot: Snapshot, memory: Memory,
		playerIndex: number, client: ClientGameEngine
	) {
		const player = snapshot.map.players[playerIndex];
		if (player.respawnCouldown <= 0) {
			memory.respawnCouldown = -1;
		} else if (memory.respawnCouldown > 0) {
			memory.respawnCouldown -= 1000/60;
		} else {
			memory.respawnCouldown = Player.RESPAWN_COULDOWN;
		}

		
		let dir = client.getJoyStickDirection('move');
		if (!dir) {
			dir = {x: 0, y: 0};
		}
		
		let flag = memory.sentFlag & flags.WAS_JUMPING & flags.WAS_POWER;

		// dive
		if (dir.y < -.8)
			flag |= flags.DIVE;

		// left or right
		if (dir.x < 0) {
			flag |= flags.LOOK_LEFT;
		} else if (dir.x === 0) {
			flag |= memory.sentFlag & flags.LOOK_LEFT;
		}

		// jump
		if (client.getButton('jump')) {
			flag |= flags.JUMP;
		}

		// power
		if (client.getButton('powerup')) {
			flag |= flags.POWER;
		}


		if (dir.x != memory.sentX || flag != memory.sentFlag) {
			memory.sentX = dir.x;
			memory.sentFlag = flag;
			
			const writer = new DataWriter();
			writer.writeFloat32(dir.x);
			writer.writeUint8(flag);
			client.addInput(writer.toArrayBuffer());
		}


		// Update camera
		if (player.respawnCouldown >= 0) {
			memory.camX = 0;
			memory.camY = 0;
		} else {
			memory.camX = player.x;
			memory.camY = player.y;
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
