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
	players: Player[] = [
		new Player(540, 290),
		new Player(540, 2090),
		
	];
}

export const gtest = {
	Player,
	Snapshot,
};

