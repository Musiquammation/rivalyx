import { CLIENT_IDS } from "../../net/CLIENT_IDS";
import { DataReader } from "../../net/DataReader";
import { DataWriter } from "../../net/DataWriter";
import { ServerGameEngine } from "../../server/ServerGameEngine";
import { GameInterface } from "../../GameInterface";
import { gpackice } from "./packice_commons";

const Snapshot = gpackice.Snapshot;
type Snapshot = InstanceType<typeof gpackice.Snapshot>;

const PLAYER_SPEED = 0.4;
const TILE_MODULO = 5 * 1000;


export const packice_game: GameInterface<Snapshot> = {
	playerCount: 2,

	createSnapshot(isServer: boolean) {
		const snapshot = new Snapshot(isServer);
		return snapshot;
	},


	extractInput(reader: DataReader): ArrayBuffer {
		const writer = new DataWriter();
		const x = reader.readFloat32();
		const y = reader.readFloat32();
		writer.writeFloat32(x);
		writer.writeFloat32(y);
		return writer.toArrayBuffer();
	},

	handleInput(snapshot: Snapshot, data: DataReader, user: number) {
		const player = snapshot.players[user];
		player.vx = data.readFloat32();
		player.vy = data.readFloat32();
	},

	frame(snapshot: Snapshot, speed: number) {
		// Run players
		for (let i = 0; i < snapshot.players.length; i++) {
			const player = snapshot.players[i];
			if (!player.alive)
				continue;

			player.x += player.vx * (speed*PLAYER_SPEED);
			player.y += player.vy * (speed*PLAYER_SPEED);

			let alive = false;
			for (let idx of player.getTouchedTiles()) {
				if (idx < 0)
					continue;

				const v = snapshot.tiles[idx];
				if (v === 0)
					continue;

				alive = true;
				if ((v % TILE_MODULO) === 0) {
					snapshot.tiles[idx] = v-1;
					continue;
				}
			}

			if (!alive) {
				snapshot.killPlayer(i);
			}
		}


		// Reduce
		for (let i = 0; i < snapshot.tiles.length; i++) {
			const tile = snapshot.tiles[i];
			if (tile > 0 && (tile % TILE_MODULO) !== 0) {
				snapshot.tiles[i] = Math.max(tile - speed, Math.floor(tile / TILE_MODULO) * TILE_MODULO);
			}
		}

		snapshot.frame += speed;

	},


	getLeaderboard(snapshot: Snapshot) {
		return snapshot.getLeaderboard();
	},

	killPlayer(snapshot: Snapshot, user: number) {
		snapshot.killPlayer(user);
	},



	readNetworkDesc(snapshot: Snapshot, reader: DataReader) {
		// Read players
		for (let player of snapshot.players) {
			player.x = reader.readFloat32();
			player.y = reader.readFloat32();
			player.vx = reader.readFloat32();
			player.vy = reader.readFloat32();
		}

		// Read tiles
		for (const tile of snapshot.onSquare()) {
			snapshot.tiles[tile.idx] = tile.value;
		}

	},

	writeNetworkDesc(snapshot: Snapshot, writer: DataWriter) {
		// Send players
		for (let player of snapshot.players) {
			writer.writeFloat32(player.x);
			writer.writeFloat32(player.y);
			writer.writeFloat32(player.vx);
			writer.writeFloat32(player.vy);
		}
	}
}

