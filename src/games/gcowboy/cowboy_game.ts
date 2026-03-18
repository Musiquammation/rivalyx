import { CLIENT_IDS } from "../../net/CLIENT_IDS";
import { DataReader } from "../../net/DataReader";
import { DataWriter } from "../../net/DataWriter";
import { ServerGameEngine } from "../../server/ServerGameEngine";
import { GameInterface } from "../../GameInterface";
import { gcowboy } from "./cowboy_commons";
import { Star } from "./Star";
import { Player } from "./Player";

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
		const map = snapshot.map;

		// Players
		for (let player of map.players) {
			if (player.runCouldowns(speed))
				continue;

			player.frame(speed);
			player.applyCollisions(map, speed);

			if (player.mustReleaseStar) {
				player.releaseStar(
					map,
					player.mustReleaseStar.x,
					player.mustReleaseStar.y
				);

				player.mustReleaseStar = null;
			}

			if (player.isOutsideBox(map.gameBox)) {
				player.kill();
			}
		}


		// Stars
		for (let star of map.stars) {
			star.vy += Star.GRAVITY * speed; // gravity
			star.applyCollisions(map, speed);
			star.deadtime -= speed;
		}


		// Stars
		if (snapshot.servData) {
			map.spawnStars(speed);

			// Collision with players
			for (let i = map.stars.length - 1; i >= 0; i--) {
				const star = map.stars[i];
				if (star.isOutsideBox(map.gameBox)) {
					map.stars.splice(i, 1);
					continue;
				}


				if (star.deadtime > 0)
					continue;

				const starCount = star.checkPlayerCollisions(map.players);
				if (starCount < 0)
					continue;

				if (starCount >= snapshot.starsToWin) {
					snapshot.produceLeaderboard();
				}

				map.stars.splice(i, 1);
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
		for (const player of snapshot.map.players) {
			const lifeFlag = reader.readUint8();
			player.flags = reader.readUint8();

			if (lifeFlag === -1) {
				player.sessionAlive = false;
				player.respawnCouldown = Player.RESPAWN_COULDOWN;
				continue;
			}
			
			player.sessionAlive = true;
			if (lifeFlag === 0) {
				player.respawnCouldown = Player.RESPAWN_COULDOWN;
				continue;
			}

			player.respawnCouldown = -1;
			

			player.x = reader.readFloat32();
			player.y = reader.readFloat32();
			player.vx = reader.readFloat32();
			player.vy = reader.readFloat32();
			player.dirX = reader.readFloat32();
			player.stars = reader.readUint8();
			player.jumps = reader.readInt8();
			player.immuneCouldown = reader.readUint8() * (Player.IMMUNE_COULDOWN/250);
		}

		// Read stars
		const starCount = reader.readUint16();
		snapshot.map.stars.length = 0;
		for (let i = 0; i < starCount; i++) {
			const x = reader.readFloat32();
			const y = reader.readFloat32();
			const vx = reader.readFloat32();
			const vy = reader.readFloat32();
			const deadtime = reader.readUint8() * (Star.DEADTIME/250);

			const star = new Star(x, y, vx, vy, deadtime);
			snapshot.map.stars.push(star);
		}
	},

	writeNetworkDesc(snapshot: Snapshot, writer: DataWriter) {
		// Send players
		for (const player of snapshot.map.players) {
			let lifeFlag;
			if (!player.sessionAlive) {lifeFlag = -1;} // disconnected
			else if (player.respawnCouldown > 0) {lifeFlag = 0;} // respawning
			else {lifeFlag = 1;} // alive
			

			writer.writeUint8(lifeFlag);
			writer.writeUint8(player.flags);

			if (lifeFlag <= 0)
				continue;

			writer.writeFloat32(player.x);
			writer.writeFloat32(player.y);
			writer.writeFloat32(player.vx);
			writer.writeFloat32(player.vy);
			writer.writeFloat32(player.dirX);
			writer.writeUint8(player.stars);
			writer.writeInt8(player.jumps);
			writer.writeInt8(Math.floor(Math.max(player.immuneCouldown,0) * (250/Player.IMMUNE_COULDOWN)));
		}

		// Send stars
		writer.writeUint16(snapshot.map.stars.length);
		for (const star of snapshot.map.stars) {
			writer.writeFloat32(star.x);
			writer.writeFloat32(star.y);
			writer.writeFloat32(star.vx);
			writer.writeFloat32(star.vy);
			writer.writeInt8(Math.floor(Math.max(star.deadtime,0) * (250/Star.DEADTIME)));
		}
	}
}

