import { CLIENT_IDS } from "../../net/CLIENT_IDS";
import { DataReader } from "../../net/DataReader";
import { DataWriter } from "../../net/DataWriter";
import { SERVER_IDS } from "../../net/SERVER_IDS";
import { ServerGameEngine } from "../../server/ServerGameEngine";


class Player {
	static AIRTIME = 30;

	spawn_x: number;
	spawn_y: number;
	spawn_a: number;
	spawn_vx: number;
	spawn_vy: number;
	x: number;
	y: number;
	a: number;
	vx: number;
	vy: number;
	airTime: number;

	eliminationCouldown = -1;

	constructor(x: number, y: number, a: number) {
		this.spawn_x = x;
		this.spawn_y = y;
		this.spawn_a = a;
		this.spawn_vx = Math.cos(a);
		this.spawn_vy = Math.sin(a);

		this.x = this.spawn_x;
		this.y = this.spawn_y;
		this.a = this.spawn_a;
		this.vx = this.spawn_vx;
		this.vy = this.spawn_vy;
		this.airTime = Player.AIRTIME;

		this.respawn();
	}

	respawn() {
		this.x = this.spawn_x;
		this.y = this.spawn_y;
		this.a = this.spawn_a;
		this.vx = this.spawn_vx;
		this.vy = this.spawn_vy;
		this.airTime = Player.AIRTIME;
	}
}


const WIDTH = 1080;
const HEIGHT = 2400;

export class GServPackice extends ServerGameEngine {
	frameCount = 0;
	
	players: Player[] = [
		new Player(WIDTH/2, 0, Math.PI * 1/2),
		new Player(HEIGHT/2, HEIGHT, Math.PI * 3/2)
	];

	start() {
	}

	frame() {
		for (let player of this.players) {
			
		}


		for (let player of this.players) {
			
		}

		this.frameCount++;
		return null;
	}


	servNetwork(reader: DataReader, index: number): DataWriter {
		// Joystick
		const player = this.players[index];
		if (reader.readInt8()) {
			let vx = reader.readFloat32();
			let vy = reader.readFloat32();
			const norm2 = vx * vx + vy * vy;
			if (norm2 > 1) {
				const inv = 1/Math.sqrt(norm2);
				vx *= inv;
				vy *= inv;
			}

			player.vx = vx;
			player.vy = vy;

		} else {
			player.vx = 0;
			player.vy = 0;
		}


		// Send data
		const writer = new DataWriter();
		writer.writeInt8(CLIENT_IDS.GAME_DATA);

		for (let player of this.players) {
			writer.writeFloat32(player.x);
			writer.writeFloat32(player.y);
			writer.writeFloat32(player.a);
			if (player.airTime > 0) {
				writer.writeInt8(1);
			} else if (player.airTime < 0) {
				writer.writeInt8(-1);
			} else {
				writer.writeInt8(0);
			}
		}

		writer.writeInt8(CLIENT_IDS.FINISH);

		return writer;
	}
}