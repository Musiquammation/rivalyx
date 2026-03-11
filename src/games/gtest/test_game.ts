import { CLIENT_IDS } from "../../net/CLIENT_IDS";
import { DataReader } from "../../net/DataReader";
import { DataWriter } from "../../net/DataWriter";
import { ServerGameEngine } from "../../server/ServerGameEngine";
import { GameInterface } from "../../GameInterface";
import { gtest } from "./test_commons";

const Snapshot = gtest.Snapshot;
type Snapshot = InstanceType<typeof gtest.Snapshot>;

const PLAYER_SPEED = 0.4;

export const test_game: GameInterface<Snapshot> = {
	playerCount: 2,

	createSnapshot(isServer: boolean) {
		const snapshot = new Snapshot();
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

	frame(snapshot: Snapshot, speed: number, isServer: boolean) {
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

