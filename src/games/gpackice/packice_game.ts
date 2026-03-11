import { CLIENT_IDS } from "../../net/CLIENT_IDS";
import { DataReader } from "../../net/DataReader";
import { DataWriter } from "../../net/DataWriter";
import { ServerGameEngine } from "../../server/ServerGameEngine";
import { GameInterface } from "../../GameInterface";
import { gpackice } from "./packice_commons";

const Snapshot = gpackice.Snapshot;
type Snapshot = InstanceType<typeof gpackice.Snapshot>;

const PLAYER_SPEED = 0.1;

export const packice_game: GameInterface<Snapshot> = {
	playerCount: 2,

	createSnapshot() {
		const snapshot = new Snapshot();
		snapshot.tiles.fill(255);
		return snapshot;
	},

	copySnapshot(src: Snapshot): Snapshot {
		const dst = new Snapshot();

		for (let i = 0; i < src.players.length; i++) {
			dst.players[i].x = src.players[i].x;
			dst.players[i].y = src.players[i].y;
			dst.players[i].vx = src.players[i].vx;
			dst.players[i].vy = src.players[i].vy;
		}

		console.log("copy", src.players[0].y);

		return dst;
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
		for (let player of snapshot.players) {
			player.x += player.vx * speed*PLAYER_SPEED;
			player.y += player.vy * speed*PLAYER_SPEED;
		}
	},

	readNetworkDesc(snapshot: Snapshot, reader: DataReader) {
		for (let player of snapshot.players) {
			player.x = reader.readFloat32();
			player.y = reader.readFloat32();
			player.vx = reader.readFloat32();
			player.vy = reader.readFloat32();
		}

		console.log("shared:", snapshot.players[0].y);
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

