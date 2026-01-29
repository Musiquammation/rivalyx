import { CLIENT_IDS } from "../../net/CLIENT_IDS";
import { DataReader } from "../../net/DataReader";
import { DataWriter } from "../../net/DataWriter";
import { SERVER_IDS } from "../../net/SERVER_IDS";
import { ServerGameEngine } from "../../server/ServerGameEngine";
import { obbCircleCollision } from "../../tools/collisions";


enum boosts {
	SPEED,
	// SPLASH,
	// BIG,

	COUNT,
};

class Player {
	static WIDTH = 40;
	static HEIGHT = 200;

	x: number;
	y: number;
	dir: number;
	vx = 0;
	vy = 0;
	lastNetworkDate = -1;
	
	x_list;
	y_list;
	a_list;

	boostDuration = -1;
	boostType = -1;

	constructor(x: number, y: number, dir: number, frames: number) {
		this.x = x;
		this.y = y;
		this.dir = dir;

		this.x_list = new Float32Array(60*frames);
		this.y_list = new Float32Array(60*frames);
		this.a_list = new Float32Array(60*frames);
	}

	getSpeed() {
		let factor;
		if (this.boostType === 0) {
			factor = 2;
		} else {
			factor = 1;
		}

		return {
			vx: this.vx * GServPaint.PLAYER_SPEED * factor,
			vy: this.vy * GServPaint.PLAYER_SPEED * factor,
		};
	}

	updateBoost() {
		this.boostDuration--;
		if (this.boostDuration <= 0) {
			this.boostType = -1;
		}
	}

	savePosition(frameCount: number) {
		this.x_list[frameCount] = this.x;
		this.y_list[frameCount] = this.y;
		this.a_list[frameCount] = this.dir;
	}
}





const WIDTH = 1080;
const HEIGHT = 2400;


class BoostHandler {
	static LUCK_INC = 0.000021;
	static RADIUS = 128;
	static LIFETIME = 10*60;
	static BOOST_DURATIONS = [300];
	type = -1;
	luck = 0;
	x = 0;
	y = 0;
	lifetime = -1;


	spawn(players: Player[]) {
		this.luck = 0;
		this.type = Math.floor(Math.random() * boosts.COUNT);
		this.lifetime = BoostHandler.LIFETIME;

		const p0 = players[0];
		const p1 = players[1];

		let finalX;
		let finalY;
		if (p0.x == p1.x) {
			finalX = Math.random() * WIDTH;
			finalY = (p1.y + p0.y)/2
		} else if (p0.y == p1.y) {
			finalX = (p1.x + p0.x)/2
			finalY = Math.random() * HEIGHT;
		} else {
			// const m = (p1.y - p0.y) / (p1.x - p0.x);
			const cx = (p0.x + p1.x)/2;
			const cy = (p0.y + p1.y)/2;
			const m = (p0.x - p1.x) / (p1.y - p0.y);
			const p = cy - m * cx;

			let xMin = Math.max(0, Math.min(-p/m, (HEIGHT-p)/m));
			let xMax = Math.min(WIDTH, Math.max(-p/m, (HEIGHT-p)/m));
			if (xMax < xMin) {
				const swap = xMin;
				xMin = xMax;
				xMax = swap;
			}
			
			finalX = xMin + Math.random() * (xMax - xMin);
			finalY = m * finalX + p;
		}

		this.x = finalX;
		this.y = finalY;
	}

	take() {
		this.type = -1;
	}

	update(players: Player[]) {
		// Search collision
		if (this.type >= 0) {
			let player: Player | null = null;
			for (let p of players) {
				if (obbCircleCollision(
					p.x, p.y, Player.WIDTH, Player.HEIGHT, p.dir,
					this.x, this.y, BoostHandler.RADIUS
				)) {
					if (player) {
						player = null;
						break;
					} else {
						player = p;
					}
				}
			}

			if (player) {
				player.boostDuration = BoostHandler.BOOST_DURATIONS[this.type];
				player.boostType = this.type;
				this.take();
			}
		}

		// Advacement
		if (this.type === -1) {
			this.luck += BoostHandler.LUCK_INC;
			if (Math.random() < this.luck) {
				this.spawn(players);
			}
		} else {
			this.lifetime--;
			if (this.lifetime < 0) {
				this.take();
			}
		}

	}
}

export class GServPaint extends ServerGameEngine {
	static PLAYER_SPEED = 4;
	static DURATION = 3600;

	static SPAWNS = [
		{x: 540, y:  290, a: Math.PI * 1/2},
		{x: 540, y: 2090, a: Math.PI * 3/2},
	];

	frameCount = 0;
	
	boost = new BoostHandler();

	players: Player[] = GServPaint.SPAWNS.map(u => new Player(
		u.x, u.y, u.a,
		GServPaint.DURATION
	));


	start() {
		
	}


	moveAndCollide() {
		const hw = Player.WIDTH / 2;
		const hh = Player.HEIGHT / 2;

		// 1) Avancer tous les joueurs
		for (const p of this.players) {
			const speed = p.getSpeed();
			p.x += speed.vx;
			p.y += speed.vy;
		}

		// 2) Collision + poussée
		for (let i = 0; i < this.players.length; i++) {
			for (let j = i + 1; j < this.players.length; j++) {

				const A = this.players[i];
				const B = this.players[j];

				// axes
				const uxA = Math.cos(A.dir), uyA = Math.sin(A.dir);
				const vxA = -uyA, vyA = uxA;

				const uxB = Math.cos(B.dir), uyB = Math.sin(B.dir);
				const vxB = -uyB, vyB = uxB;

				// sommets
				const cornersA = [
					{ x: A.x + uxA * hw + vxA * hh, y: A.y + uyA * hw + vyA * hh },
					{ x: A.x - uxA * hw + vxA * hh, y: A.y - uyA * hw + vyA * hh },
					{ x: A.x - uxA * hw - vxA * hh, y: A.y - uyA * hw - vyA * hh },
					{ x: A.x + uxA * hw - vxA * hh, y: A.y + uyA * hw - vyA * hh }
				];

				const cornersB = [
					{ x: B.x + uxB * hw + vxB * hh, y: B.y + uyB * hw + vyB * hh },
					{ x: B.x - uxB * hw + vxB * hh, y: B.y - uyB * hw + vyB * hh },
					{ x: B.x - uxB * hw - vxB * hh, y: B.y - uyB * hw - vyB * hh },
					{ x: B.x + uxB * hw - vxB * hh, y: B.y + uyB * hw - vyB * hh }
				];

				const axes = [
					{ x: uxA, y: uyA },
					{ x: vxA, y: vyA },
					{ x: uxB, y: uyB },
					{ x: vxB, y: vyB }
				];

				let overlapMin = Infinity;
				let bestAxis = null;

				for (const axis of axes) {

					const ax = axis.x;
					const ay = axis.y;

					let minA = Infinity, maxA = -Infinity;
					for (const p of cornersA) {
						const proj = p.x * ax + p.y * ay;
						minA = Math.min(minA, proj);
						maxA = Math.max(maxA, proj);
					}

					let minB = Infinity, maxB = -Infinity;
					for (const p of cornersB) {
						const proj = p.x * ax + p.y * ay;
						minB = Math.min(minB, proj);
						maxB = Math.max(maxB, proj);
					}

					if (maxA < minB || maxB < minA) {
						bestAxis = null;
						break;
					}

					const overlap = Math.min(maxA, maxB) - Math.max(minA, minB);
					if (overlap < overlapMin) {
						overlapMin = overlap;
						bestAxis = { x: ax, y: ay };
					}
				}

				// collision détectée
				if (bestAxis) {

					// sens correct
					const dx = B.x - A.x;
					const dy = B.y - A.y;
					const dot = dx * bestAxis.x + dy * bestAxis.y;
					if (dot < 0) {
						bestAxis.x *= -1;
						bestAxis.y *= -1;
					}

					const overlap = overlapMin;

					// poussée : A pousse B
					// si A bouge plus vite, il pousse plus fort
					const va = A.getSpeed();
					const vb = B.getSpeed();
					const speedA = Math.hypot(va.vx, va.vy);
					const speedB = Math.hypot(vb.vx, vb.vy);

					// poids inverses : plus vite = plus lourd dans la collision
					const forceA = Math.max(speedA, 0.001);
					const forceB = Math.max(speedB, 0.001);

					const total = forceA + forceB;

					const pushA = overlap * (forceB / total); // B repousse A (réaction)
					const pushB = overlap * (forceA / total); // A repousse B

					// appliquer la séparation
					A.x -= bestAxis.x * pushA;
					A.y -= bestAxis.y * pushA;

					B.x += bestAxis.x * pushB;
					B.y += bestAxis.y * pushB;
				}
			}
		}
	}

	keepPlayersInScreen() {
		const hw = Player.WIDTH / 2;
		const hh = Player.HEIGHT / 2;

		for (const p of this.players) {
			// Calculer la projection du rectangle roté sur les axes X et Y
			const cosDir = Math.cos(p.dir);
			const sinDir = Math.sin(p.dir);

			// Largeur et hauteur projetées du rectangle roté
			const projectedWidth = Math.abs(cosDir) * hw + Math.abs(sinDir) * hh;
			const projectedHeight = Math.abs(sinDir) * hw + Math.abs(cosDir) * hh;

			// Clamp le centre du joueur pour que le rectangle reste dans l'écran
			p.x = Math.max(projectedWidth, Math.min(p.x, WIDTH - projectedWidth));
			p.y = Math.max(projectedHeight, Math.min(p.y, HEIGHT - projectedHeight));
		}
	}

	frame() {
		// Resolve collisions
		this.moveAndCollide();

		// Keep players in screen
		this.keepPlayersInScreen();

		// Save positions and update boosts
		for (let player of this.players) {
			player.savePosition(this.frameCount);
			player.updateBoost();
		}


		this.boost.update(this.players);

		this.frameCount++;

		if (this.frameCount >= GServPaint.DURATION) {
			return this.calculateScores();
		}

		return null;
	}

	calculateScores() {
		const grid = new Uint8Array(WIDTH * HEIGHT);
		grid.fill(255);

		const player_len = this.players.length;
		const scores = GServPaint.SPAWNS.map(u => ({
			x: u.x,
			y: u.y,
			a: u.a,
			score: 0
		}));

		for (let step = 0; step < GServPaint.DURATION; step++) {
			for (let i = 0; i < player_len; i++) {
				// Fill pixels
				const cx = this.players[i].x_list[step];
				const cy = this.players[i].y_list[step];
				const a = this.players[i].a_list[step];

				const hw = Player.WIDTH / 2;
				const hh = Player.HEIGHT / 2;
				const cosA = Math.cos(a);
				const sinA = Math.sin(a);

				// Projection bounds for bounding box
				const projWidth = Math.abs(cosA) * hw + Math.abs(sinA) * hh;
				const projHeight = Math.abs(sinA) * hw + Math.abs(cosA) * hh;

				const minX = Math.max(0, Math.floor(cx - projWidth));
				const maxX = Math.min(WIDTH - 1, Math.ceil(cx + projWidth));
				const minY = Math.max(0, Math.floor(cy - projHeight));
				const maxY = Math.min(HEIGHT - 1, Math.ceil(cy + projHeight));

				// Check each pixel in bounding box
				for (let px = minX; px <= maxX; px++) {
					for (let py = minY; py <= maxY; py++) {
						// Transform pixel to rectangle's local coordinates
						const dx = px - cx;
						const dy = py - cy;

						const localX = dx * cosA + dy * sinA;
						const localY = -dx * sinA + dy * cosA;

						// Check if pixel is inside rectangle
						if (Math.abs(localX) <= hw && Math.abs(localY) <= hh) {
							const idx = py * WIDTH + px;
							if (grid[idx] !== i) {
								grid[idx] = i;
								scores[i].score++;
							}
						}
					}
				}

				// Move pixels
				scores[i].x = this.players[i].x_list[step];
				scores[i].y = this.players[i].y_list[step];
				scores[i].a = this.players[i].a_list[step];
			}
		}

		// Sort players by score (descending)
		const sortedScores = scores
			.map((score, index) => ({ index, score: score.score }))
			.sort((a, b) => b.score - a.score)
			.map(item => item.index + 1);

		return sortedScores;
	}

	displayGrid(grid: Uint8Array) {
		let gridDisplay = "";
		for (let y = 0; y < HEIGHT; y++) {
			for (let x = 0; x < WIDTH; x++) {
				const value = grid[y * WIDTH + x];
				if (value === 255) {
					gridDisplay += "X";
				} else {
					gridDisplay += value;
				}
			}
			gridDisplay += "\n";
		}
		return gridDisplay;
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
		writer.writeInt32(GServPaint.DURATION - this.frameCount); // time
		writer.writeInt8(this.boost.type);
		if (this.boost.type >= 0) {
			writer.writeFloat32(this.boost.x);
			writer.writeFloat32(this.boost.y);
		}
		for (let player of this.players) {
			writer.writeFloat32(player.x);
			writer.writeFloat32(player.y);
			writer.writeFloat32(player.vx);
			writer.writeFloat32(player.vy);
		}

		writer.writeInt8(CLIENT_IDS.FINISH);

		return writer;
	}
	
}