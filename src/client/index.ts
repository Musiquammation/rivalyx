import { DataReader } from "../net/DataReader";
import { DataWriter } from "../net/DataWriter";
import { CLIENT_IDS } from "../net/CLIENT_IDS";
import { SERVER_IDS } from "../net/SERVER_IDS";
import { ClientGameEngine } from "./ClientGameEngine";
import { ImageLoader } from "./ImageLoader";
import { CLIENT_DESCRIPTIONS } from "./clientGameList";


let socket: WebSocket | null = null;
let isConnected = false;
let isLoading = true;
let globalGameId = -1;
let loadedGameId = -1;
let globalGameEngine: ClientGameEngine | null = null;
let currentPlayerCount: number | null = null;
let maxPlayers: number | null = null;
let lobbyId: string | null = null;
let animationFrameId: number | null = null;
let lastPackageSendTimestamp = -1;
let globalImageLoader: ImageLoader | null = null;
let globalRoomUsernames: string[] = [];
const WS_PORT = 8020;
const FORCED_LATENCY = 30;

// Initialize connection with loading delay
async function initConnection() {
	isLoading = true;
	// Show loading state
	updateUI();
		
	socket = new WebSocket(`ws://localhost:${WS_PORT}`);
	
	socket.onopen = () => {
		console.log("Connected to server");
		// Client sends WELCOME first
		sendWelcome();
	};
	
	socket.onmessage = async (event) => {
		const data = event.data;
		let buffer: ArrayBuffer;

		if (data instanceof ArrayBuffer) {
			buffer = data;
		} else if (data instanceof Blob) {
			buffer = await data.arrayBuffer();
		} else if (typeof data === "string") {
			buffer = new TextEncoder().encode(data).buffer;
		} else {
			throw new Error("Unsupported WebSocket message type");
		}
		handleMessage(buffer);
	};
	
	socket.onerror = (error) => {
		console.error("WebSocket error:", error);
		isLoading = false;
		updateUI();
	};
	
	socket.onclose = () => {
		console.log("Disconnected from server");
		isConnected = false;
		isLoading = false;
		updateUI();
	};
}

function sendWelcome() {
	if (!socket || socket.readyState !== WebSocket.OPEN) return;
	
	const writer = new DataWriter();
	writer.writeUint8(SERVER_IDS.WELCOME);
	writer.writeUint8(SERVER_IDS.FINISH);
	
	socket.send(writer.toArrayBuffer());
}

function handleMessage(data: ArrayBuffer) {
	const reader = new DataReader(data);
	
	while (true) {
		const messageId = reader.readUint8();
		

		if (messageId === CLIENT_IDS.FINISH) {
			break;
		}
		
		switch (messageId) {
		case CLIENT_IDS.WELCOME:
			handleWelcome();
			break;

		case CLIENT_IDS.LOBBY_GAME:
			handleLobbyGame(reader);
			break;

		case CLIENT_IDS.LOBBY_UPDATE_PLAYER_COUNT:
			handlePlayerCountUpdate(reader);
			break;

		case CLIENT_IDS.SEEK_LOBBY:
			handleSeekLobby(reader);
			break;

		case CLIENT_IDS.GAME_DATA:
			handleGameData(reader);
			break;

		case CLIENT_IDS.END_GAME:
			handleEndGame(reader);
			break;

		default:
			console.warn("Unknown message ID:", messageId);
			return;
		}
	}
}

function handleWelcome() {
	console.log("Received WELCOME from server");
	isConnected = true;
	isLoading = false;
	updateUI();
}


async function handleLobbyGame(reader: DataReader) {
	const id = reader.read256();
	const game = reader.readInt32();
	globalGameId = game;
	lobbyId = id;

	
	// Get max players from game description
	if (globalGameId >= 0 && globalGameId < CLIENT_DESCRIPTIONS.length) {
		maxPlayers = CLIENT_DESCRIPTIONS[globalGameId].desc.playerCount;
	} else {
		maxPlayers = null;
	}
	
	currentPlayerCount = 1; // Reset player count
	
	// Show waiting menu
	showWaitingMenu();
	
	console.log(id, game);
}

function handlePlayerCountUpdate(reader: DataReader) {
	const number = reader.readInt32();
	
	currentPlayerCount = number;
	updateWaitingMenu();

	if (number < 0) {
		globalGameEngine = CLIENT_DESCRIPTIONS[globalGameId].create(globalImageLoader!);
		globalGameEngine.playerIndex = (-number) - 1;
		console.log("Player index:", globalGameEngine.playerIndex)

		// Hide waiting menu when game starts
		hideWaitingMenu();
		// Show canvas and start game loop
		startGame();
	}
	console.log(globalGameId);
}

function handleGameData(reader: DataReader) {
	if (!globalGameEngine)
		return;

	const now = Date.now();
	const diff = FORCED_LATENCY - (now - lastPackageSendTimestamp);

	const bufferToSend = globalGameEngine.clientNetwork(reader).toArrayBuffer();
	if (diff >= 0) {
		setTimeout(() => {
			lastPackageSendTimestamp = Date.now();
			socket?.send(bufferToSend);
		}, diff);
	
	} else if (globalGameEngine && socket) {		
		socket.send(bufferToSend);
		lastPackageSendTimestamp = now;
	}
}


function handleSeekLobby(reader: DataReader) {
	const lobbyHash = reader.read256();
	const gameId = reader.readInt32();
	
	if (gameId < 0)
		return;
	
	function send() {
		if (!socket || socket.readyState !== WebSocket.OPEN) return;

		const writer = new DataWriter();
		writer.writeUint8(SERVER_IDS.JOIN_LOBBY);
		writer.write256(lobbyHash);
		writer.writeUint8(SERVER_IDS.FINISH);
		
		socket.send(writer.toArrayBuffer());
	}

	if (globalImageLoader && loadedGameId == gameId) {
		send();
	} else {
		loadedGameId = -1;
		globalImageLoader = new ImageLoader();
		globalImageLoader.loadImages(CLIENT_DESCRIPTIONS[gameId].images).then(() => send());
	}
}

function handleEndGame(reader: DataReader) {
	const playerCount = reader.readInt16();
	const positions = new Array<number>(playerCount);
	for (let i = 0; i < playerCount; i++) {
		positions[i] = reader.readInt16();
	}

	// Stop the game
	stopGame();

	// Get player's position
	let playerPosition = 1;
	if (globalGameEngine && globalGameEngine.playerIndex !== undefined) {
		playerPosition = positions[globalGameEngine.playerIndex];
	}

	// Build leaderboard: group players by position
	const leaderboardByPosition: { [position: number]: number[] } = {};
	for (let i = 0; i < playerCount; i++) {
		const pos = positions[i];
		if (!leaderboardByPosition[pos]) {
			leaderboardByPosition[pos] = [];
		}
		leaderboardByPosition[pos].push(i);
	}

	// Sort positions
	const sortedPositions = Object.keys(leaderboardByPosition).map(Number).sort((a, b) => a - b);

	// Build leaderboard text
	const leaderboardEntries: string[] = [];
	for (const pos of sortedPositions) {
		const playerIndices = leaderboardByPosition[pos];
		const playerNames = playerIndices.map(idx => {
			const name = (globalRoomUsernames[idx] && globalRoomUsernames[idx].length > 0) 
				? globalRoomUsernames[idx] 
				: "anonymous";
			return name;
		});
		leaderboardEntries.push(`#${pos} ${playerNames.join(", ")}`);
	}

	// Display the end game menu
	showEndGameMenu(playerPosition, leaderboardEntries.join(", "));
}

function sendCreateLobby(gameId: number) {
	if (!socket || socket.readyState !== WebSocket.OPEN) return;
	
	const writer = new DataWriter();
	writer.writeUint8(SERVER_IDS.CREATE_LOBBY);
	writer.writeInt32(gameId);
	writer.writeUint8(SERVER_IDS.FINISH);
	
	socket.send(writer.toArrayBuffer());
}

async function showGameSelectionMenu(): Promise<number> {
	return new Promise<number>((resolve) => {
		const gameMenu = document.getElementById("gameMenu");
		const gameList = document.getElementById("gameList");
		const cancelBtn = document.getElementById("gameMenuCancel");
		
		if (!gameMenu || !gameList || !cancelBtn) {
			resolve(-1);
			return;
		}
		
		// Clear previous game list
		gameList.innerHTML = "";
		
		// Populate game list from gameDescriptions
		CLIENT_DESCRIPTIONS.forEach((gameDesc, index) => {
			const gameItem = document.createElement("div");
			gameItem.className = "gameItem";
			
			const gameName = document.createElement("div");
			gameName.className = "gameItemName";
			gameName.textContent = gameDesc.name;
			
			const gamePlayers = document.createElement("div");
			gamePlayers.className = "gameItemPlayers";
			gamePlayers.textContent = `${gameDesc.desc.playerCount} joueur${gameDesc.desc.playerCount > 1 ? 's' : ''}`;
			
			gameItem.appendChild(gameName);
			gameItem.appendChild(gamePlayers);
			
			gameItem.addEventListener("click", () => {
				gameMenu.classList.remove("show");
				resolve(index);
			});
			
			gameList.appendChild(gameItem);
		});
		
		// Show menu
		gameMenu.classList.add("show");
		
		// Handle cancel button
		const handleCancel = () => {
			gameMenu.classList.remove("show");
			cancelBtn.removeEventListener("click", handleCancel);
			resolve(-1);
		};
		
		cancelBtn.addEventListener("click", handleCancel);
		
		// Handle click outside menu
		const handleOutsideClick = (e: MouseEvent) => {
			if (e.target === gameMenu) {
				gameMenu.classList.remove("show");
				gameMenu.removeEventListener("click", handleOutsideClick);
				cancelBtn.removeEventListener("click", handleCancel);
				resolve(-1);
			}
		};
		
		gameMenu.addEventListener("click", handleOutsideClick);
	});
}

function sendJoinLobby(lobbyHash: string) {
	if (!socket || socket.readyState !== WebSocket.OPEN) return;
	
	const writer = new DataWriter();
	writer.writeUint8(SERVER_IDS.SEEK_LOBBY);
	writer.write256(lobbyHash);
	writer.writeUint8(SERVER_IDS.FINISH);
	
	socket.send(writer.toArrayBuffer());
}

function updateUI() {
	const loadingDiv = document.getElementById("loading");
	const buttonsDiv = document.getElementById("buttons");
	const waitingMenu = document.getElementById("waitingMenu");
	const isWaiting = waitingMenu?.classList.contains("show");
	
	if (isLoading) {
		if (loadingDiv) loadingDiv.style.display = "block";
		if (buttonsDiv) buttonsDiv.style.display = "none";
	} else {
		if (loadingDiv) loadingDiv.style.display = "none";
		// Hide buttons if we're in a waiting lobby
		if (buttonsDiv) buttonsDiv.style.display = isWaiting ? "none" : "flex";
	}
}

function showWaitingMenu() {
	const waitingMenu = document.getElementById("waitingMenu");
	if (waitingMenu) {
		waitingMenu.classList.add("show");
		updateWaitingMenu();
		updateUI(); // Update UI to hide buttons
	}
}

function hideWaitingMenu() {
	const waitingMenu = document.getElementById("waitingMenu");
	if (waitingMenu) {
		waitingMenu.classList.remove("show");
		updateUI(); // Update UI to show buttons again if needed
	}
}

function updateWaitingMenu() {
	const waitingMenuPlayers = document.getElementById("waitingMenuPlayers");
	if (waitingMenuPlayers) {
		const players = currentPlayerCount !== null ? currentPlayerCount : "?";
		const max = maxPlayers !== null ? maxPlayers : "?";
		waitingMenuPlayers.textContent = `${players} joueur${currentPlayerCount !== null && currentPlayerCount > 1 ? 's' : ''} connecté${currentPlayerCount !== null && currentPlayerCount > 1 ? 's' : ''} sur ${max}`;
	}
	
	// Update lobby ID display
	const waitingMenuLobbyId = document.getElementById("waitingMenuLobbyId");
	if (waitingMenuLobbyId) {
		const lobbyIdText = lobbyId || "?";
		const textNode = waitingMenuLobbyId.querySelector(".lobbyIdText");
		if (textNode) {
			textNode.textContent = lobbyIdText;
		}
	}
}

function copyLobbyId() {
	if (lobbyId) {
		navigator.clipboard.writeText(lobbyId).then(() => {
			// Visual feedback
			const copyBtn = document.getElementById("copyLobbyIdBtn");
			if (copyBtn) {
				const originalText = copyBtn.innerHTML;
				copyBtn.innerHTML = "✓";
				setTimeout(() => {
					copyBtn.innerHTML = originalText;
				}, 1000);
			}
		}).catch(err => {
			console.error("Failed to copy lobby ID:", err);
		});
	}
}

function showEndGameMenu(playerPosition: number, leaderboardText: string) {
	const endGameMenu = document.getElementById("endGameMenu");
	const endGamePlayerPosition = document.getElementById("endGamePlayerPosition");
	const endGameLeaderboard = document.getElementById("endGameLeaderboard");
	
	if (endGameMenu) {
		if (endGamePlayerPosition) {
			endGamePlayerPosition.textContent = `#${playerPosition}`;
		}
		if (endGameLeaderboard) {
			endGameLeaderboard.textContent = leaderboardText;
		}
		endGameMenu.classList.add("show");
	}
}

function hideEndGameMenu() {
	const endGameMenu = document.getElementById("endGameMenu");
	if (endGameMenu) {
		endGameMenu.classList.remove("show");
	}
}

function goToMainMenu() {
	hideEndGameMenu();
	hideWaitingMenu();
	stopGame();
	
	// Reset game state
	globalGameEngine = null;
	globalGameId = -1;
	lobbyId = null;
	currentPlayerCount = null;
	maxPlayers = null;
	globalRoomUsernames = [];
	
	// Show main menu buttons
	updateUI();
}

function startGame() {
	if (!globalGameEngine)
		return;

	const gameEngine = globalGameEngine;

	const gameCanvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
	if (!gameCanvas) return;
	
	const _ctx = gameCanvas.getContext("2d");
	if (!_ctx) return;
	const ctx = _ctx;
	
	// Set canvas reference in game engine
	gameEngine.setCanvas(gameCanvas);

	gameEngine.start();

	// Send first message
	socket?.send(gameEngine.clientNetwork(null).toArrayBuffer());
	
	// Show canvas
	gameCanvas.style.display = "block";
	
	// Set canvas size to full screen
	gameCanvas.width = window.innerWidth;
	gameCanvas.height = window.innerHeight;
	
	// Handle window resize
	const handleResize = () => {
		gameCanvas.width = window.innerWidth;
		gameCanvas.height = window.innerHeight;
	};
	window.addEventListener("resize", handleResize);
	
	// Game loop
	function gameLoop() {
		// Clear canvas
		ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
		
		// Draw game
		gameEngine.drawGame(ctx);
		
		// Draw joysticks on top
		gameEngine.drawJoysticks(ctx);
		
		// Continue loop
		animationFrameId = requestAnimationFrame(gameLoop);
	}
	
	// Start the loop
	gameLoop();
}

function stopGame() {
	if (animationFrameId !== null) {
		cancelAnimationFrame(animationFrameId);
		animationFrameId = null;
	}
	
	const gameCanvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
	if (gameCanvas) {
		gameCanvas.style.display = "none";
	}
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
	// Set initial UI state
	updateUI();
	
	// Initialize connection
	initConnection();
	
	// Button handlers
	const createLobbyBtn = document.getElementById("createLobbyBtn");
	const joinLobbyBtn = document.getElementById("joinLobbyBtn");
	
	if (createLobbyBtn) {
		createLobbyBtn.addEventListener("click", async () => {
			const gameId = await showGameSelectionMenu();
			if (!globalImageLoader || loadedGameId != gameId) {
				loadedGameId = -1;
				globalImageLoader = new ImageLoader();
				await globalImageLoader.loadImages(CLIENT_DESCRIPTIONS[gameId].images);
			}

			if (gameId >= 0) {
				sendCreateLobby(gameId);
			}
		});
	}
	
	if (joinLobbyBtn) {
		joinLobbyBtn.addEventListener("click", () => {
			const lobbyHash = prompt("Enter lobby hash:");
			if (lobbyHash) {
				sendJoinLobby(lobbyHash);
			}
		});
	}
	
	// Copy lobby ID button
	const copyLobbyIdBtn = document.getElementById("copyLobbyIdBtn");
	if (copyLobbyIdBtn) {
		copyLobbyIdBtn.addEventListener("click", copyLobbyId);
	}

	// End game menu button
	const endGameMenuBtn = document.getElementById("endGameMenuBtn");
	if (endGameMenuBtn) {
		endGameMenuBtn.addEventListener("click", goToMainMenu);
	}
});


// Event listeners for touch events
document.addEventListener("touchstart", e => {
	if (globalGameEngine) {
		globalGameEngine.handleTouchEvent('touchstart', e);
	}
}, {passive: false});

document.addEventListener("touchmove", e => {
	if (globalGameEngine) {
		globalGameEngine.handleTouchEvent('touchmove', e);
	}
}, {passive: false});

document.addEventListener("touchend", e => {
	if (globalGameEngine) {
		globalGameEngine.handleTouchEvent('touchend', e);
	}
}, {passive: false});

document.addEventListener("touchcancel", e => {
	if (globalGameEngine) {
		globalGameEngine.handleTouchEvent('touchend', e);
	}
}, {passive: false});