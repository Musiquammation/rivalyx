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


	*getTouchedTiles() {
		const s = 100;
		const x = this.x % s;
		const y = this.y % s;
		const cx = Math.floor((this.x -  90) / s);
		const cy = Math.floor((this.y - 140) / s);
		const r = Snapshot.PLAYER_RADIUS;
		const sqR = r * (.5 * Math.sqrt(2));
	
		yield Snapshot.getIdx(cx, cy);

		// Right
		if (x + r >= s) {yield Snapshot.getIdx(cx+1, cy);}
		
		// Up
		if (y - r < 0) {yield Snapshot.getIdx(cx, cy-1);}

		// Left
		if (x - r < 0) {yield Snapshot.getIdx(cx-1, cy);}

		// Down
		if (x + r > 0) {yield Snapshot.getIdx(cx, cy+1);}

		// Up Right
		if (y - sqR < 0 && x + sqR >= s)
			yield Snapshot.getIdx(cx + 1, cy - 1);

		// Up Left
		if (y - sqR < 0 && x - sqR < 0)
			yield Snapshot.getIdx(cx - 1, cy - 1);

		// Down Left
		if (y + sqR >= s && x - sqR < 0)
			yield Snapshot.getIdx(cx - 1, cy + 1);

		// Down Right
		if (y + sqR >= s && x + sqR >= s)
			yield Snapshot.getIdx(cx + 1, cy + 1);
	}
}


class ServData {

}

class Snapshot {
	static readonly TILES_X = 9;
	static readonly TILES_Y = 21;
	static readonly LIFETIME = 6000;
	static readonly SEND_RANGE = 2;
	static readonly PLAYER_RADIUS = 40;

	players: Player[] = [
		new Player(540, 290),
		new Player(540, 2090)
	];

	tiles = new Int16Array(Snapshot.TILES_Y * Snapshot.TILES_X);

	servData: ServData | null;

	constructor(isServer: boolean) {
		this.servData = isServer ? new ServData() : null;
		this.tiles.fill(Snapshot.LIFETIME);
	}

	*onSquare() {
		const seen = new Set<number>();
		for (const player of this.players) {
			const px = player.x;
			const py = player.y;
	
			for (let dy = -Snapshot.SEND_RANGE; dy <= Snapshot.SEND_RANGE; dy++) {
				for (let dx = -Snapshot.SEND_RANGE; dx <= Snapshot.SEND_RANGE; dx++) {
	
					const idx = Snapshot.getIdx(px + dx, py + dy);
					if (idx === -1) continue;
	
					if (seen.has(idx)) continue;
					seen.add(idx);
	
					yield {idx, value: this.tiles[idx]};
				}
			}
		}
	}



	static getIdx(x: number, y: number) {
		if (x < 0 || y < 0 || x >= Snapshot.TILES_X || y >= Snapshot.TILES_Y)
			return -1;
	
		return y * Snapshot.TILES_X + x;
	}
	
}

export const gpackice = {
	Snapshot,
};

