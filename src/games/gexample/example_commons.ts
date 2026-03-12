class Player {
	x: number;
	y: number;
	alive = true;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}
}


class ServData {
	killedPlayers: number[] = [];
}




class Snapshot {
	players: Player[] = [
		new Player(540, 290),
		new Player(540, 2090)
	];


	servData: ServData | null;
	frame = 0;

	constructor(isServer: boolean) {
		this.servData = isServer ? new ServData() : null;
	}



	getLeaderboard() {
		const len = this.players.length
		if (!this.servData)
			return null;

		const killedPlayers = this.servData.killedPlayers;
		if (killedPlayers.length < this.players.length) {
			return null;
		}

		const leaderboard = new Array<number>(len);

		for (let i = 0; i < len; i++) {
			leaderboard[killedPlayers[i]] = len - i - 1;
		}
		return leaderboard;
	}

	killPlayer(idx: number) {
		if (this.servData && this.players[idx].alive) {
			this.servData.killedPlayers.push(idx);
			this.players[idx].alive = false;
		}
	}
	
}

export const gexample = {
	Snapshot,
};

