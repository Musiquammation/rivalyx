import { GameMap } from "./GameMap";
import { Player } from "./Player";

type Action = 'idle' | 'dive';



class ServData {
	killedPlayers: number[] = [];
}




class Snapshot {
	static readonly PLAYER_COUNT = 2;

	map: GameMap;


	servData: ServData | null;
	frame = 0;

	constructor(isServer: boolean) {
		this.servData = isServer ? new ServData() : null;

		const players: Player[] = [];
		for (let i = 0; i < Snapshot.PLAYER_COUNT; i++) {
			players.push(new Player(0, 0));
		}


		this.map = new GameMap(players);
		this.map.runTest();
	}



	getLeaderboard() {
		const len = this.map.players.length;
		if (!this.servData)
			return null;

		const killedPlayers = this.servData.killedPlayers;
		if (killedPlayers.length < this.map.players.length) {
			return null;
		}

		const leaderboard = new Array<number>(len);

		for (let i = 0; i < len; i++) {
			leaderboard[killedPlayers[i]] = len - i - 1;
		}
		return leaderboard;
	}

	killPlayer(idx: number) {
		if (this.servData && this.map.players[idx].alive) {
			this.servData.killedPlayers.push(idx);
			this.map.players[idx].alive = false;
		}
	}
	
}








export const gcowboy = {
	Snapshot,
};
