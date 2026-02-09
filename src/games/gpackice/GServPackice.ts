import { CLIENT_IDS } from "../../net/CLIENT_IDS";
import { DataReader } from "../../net/DataReader";
import { DataWriter } from "../../net/DataWriter";
import { SERVER_IDS } from "../../net/SERVER_IDS";
import { ServerGameEngine } from "../../server/ServerGameEngine";


class Player {
	x: number;
	y: number;
	vx = 0;
	vy = 0;
	eliminationFrame = -1;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}
}

export class GServPackice extends ServerGameEngine {
	static PLAYER_SPEED = 4;
	static TILES_X = 9;
	static TILES_Y = 21;
	static WIDTH = 100;
	static HEIGHT = 100;

	frameCount = 0;
	
	alivePlayers = -1;
	players: Player[] = [
		new Player(540, 290),
		new Player(540, 2090)
	];

	tiles = new Uint8Array(GServPackice.TILES_Y * GServPackice.TILES_X);


	start() {
		this.tiles.fill(255);
		this.alivePlayers = this.players.length;
	}

	moveAndCollide() {
		const radius = 50;

		for (const p of this.players) {
			p.x += p.vx * GServPackice.PLAYER_SPEED;
			p.y += p.vy * GServPackice.PLAYER_SPEED;
		}

		for (let i = 0; i < this.players.length; i++) {
			const p0 = this.players[i];
			
			for (let j = i + 1; j < this.players.length; j++) {
				const p1 = this.players[j];
				if (p1.eliminationFrame >= 0)
					continue; // player is dead

				// Vector between centers
				const dx = p1.x - p0.x;
				const dy = p1.y - p0.y;

				const distSq = dx * dx + dy * dy;
				const minDist = radius * 2;

				// Collision check
				if (distSq < minDist * minDist && distSq > 0) {

					const dist = Math.sqrt(distSq);

					// Normalized collision normal
					const nx = dx / dist;
					const ny = dy / dist;

					// Penetration depth
					const overlap = minDist - dist;

					// Split correction equally
					const correction = overlap * 0.5;

					p0.x -= nx * correction;
					p0.y -= ny * correction;

					p1.x += nx * correction;
					p1.y += ny * correction;
				}
			}
		}

	}

	frame() {
		this.moveAndCollide();


		for (let player of this.players) {
			if (player.eliminationFrame < 0 && !this.updatePlayerTile(player)) {
				player.eliminationFrame = this.frameCount;
				this.alivePlayers--;
			}
		}



		this.frameCount++;

		// Winner
		if (this.alivePlayers <= 1) {
			const playerStates: [number, number][] = this.players.map((p, idx) => [
				idx,
				p.eliminationFrame < 0 ? this.frameCount : p.eliminationFrame
			]);

			playerStates.sort((a, b) => b[1] - a[1]);
			
			const ranking: number[] = new Array(this.players.length);
			let rank = 1;
			for (let i = 0; i < playerStates.length; i++) {
				if (i > 0 && playerStates[i][1] !== playerStates[i - 1][1]) {
					rank = i + 1;
				}
				ranking[playerStates[i][0]] = rank;
			}
			return ranking;
		}

		return null;
	}


	servNetwork(reader: DataReader, index: number): DataWriter {
		// Joystick
		const player = this.players[index];
		if (reader.readInt8()) {
			let vx = reader.readFloat32();
			let vy = reader.readFloat32();
			const norm2 = vx * vx + vy * vy;
			if (norm2 > 1) {
				const inv = 1/Math.sqrt(norm2);
				vx *= inv;
				vy *= inv;
			}

			player.vx = vx;
			player.vy = vy;

		} else {
			player.vx = 0;
			player.vy = 0;
		}


		// Send data
		const writer = new DataWriter();
		writer.writeInt8(CLIENT_IDS.GAME_DATA);

		for (let player of this.players) {
			writer.writeFloat32(player.x);
			writer.writeFloat32(player.y);
			writer.writeFloat32(player.vx);
			writer.writeFloat32(player.vy);
		}

		writer.addUint8Array(this.tiles);


		writer.writeInt8(CLIENT_IDS.FINISH);

		return writer;
	}


	updatePlayerTile(player: Player) {
		const { x, y } = player;
		const tileSize = 100;
		const playerSize = 100;

		// Clamp tileX, tileY to grid if needed
		const isValidTile = (tx: number, ty: number) =>
			tx >= 0 && tx < GServPackice.TILES_X && ty >= 0 && ty < GServPackice.TILES_Y;

		// Helper to get a tile index safely
		const getTileIndex = (tx: number, ty: number) => {
			if (!isValidTile(tx, ty)) return -1;
			return ty * GServPackice.TILES_X + tx;
		};

		
		// Calcul de la tile centrale du joueur
		const centerX = Math.floor((x - 90)  / tileSize);
		const centerY = Math.floor((y - 140) / tileSize);
		
		const directions = [
			[0, 0],    // center
			[-1, 0],   // left
			[1, 0],    // right
			[0, -1],   // up
			[0, 1],    // down
			[-1, -1],  // up-left
			[1, -1],   // up-right
			[-1, 1],   // down-left
			[1, 1],    // down-right
		];
		
		let found = false;
		for (const [dx, dy] of directions) {
			const tx = centerX + dx;
			const ty = centerY + dy;
			const tidx = getTileIndex(tx, ty);
			if (tidx === -1 || this.tiles[tidx] == 0) {
				continue;
			}

			// Collision check - verify the circle overlaps with the tile rectangle
			const tileCenterX = tx * tileSize + 90 + tileSize / 2;
			const tileCenterY = ty * tileSize + 140 + tileSize / 2;

			const dxp = x - tileCenterX;
			const dyp = y - tileCenterY;
			const distSq = dxp * dxp + dyp * dyp;

			if (distSq < playerSize * playerSize) {
				this.tiles[tidx]--;
				found = true;
			}
		}
		
		return found;
	}

}