import { GameMap } from "./GameMap";
import { Player } from "./Player";

type Action = 'idle' | 'dive';



class ServData {
	leaderboard: number[] | null = null;
	sessionDeadPlayers = 0;
}




class Snapshot {
	static readonly PLAYER_COUNT = 2;

	map: GameMap;
	starsToWin = 10;

	servData: ServData | null;
	frame = 0;

	constructor(isServer: boolean) {
		this.servData = isServer ? new ServData() : null;

		const players: Player[] = [];
		for (let i = 0; i < Snapshot.PLAYER_COUNT; i++) {
			players.push(new Player(0, 0));
		}


		this.map = new GameMap(players, isServer);
		this.map.runTest();
	}


	produceLeaderboard() {
		if (!this.servData)
			return;

		
		
	}

	getLeaderboard() {
		if (!this.servData)
			return null;

		return this.servData.leaderboard;
	}

	killPlayer(idx: number) {
		if (this.servData && this.map.players[idx].sessionAlive) {
			this.map.players[idx].sessionAlive = false;
			this.map.players[idx].stars = -(++this.servData.sessionDeadPlayers);
		}
	}
	
}








export const gcowboy = {
	Snapshot,
};
