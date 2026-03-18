import { CLIENT_IDS } from "../../net/CLIENT_IDS";
import { DataReader } from "../../net/DataReader";
import { DataWriter } from "../../net/DataWriter";
import { ServerGameEngine } from "../../server/ServerGameEngine";
import { GameInterface } from "../../GameInterface";
import { gcowboy } from "./cowboy_commons";
import { Star } from "./Star";

const Snapshot = gcowboy.Snapshot;
type Snapshot = InstanceType<typeof gcowboy.Snapshot>;



export const cowboy_game: GameInterface<Snapshot> = {
	playerCount: Snapshot.PLAYER_COUNT,

	createSnapshot(isServer: boolean) {
		const snapshot = new Snapshot(isServer);
		return snapshot;
	},


	extractInput(reader: DataReader): ArrayBuffer {
		const writer = new DataWriter();
		const dx = reader.readFloat32();
		const flags = reader.readUint8();

		writer.writeFloat32(dx);
		writer.writeUint8(flags);
		return writer.toArrayBuffer();
	},

	handleInput(snapshot: Snapshot, data: DataReader, user: number) {
		const player = snapshot.map.players[user];
		player.dirX = data.readFloat32();
		player.flags = data.readUint8();
	},

	frame(snapshot: Snapshot, speed: number) {
		// Players
		for (let player of snapshot.map.players) {
			player.frame(speed);
			player.applyCollisions(snapshot.map, speed);
		}

		// Stars
		for (let star of snapshot.map.stars) {
			star.vy += Star.GRAVITY * speed; // gravity
			star.applyCollisions(snapshot.map, speed);
		}


		if (snapshot.servData) {
			snapshot.map.spawnStars(speed);
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
		for (const player of snapshot.map.players) {
			player.x = reader.readFloat32();
			player.y = reader.readFloat32();
			player.vx = reader.readFloat32();
			player.vy = reader.readFloat32();
			player.dirX = reader.readFloat32();
			player.alive = reader.readUint8() === 1;
			player.flags = reader.readUint8();
			player.jumps = reader.readInt8();
		}

		// Read stars
		const starCount = reader.readUint16();
		snapshot.map.stars.length = 0;
		for (let i = 0; i < starCount; i++) {
			const star = new Star(reader.readFloat32(), reader.readFloat32());
			star.vx = reader.readFloat32();
			star.vy = reader.readFloat32();
			snapshot.map.stars.push(star);
		}
	},

	writeNetworkDesc(snapshot: Snapshot, writer: DataWriter) {
		// Send players
		for (const player of snapshot.map.players) {
			writer.writeFloat32(player.x);
			writer.writeFloat32(player.y);
			writer.writeFloat32(player.vx);
			writer.writeFloat32(player.vy);
			writer.writeFloat32(player.dirX);
			writer.writeUint8(player.alive?1:0);
			writer.writeUint8(player.flags);
			writer.writeInt8(player.jumps);
		}

		// Send stars
		writer.writeUint16(snapshot.map.stars.length);
		for (const star of snapshot.map.stars) {
			writer.writeFloat32(star.x);
			writer.writeFloat32(star.y);
			writer.writeFloat32(star.vx);
			writer.writeFloat32(star.vy);
		}
	}
}

