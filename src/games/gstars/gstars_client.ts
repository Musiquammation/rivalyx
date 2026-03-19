import { ClientInterface } from "../../client/ClientInterface";
import { ClientGameEngine} from "../../client/ClientGameEngine"
import { ImageLoader } from "../../client/ImageLoader"
import { gstars_game } from "./gstars_game";
import { gcowboy } from "./gstars_common";
import { Joystick, JOYSTICK_COLORS, JoystickPlacement } from "../../client/Joystick";
import { DataWriter } from "../../net/DataWriter";
import { drawBlock } from "./drawBlock";
import { Player } from "./Player";
import { flags } from "./flags";
import { Button, BUTTON_COLORS, ButtonPlacement } from "../../client/Button";
import { Star } from "./Star";
import { PowerUpEntity, powerups } from "./PowerUp";
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
	"defaultPowerup",
	"flowerFire",
	"flowerIce",
	"shell",
	"jump",
]

export const gstars_client: ClientInterface<Snapshot, Memory> = {
	game: gstars_game,
	name: "Stars",

	images: {
		playerRed: "assets/gstars/player-red.svg",
		playerBlue: "assets/gstars/player-blue.svg",
		star: "assets/gstars/star.svg",
		flowerFire: "assets/gstars/flower-fire.svg",
		flowerIce: "assets/gstars/flower-ice.svg",
		defaultPowerup: "assets/gstars/defaultPowerup.svg",
	},

	gameSize: {width: 1600, height: 900},


	createMemory(snapshot: Snapshot, client: ClientGameEngine, playerIndex: number) {
		client.appendJoystick(new Joystick(
			0.9, 0.9, JoystickPlacement.SCREEN_RATIO, JoystickPlacement.SCREEN_RATIO,
			playerIndex === 0 ? JOYSTICK_COLORS.red : JOYSTICK_COLORS.blue,
			'move', 1,
			[
				{key: 'KeyD', r: 1, a: 0},
				{key: 'KeyA', r: 1, a: Math.PI},
				{key: 'KeyW', r: 1, a: Math.PI * 3/2},
				{key: 'KeyS', r: 1, a: Math.PI * 1/2},
			]
		));


		client.appendButton(new Button(
			0.1, 0.9, ButtonPlacement.SCREEN_RATIO, ButtonPlacement.SCREEN_RATIO,
			playerIndex === 0 ? BUTTON_COLORS.red : BUTTON_COLORS.blue,
			'jump', 1, 1, ['KeyW']
		));

		client.appendButton(new Button(
			0.1, 0.8, ButtonPlacement.SCREEN_RATIO, ButtonPlacement.SCREEN_RATIO,
			BUTTON_COLORS.yellow,
			'powerup', 1, 1, ['Space']
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

			const path = POWERUP_TEXTURES[powerup.type];
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


		// Draw star count
		ctx.drawImage(
			imageLoader.getImage("star"),
			10, 10, 50, 50
		);

		const player = snapshot.map.players[playerIndex];
		
		const starsCount = player.stars.toString().padStart(2, '0');
		const starsToWinCount = snapshot.starsToWin.toString().padStart(2, '0');
		ctx.fillStyle = "yellow";
		ctx.font = "32px monospace";
		ctx.fillText(`${starsCount}/${starsToWinCount}`, 70, 45);

		// Draw current powerup
		let powerupImg;
		if (player.powerup instanceof powerups.Default) {
			powerupImg = POWERUP_TEXTURES[0];
		} else if (player.powerup instanceof powerups.Fire) {
			powerupImg = POWERUP_TEXTURES[1];
		} else if (player.powerup instanceof powerups.Ice) {
			powerupImg = POWERUP_TEXTURES[2];
		} else {
			powerupImg = "";
		}

		ctx.drawImage(
			imageLoader.getImage(powerupImg),
			10, 70, 50, 50
		);
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
