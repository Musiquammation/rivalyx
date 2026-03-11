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

class Snapshot {
	static TILES_X = 9;
	static TILES_Y = 21;
	static LIFETIME = 2.5;

	players: Player[] = [
		new Player(540, 290),
		new Player(540, 2090)
	];

	tiles = new Uint8Array(Snapshot.TILES_Y * Snapshot.TILES_X);
}

export const gpackice = {
	Player,
	Snapshot,
};

