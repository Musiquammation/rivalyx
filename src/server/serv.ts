import "dotenv/config";

import fs from "fs";
import http from "http";
import https from "https";
import { WebSocketServer, WebSocket } from "ws";
import crypto from "crypto";

import { DataReader } from "../net/DataReader";
import { DataWriter } from "../net/DataWriter";
import { CLIENT_IDS } from "../net/CLIENT_IDS";
import { SERVER_IDS } from "../net/SERVER_IDS";
import { SERV_DESCRIPTIONS } from "./servGameList";
import { ServerGameEngine } from "./ServerGameEngine";

const PORT = Number(process.env.PORT);

if (!PORT) {
	throw new Error("PORT is not defined or invalid");
}


let server;

if (Number(process.env.USE_HTTPS) === 0) {
	server = http.createServer((req, res) => {
		res.writeHead(200);
	});
} else {
	if (process.env.SSL_KEY_PATH === undefined || process.env.SSL_CERT_PATH === undefined) {
		throw new Error("SSL_KEY_PATH and/or SSL_CERT_PATH are not defined");
	}

	const options = {
		key: fs.readFileSync(process.env.SSL_KEY_PATH),
		cert: fs.readFileSync(process.env.SSL_CERT_PATH)
	};
	
	server = https.createServer(options, (req, res) => {
		res.writeHead(200);
	});

}



const wss = new WebSocketServer({ server });


interface Player {
	socket: WebSocket;
}


wss.on("connection", (socket: WebSocket) => {
	const player: Player = {socket};


	socket.on("message", (data: Buffer) => {
		handleMessage(socket, data, player);
	});

	socket.on("close", () => {
		// Remove client from all lobbies
		removeClientFromLobbies(socket);
		removeClientFromSessions(player);
	});
});



server.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});



// Lobby structure
interface Lobby {
	hash: string;
	gameId: number;
	players: Player[];
}

class Session {
	static LATENCY = 10;

	game: ServerGameEngine;
	playerCount: number;
	players: Player[];

	constructor(game: ServerGameEngine, players: Player[]) {
		this.game = game;
		this.players = players;
		this.playerCount = players.length;
	}

	run() {
		if (this.players.length === 0) {
			console.log("Game abandonned...");
			this.destroy();
			return;
		}

		/*const ranking = this.game.frame();
		if (ranking) {
			const writer = new DataWriter();
			writer.writeUint8(CLIENT_IDS.END_GAME);
			writer.writeInt16(this.playerCount);
			for (let i of ranking) {
				writer.writeInt16(i);
			}

			writer.writeUint8(CLIENT_IDS.FINISH);

			const buffer = writer.toArrayBuffer();
			for (let player of this.players) {
				player.socket.send(buffer);
			}

			console.log("Game finished!");
			this.destroy();
			return;
		}*/

		setTimeout(() => {
			this.run();
		}, Session.LATENCY);
	}

	destroy() {
		const index = sessions.indexOf(this);
		if (index >= 0) {
			sessions.splice(index, 1);
		}
	}
}

// Store all active lobbies
const lobbies = new Map<string, Lobby>();
const sessions: Session[] = [];


// Generate a random 16-character hex string (8 bytes = hash256)
function generateLobbyHash(): string {
	const bytes = new Uint8Array(8);
	crypto.getRandomValues(bytes);
	let hex = '';
	for (const b of bytes) {
		hex += ((b >> 4) & 0xF).toString(16);
		hex += (b & 0xF).toString(16);
	}
	return hex;
}

function handleMessage(socket: WebSocket, data: Buffer, player: Player) {
	// Convert Buffer to ArrayBuffer
	const buffer = data.buffer instanceof ArrayBuffer 
		? data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)
		: new Uint8Array(data).buffer;
	const reader = new DataReader(buffer);
	
	let continueWhileTrue = true;
	let messageId = reader.readUint8();
	while (continueWhileTrue) {
		// Server reads SERVER_IDS because it receives messages from client
		if (messageId === SERVER_IDS.FINISH) {
			break;
		}
		
		switch (messageId) {
		case SERVER_IDS.WELCOME:
			handleWelcome(socket);
			break;

		case SERVER_IDS.CREATE_LOBBY:
			handleCreateLobby(reader, player);
			break;

		case SERVER_IDS.JOIN_LOBBY:
			handleLobbyJoin(reader, player);
			break;

		case SERVER_IDS.SEEK_LOBBY:
			handleSeekLobby(reader, player);
			break;
			
		case SERVER_IDS.GAME_DATA:
			continueWhileTrue = handleGameData(reader, player);
			break;
			
		default:
			console.warn("Unknown message ID:", messageId);
			break;
		}

		messageId = reader.readUint8();
	}

}

function handleWelcome(socket: WebSocket) {
	const writer = new DataWriter();
	writer.writeUint8(CLIENT_IDS.WELCOME);
	writer.writeUint8(CLIENT_IDS.FINISH);
	
	socket.send(writer.toArrayBuffer());
}



function handleCreateLobby(reader: DataReader, player: Player) {
	const hash = generateLobbyHash();
	const gameId = reader.readInt32();
	
	if (SERV_DESCRIPTIONS[gameId].playerCount === 1) {
		const writer = new DataWriter();
		writer.writeUint8(CLIENT_IDS.LOBBY_GAME);
		writer.write256(hash);
		writer.writeInt32(gameId);
		writer.writeUint8(CLIENT_IDS.LOBBY_UPDATE_PLAYER_COUNT);
		writer.writeInt32(-1);
		writer.writeInt32(CLIENT_IDS.FINISH);
		
		const engine = new ServerGameEngine(SERV_DESCRIPTIONS[gameId]);
		const session = new Session(engine, [player]);
		sessions.push(session);
		session.run();

		player.socket.send(writer.toArrayBuffer());
		return;
	}


	const lobby: Lobby = {
		hash,
		gameId,
		players: [player]
	};
	
	lobbies.set(hash, lobby);
	console.log(`Lobby created: ${hash} for game ${gameId}`);
	
	// Send CREATE_LOBBY response to client
	const writer = new DataWriter();
	writer.writeUint8(CLIENT_IDS.LOBBY_GAME);
	writer.write256(hash);
	writer.writeInt32(gameId);
	writer.writeUint8(CLIENT_IDS.FINISH);
	
	player.socket.send(writer.toArrayBuffer());
}

function handleLobbyJoin(reader: DataReader, player: Player) {
	const lobbyHash = reader.read256();
	const lobby = lobbies.get(lobbyHash);
	
	if (!lobby) {
		console.log(`Lobby ${lobbyHash} not found`);
		// Could send an error message here if needed
		return;
	}
	
	// Check if client is already in the lobby
	if (lobby.players.includes(player)) {
		console.log(`Client already in lobby ${lobbyHash}`);
		return;
	}
	
	// Add client to lobby
	lobby.players.push(player);
	console.log(`Client joined lobby ${lobbyHash} (${lobby.players.length} players)`);
	
	// Send JOIN_LOBBY response to client
	const writer = new DataWriter();
	writer.writeUint8(CLIENT_IDS.LOBBY_GAME);
	writer.write256(lobbyHash);
	writer.writeInt32(lobby.gameId);

	// Check if the lobby is now full, and if so, send LOBBY_UPDATE_PLAYER_COUNT -1 and create/start the game
	const gameDesc = SERV_DESCRIPTIONS[lobby.gameId];
	if (lobby.players.length === gameDesc.playerCount) {
		writer.writeUint8(CLIENT_IDS.LOBBY_UPDATE_PLAYER_COUNT);
		writer.writeInt32(-lobby.players.length);

		
		const subLength = lobby.players.length - 1;
		for (let i = 0; i < subLength; i++) {
			const subWriter = new DataWriter();
			subWriter.writeUint8(CLIENT_IDS.LOBBY_UPDATE_PLAYER_COUNT);
			subWriter.writeInt32(-(i+1));
			subWriter.writeUint8(CLIENT_IDS.FINISH);
			const sharedArrayBuffer = subWriter.toArrayBuffer();
			lobby.players[i].socket.send(sharedArrayBuffer);
		}

		const engine = new ServerGameEngine(gameDesc);

		const session = new Session(engine, lobby.players);
		sessions.push(session);
		session.run();

		lobbies.delete(lobbyHash);
	
	} else {
		writer.writeUint8(CLIENT_IDS.LOBBY_UPDATE_PLAYER_COUNT);
		writer.writeInt32(lobby.players.length);

		const sharedWriter = new DataWriter();
		sharedWriter.writeUint8(CLIENT_IDS.LOBBY_UPDATE_PLAYER_COUNT);
		sharedWriter.writeInt32(lobby.players.length);
		sharedWriter.writeUint8(CLIENT_IDS.FINISH);
		const sharedArrayBuffer = sharedWriter.toArrayBuffer();

		const subLength = lobby.players.length - 1;
		for (let i = 0; i < subLength; i++) {
			lobby.players[i].socket.send(sharedArrayBuffer);
		}
	}

	writer.writeUint8(CLIENT_IDS.FINISH);
	
	player.socket.send(writer.toArrayBuffer());
}

function handleSeekLobby(reader: DataReader, player: Player) {
	const hash = reader.read256();
	const lobby = lobbies.get(hash);

	const writer = new DataWriter();
	writer.writeUint8(CLIENT_IDS.SEEK_LOBBY);
	writer.write256(hash);
	writer.writeInt32(lobby ? lobby.gameId : -1);
	writer.writeUint8(CLIENT_IDS.FINISH);
	player.socket.send(writer.toArrayBuffer());

}

function handleGameData(reader: DataReader, player: Player) {
	for (let session of Array.from(sessions.values())) {
		const index = session.players.indexOf(player);
		if (index < 0)
			continue;

		const writer = session.game.handleMessage(reader, index);
		player.socket.send(writer.toArrayBuffer());
		return true;
	}

	return false;
}




function removeClientFromLobbies(socket: WebSocket) {
	for (const [hash, lobby] of lobbies.entries()) {
		const index = lobby.players.findIndex(p => p.socket === socket);
		if (index !== -1) {
			lobby.players.splice(index, 1);
			console.log(`Client removed from lobby ${hash}`);
			
			// Remove lobby if empty
			if (lobby.players.length === 0) {
				lobbies.delete(hash);
				console.log(`Lobby ${hash} deleted (empty)`);
				continue;
			}

			const sharedWriter = new DataWriter();
			const length = lobby.players.length;
			sharedWriter.writeUint8(CLIENT_IDS.LOBBY_UPDATE_PLAYER_COUNT);
			sharedWriter.writeInt32(length);
			sharedWriter.writeUint8(CLIENT_IDS.FINISH);
			const sharedArrayBuffer = sharedWriter.toArrayBuffer();

			for (let i = 0; i < length; i++) {
				lobby.players[i].socket.send(sharedArrayBuffer);
			}
		}
	}
}




function removeClientFromSessions(player: Player) {
	for (let i = sessions.length - 1; i >= 0; i--) {
		const session = sessions[i];
		const playerIndex = session.players.indexOf(player);
		if (playerIndex !== -1) {
			session.players.splice(playerIndex, 1);
		}
	}
}





