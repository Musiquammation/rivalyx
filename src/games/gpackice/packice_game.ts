import { CLIENT_IDS } from "../../net/CLIENT_IDS";
import { DataReader } from "../../net/DataReader";
import { DataWriter } from "../../net/DataWriter";
import { ServerGameEngine } from "../../server/ServerGameEngine";
import { GameInterface } from "../../GameInterface";
import { gpackice } from "./packice_commons";

const Snapshot = gpackice.Snapshot;
type Snapshot = InstanceType<typeof gpackice.Snapshot>;

const PLAYER_SPEED = 0.4;


function getIdx(x: number, y: number) {
	if (x < 0 || y < 0 || x >= Snapshot.TILES_X || y >= Snapshot.TILES_Y)
		return -1;

	return y * Snapshot.TILES_X + x;
}


export const packice_game: GameInterface<Snapshot> = {
	playerCount: 2,

	createSnapshot(isServer: boolean) {
		return new Snapshot(isServer);
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


	frame(snapshot: Snapshot, speed: number, isServer: boolean) {
		for (let player of snapshot.players) {
			player.x += player.vx * speed*PLAYER_SPEED;
			player.y += player.vy * speed*PLAYER_SPEED;

			const x = Math.floor((player.x -  90) / 100);
			const y = Math.floor((player.y - 140) / 100);

			const p = getIdx(x, y);
			if (p >= 0) {
				const v = snapshot.tiles[p];
				if (v > 0) {
					snapshot.tiles[p] = v - speed;
					continue;
				}
			}

		}

	},

	readNetworkDesc(snapshot: Snapshot, reader: DataReader) {
		for (let player of snapshot.players) {
			player.x = reader.readFloat32();
			player.y = reader.readFloat32();
			player.vx = reader.readFloat32();
			player.vy = reader.readFloat32();
		}
	},

	writeNetworkDesc(snapshot: Snapshot, writer: DataWriter) {
		for (let player of snapshot.players) {
			writer.writeFloat32(player.x);
			writer.writeFloat32(player.y);
			writer.writeFloat32(player.vx);
			writer.writeFloat32(player.vy);
		}
	}
}

