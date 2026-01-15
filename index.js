(function() {
  "use strict";
  class DataReader {
    constructor(buffer) {
      this.offset = 0;
      this.view = new DataView(buffer);
    }
    readInt8() {
      const val = this.view.getInt8(this.offset);
      this.offset += 1;
      return val;
    }
    readUint8() {
      const val = this.view.getUint8(this.offset);
      this.offset += 1;
      return val;
    }
    readInt16(littleEndian = true) {
      const val = this.view.getInt16(this.offset, littleEndian);
      this.offset += 2;
      return val;
    }
    readUint16(littleEndian = true) {
      const val = this.view.getUint16(this.offset, littleEndian);
      this.offset += 2;
      return val;
    }
    readInt32(littleEndian = true) {
      const val = this.view.getInt32(this.offset, littleEndian);
      this.offset += 4;
      return val;
    }
    readUint32(littleEndian = true) {
      const val = this.view.getUint32(this.offset, littleEndian);
      this.offset += 4;
      return val;
    }
    readFloat32(littleEndian = true) {
      const val = this.view.getFloat32(this.offset, littleEndian);
      this.offset += 4;
      return val;
    }
    readFloat64(littleEndian = true) {
      const val = this.view.getFloat64(this.offset, littleEndian);
      this.offset += 8;
      return val;
    }
    read256() {
      const bytes = new Uint8Array(this.view.buffer, this.offset, 8);
      this.offset += 8;
      let hex = "";
      for (const b of bytes) {
        hex += (b >> 4 & 15).toString(16);
        hex += (b & 15).toString(16);
      }
      return hex;
    }
    readUint8Array(length) {
      const array = new Uint8Array(this.view.buffer, this.offset, length);
      this.offset += length;
      return new Uint8Array(array);
    }
  }
  class DataWriter {
    constructor(size = 64) {
      this.offset = 0;
      this.buffer = new ArrayBuffer(size);
      this.view = new DataView(this.buffer);
    }
    checkSize(required) {
      const needed = this.offset + required;
      if (needed <= this.buffer.byteLength) return;
      let newSize = this.buffer.byteLength;
      while (newSize < needed) {
        newSize *= 2;
      }
      const newBuffer = new ArrayBuffer(newSize);
      new Uint8Array(newBuffer).set(new Uint8Array(this.buffer));
      this.buffer = newBuffer;
      this.view = new DataView(this.buffer);
    }
    writeInt8(value) {
      this.checkSize(1);
      this.view.setInt8(this.offset, value);
      this.offset += 1;
      return this;
    }
    writeUint8(value) {
      this.checkSize(1);
      this.view.setUint8(this.offset, value);
      this.offset += 1;
      return this;
    }
    writeInt16(value, littleEndian = true) {
      this.checkSize(2);
      this.view.setInt16(this.offset, value, littleEndian);
      this.offset += 2;
      return this;
    }
    writeUint16(value, littleEndian = true) {
      this.checkSize(2);
      this.view.setUint16(this.offset, value, littleEndian);
      this.offset += 2;
      return this;
    }
    writeInt32(value, littleEndian = true) {
      this.checkSize(4);
      this.view.setInt32(this.offset, value, littleEndian);
      this.offset += 4;
      return this;
    }
    writeUint32(value, littleEndian = true) {
      this.checkSize(4);
      this.view.setUint32(this.offset, value, littleEndian);
      this.offset += 4;
      return this;
    }
    writeFloat32(value, littleEndian = true) {
      this.checkSize(4);
      this.view.setFloat32(this.offset, value, littleEndian);
      this.offset += 4;
      return this;
    }
    writeFloat64(value, littleEndian = true) {
      this.checkSize(8);
      this.view.setFloat64(this.offset, value, littleEndian);
      this.offset += 8;
      return this;
    }
    static getHex(caracter) {
      switch (caracter) {
        case "0":
          return 0;
        case "1":
          return 1;
        case "2":
          return 2;
        case "3":
          return 3;
        case "4":
          return 4;
        case "5":
          return 5;
        case "6":
          return 6;
        case "7":
          return 7;
        case "8":
          return 8;
        case "9":
          return 9;
        case "a":
          return 10;
        case "b":
          return 11;
        case "c":
          return 12;
        case "d":
          return 13;
        case "e":
          return 14;
        case "f":
          return 15;
        default:
          return 0;
      }
    }
    write256(hex) {
      if (hex === null) {
        this.checkSize(8);
        for (let i = 0; i < 8; i++) {
          this.view.setUint8(this.offset++, 0);
        }
        return;
      }
      if (hex.length !== 16) throw new Error("Hex string must be 16 characters (8 bytes)");
      this.checkSize(8);
      for (let i = 0; i < 16; i += 2) {
        const byte = DataWriter.getHex(hex[i]) << 4 | DataWriter.getHex(hex[i + 1]);
        this.view.setUint8(this.offset++, byte);
      }
    }
    addWriter(writer) {
      const length = writer.getOffset();
      if (length === 0) return;
      this.checkSize(length);
      new Uint8Array(this.buffer, this.offset, length).set(new Uint8Array(writer.toArrayBuffer()));
      this.offset += length;
    }
    addUint8Array(array) {
      const length = array.length;
      if (length === 0) return;
      this.checkSize(length);
      new Uint8Array(this.buffer, this.offset, length).set(array);
      this.offset += length;
    }
    toArrayBuffer() {
      return this.buffer.slice(0, this.offset);
    }
    getOffset() {
      return this.offset;
    }
  }
  var CLIENT_IDS = /* @__PURE__ */ ((CLIENT_IDS2) => {
    CLIENT_IDS2[CLIENT_IDS2["WELCOME"] = 0] = "WELCOME";
    CLIENT_IDS2[CLIENT_IDS2["LOBBY_GAME"] = 1] = "LOBBY_GAME";
    CLIENT_IDS2[CLIENT_IDS2["LOBBY_UPDATE_PLAYER_COUNT"] = 2] = "LOBBY_UPDATE_PLAYER_COUNT";
    CLIENT_IDS2[CLIENT_IDS2["SEEK_LOBBY"] = 3] = "SEEK_LOBBY";
    CLIENT_IDS2[CLIENT_IDS2["GAME_DATA"] = 4] = "GAME_DATA";
    CLIENT_IDS2[CLIENT_IDS2["END_GAME"] = 5] = "END_GAME";
    CLIENT_IDS2[CLIENT_IDS2["FINISH"] = 6] = "FINISH";
    return CLIENT_IDS2;
  })(CLIENT_IDS || {});
  var SERVER_IDS = /* @__PURE__ */ ((SERVER_IDS2) => {
    SERVER_IDS2[SERVER_IDS2["WELCOME"] = 0] = "WELCOME";
    SERVER_IDS2[SERVER_IDS2["CREATE_LOBBY"] = 1] = "CREATE_LOBBY";
    SERVER_IDS2[SERVER_IDS2["JOIN_LOBBY"] = 2] = "JOIN_LOBBY";
    SERVER_IDS2[SERVER_IDS2["SEEK_LOBBY"] = 3] = "SEEK_LOBBY";
    SERVER_IDS2[SERVER_IDS2["GAME_DATA"] = 4] = "GAME_DATA";
    SERVER_IDS2[SERVER_IDS2["FINISH"] = 5] = "FINISH";
    return SERVER_IDS2;
  })(SERVER_IDS || {});
  class ImageLoader {
    constructor() {
      this.images = /* @__PURE__ */ new Map();
    }
    async loadImages(images) {
      const promises = Object.entries(images).map(([name, url]) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.src = url;
          img.onload = () => {
            this.images.set(name, img);
            resolve();
          };
          img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        });
      });
      await Promise.all(promises);
    }
    getImage(key) {
      const img = this.images.get(key);
      if (img)
        return img;
      throw new Error("Failed to get image");
    }
  }
  const SHARED_DESCRIPTIONS = {
    packice: { playerCount: 2 }
  };
  var JoystickPlacement = /* @__PURE__ */ ((JoystickPlacement2) => {
    JoystickPlacement2[JoystickPlacement2["CENTERED"] = 0] = "CENTERED";
    JoystickPlacement2[JoystickPlacement2["SCREEN_RATIO"] = 1] = "SCREEN_RATIO";
    JoystickPlacement2[JoystickPlacement2["GAME_RATIO"] = 2] = "GAME_RATIO";
    return JoystickPlacement2;
  })(JoystickPlacement || {});
  class Joystick {
    constructor(x, y, xpl, ypl, label, radius = 32) {
      this.x = x;
      this.y = y;
      this.xpl = xpl;
      this.ypl = ypl;
      this.label = label;
      this.radius = radius;
      this.activeTouchId = void 0;
      this.stickX = 0;
      this.stickY = 0;
      this.originX = void 0;
      this.originY = void 0;
    }
  }
  class ClientGameEngine {
    constructor(imageLoader) {
      this.joysticks = /* @__PURE__ */ new Set();
      this.playerIndex = -1;
      this.canvas = null;
      this.imageLoader = imageLoader;
    }
    drawGame(ctx) {
      const gameSize = this.getGameSize();
      const screenWidth = this.canvas.width;
      const screenHeight = this.canvas.height;
      const scaleX = screenWidth / gameSize.width;
      const scaleY = screenHeight / gameSize.height;
      const scale = Math.min(scaleX, scaleY);
      const offsetX = (screenWidth - gameSize.width * scale) / 2;
      const offsetY = (screenHeight - gameSize.height * scale) / 2;
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      this.draw(ctx);
      ctx.restore();
    }
    setCanvas(canvas) {
      this.canvas = canvas;
    }
    handleTouchEvent(kind, event) {
      if (!this.canvas) return;
      this.canvas.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const canvasWidth = this.canvas.width;
      const canvasHeight = this.canvas.height;
      event.preventDefault();
      for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        const clientX = touch.clientX;
        const clientY = touch.clientY;
        const touchId = touch.identifier;
        if (kind === "touchstart") {
          let closestJoystick = null;
          let minDistance = Infinity;
          for (const joystick of this.joysticks) {
            if (joystick.activeTouchId !== void 0) continue;
            const pos = this.getJoystickPosition(joystick, screenWidth, screenHeight, canvasWidth, canvasHeight);
            const distance = Math.sqrt(Math.pow(clientX - pos.x, 2) + Math.pow(clientY - pos.y, 2));
            if (distance < minDistance) {
              minDistance = distance;
              closestJoystick = joystick;
            }
          }
          if (closestJoystick) {
            closestJoystick.activeTouchId = touchId;
            closestJoystick.originX = clientX;
            closestJoystick.originY = clientY;
            closestJoystick.stickX = 0;
            closestJoystick.stickY = 0;
          }
        } else if (kind === "touchmove") {
          for (const joystick of this.joysticks) {
            if (joystick.activeTouchId === touchId && joystick.originX !== void 0 && joystick.originY !== void 0) {
              this.updateJoystickPosition(joystick, clientX, clientY);
              break;
            }
          }
        } else if (kind === "touchend" || kind === "touchcancel") {
          for (const joystick of this.joysticks) {
            if (joystick.activeTouchId === touchId) {
              joystick.activeTouchId = void 0;
              joystick.stickX = 0;
              joystick.stickY = 0;
              joystick.originX = void 0;
              joystick.originY = void 0;
              break;
            }
          }
        }
      }
    }
    updateJoystickPosition(joystick, clientX, clientY) {
      if (joystick.originX === void 0 || joystick.originY === void 0) return;
      const radius = joystick.radius || 50;
      const dx = clientX - joystick.originX;
      const dy = clientY - joystick.originY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance <= radius) {
        joystick.stickX = dx / radius;
        joystick.stickY = dy / radius;
      } else {
        joystick.stickX = dx / distance;
        joystick.stickY = dy / distance;
      }
    }
    appendJoystick(joystick) {
      joystick.stickX = 0;
      joystick.stickY = 0;
      return this.joysticks.add(joystick);
    }
    removeJoystick(joystick) {
      return this.joysticks.delete(joystick);
    }
    getJoyStickDirection(label) {
      const joystick = Array.from(this.joysticks).find((j) => j.label === label);
      if (!joystick) return null;
      return { x: joystick.stickX, y: joystick.stickY };
    }
    getJoystickPosition(joystick, screenWidth, screenHeight, canvasWidth, canvasHeight) {
      if (joystick.originX !== void 0 && joystick.originY !== void 0) {
        return { x: joystick.originX, y: joystick.originY };
      }
      let x;
      let y;
      switch (joystick.xpl) {
        case 0:
          x = screenWidth / 2 + joystick.x;
          break;
        case 1:
          x = screenWidth * joystick.x;
          break;
        case 2:
          x = canvasWidth * joystick.x;
          break;
        default:
          x = joystick.x;
      }
      switch (joystick.ypl) {
        case 0:
          y = screenHeight / 2 + joystick.y;
          break;
        case 1:
          y = screenHeight * joystick.y;
          break;
        case 2:
          y = canvasHeight * joystick.y;
          break;
        default:
          y = joystick.y;
      }
      return { x, y };
    }
    drawJoysticks(ctx) {
      if (!this.canvas) return;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const canvasWidth = this.canvas.width;
      const canvasHeight = this.canvas.height;
      for (const joystick of this.joysticks) {
        const pos = this.getJoystickPosition(joystick, screenWidth, screenHeight, canvasWidth, canvasHeight);
        const radius = joystick.radius;
        const stickX = joystick.stickX;
        const stickY = joystick.stickY;
        ctx.fillStyle = "rgba(100, 100, 100, 0.5)";
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fill();
        const stickRadius = radius * 0.4;
        ctx.fillStyle = "rgba(150, 150, 150, 0.8)";
        ctx.beginPath();
        ctx.arc(pos.x + stickX * radius * 0.6, pos.y + stickY * radius * 0.6, stickRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  class Player {
    constructor(x, y, dir) {
      this.vx = 0;
      this.vy = 0;
      this.x = x;
      this.y = y;
      this.dir = dir;
    }
  }
  const _GClientPackice = class _GClientPackice extends ClientGameEngine {
    constructor(imageLoader) {
      super(imageLoader);
      this.tiles = new Uint8Array(_GClientPackice.TILES_Y * _GClientPackice.TILES_X);
      this.players = [
        new Player(540, 290, Math.PI / 2),
        new Player(540, 2090, Math.PI * 3 / 2)
      ];
    }
    async start() {
      super.appendJoystick(new Joystick(0.9, 0.9, JoystickPlacement.SCREEN_RATIO, JoystickPlacement.SCREEN_RATIO, "move"));
      this.tiles.fill(255);
    }
    getGameSize() {
      return { width: 1080, height: 2400 };
    }
    draw(ctx) {
      const floorImg = this.imageLoader.getImage("floor");
      let tile = 0;
      for (let y = 0; y < _GClientPackice.TILES_Y; y++) {
        for (let x = 0; x < _GClientPackice.TILES_X; x++) {
          const line = this.tiles[tile];
          ctx.save();
          ctx.globalAlpha = line / 255;
          ctx.drawImage(floorImg, 100 * x + 90, 100 * y + 140, 100, 100);
          ctx.restore();
          tile++;
        }
      }
      const playerImg = this.imageLoader.getImage("player");
      for (const player of this.players) {
        const px = player.x;
        const py = player.y;
        const size = 100;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(player.dir);
        ctx.drawImage(playerImg, -50, -50, size, size);
        ctx.restore();
      }
    }
    clientNetwork(reader) {
      if (reader) {
        for (let player of this.players) {
          player.x = reader.readFloat32();
          player.y = reader.readFloat32();
          player.vx = reader.readFloat32();
          player.vy = reader.readFloat32();
          if (player.vx != 0 || player.vy != 0) {
            player.dir = Math.atan2(player.vy, player.vx);
          }
        }
        this.tiles = reader.readUint8Array(_GClientPackice.TILES_Y * _GClientPackice.TILES_X);
      }
      const writer = new DataWriter();
      writer.writeInt8(SERVER_IDS.GAME_DATA);
      const joystick = super.getJoyStickDirection("move");
      if (joystick) {
        writer.writeInt8(1);
        writer.writeFloat32(joystick.x);
        writer.writeFloat32(joystick.y);
      } else {
        writer.writeInt8(0);
      }
      writer.writeInt8(SERVER_IDS.FINISH);
      return writer;
    }
  };
  _GClientPackice.IMAGES = {
    player: "/assets/gpackice/player.svg",
    floor: "/assets/gpackice/floor.svg"
  };
  _GClientPackice.TILES_X = 9;
  _GClientPackice.TILES_Y = 21;
  let GClientPackice = _GClientPackice;
  const CLIENT_DESCRIPTIONS = [
    {
      create: (imageLoader) => {
        return new GClientPackice(imageLoader);
      },
      desc: SHARED_DESCRIPTIONS.packice,
      name: "Banquise",
      images: GClientPackice.IMAGES
    }
  ];
  let socket = null;
  let isLoading = true;
  let globalGameId = -1;
  let loadedGameId = -1;
  let globalGameEngine = null;
  let currentPlayerCount = null;
  let maxPlayers = null;
  let lobbyId = null;
  let animationFrameId = null;
  let lastPackageSendTimestamp = -1;
  let globalImageLoader = null;
  let globalRoomUsernames = [];
  const WS_PORT = 8020;
  const FORCED_LATENCY = 30;
  async function initConnection() {
    isLoading = true;
    updateUI();
    socket = new WebSocket(`ws://localhost:${WS_PORT}`);
    socket.onopen = () => {
      console.log("Connected to server");
      sendWelcome();
    };
    socket.onmessage = async (event) => {
      const data = event.data;
      let buffer;
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
  function handleMessage(data) {
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
    isLoading = false;
    updateUI();
  }
  async function handleLobbyGame(reader) {
    const id = reader.read256();
    const game = reader.readInt32();
    globalGameId = game;
    lobbyId = id;
    if (globalGameId >= 0 && globalGameId < CLIENT_DESCRIPTIONS.length) {
      maxPlayers = CLIENT_DESCRIPTIONS[globalGameId].desc.playerCount;
    } else {
      maxPlayers = null;
    }
    currentPlayerCount = 1;
    showWaitingMenu();
    console.log(id, game);
  }
  function handlePlayerCountUpdate(reader) {
    const number = reader.readInt32();
    currentPlayerCount = number;
    updateWaitingMenu();
    if (number < 0) {
      globalGameEngine = CLIENT_DESCRIPTIONS[globalGameId].create(globalImageLoader);
      globalGameEngine.playerIndex = -number - 1;
      console.log("Player index:", globalGameEngine.playerIndex);
      hideWaitingMenu();
      startGame();
    }
    console.log(globalGameId);
  }
  function handleGameData(reader) {
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
  function handleSeekLobby(reader) {
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
  function handleEndGame(reader) {
    const playerCount = reader.readInt16();
    const positions = new Array(playerCount);
    for (let i = 0; i < playerCount; i++) {
      positions[i] = reader.readInt16();
    }
    stopGame();
    let playerPosition = 1;
    if (globalGameEngine && globalGameEngine.playerIndex !== void 0) {
      playerPosition = positions[globalGameEngine.playerIndex];
    }
    const leaderboardByPosition = {};
    for (let i = 0; i < playerCount; i++) {
      const pos = positions[i];
      if (!leaderboardByPosition[pos]) {
        leaderboardByPosition[pos] = [];
      }
      leaderboardByPosition[pos].push(i);
    }
    const sortedPositions = Object.keys(leaderboardByPosition).map(Number).sort((a, b) => a - b);
    const leaderboardEntries = [];
    for (const pos of sortedPositions) {
      const playerIndices = leaderboardByPosition[pos];
      const playerNames = playerIndices.map((idx) => {
        const name = globalRoomUsernames[idx] && globalRoomUsernames[idx].length > 0 ? globalRoomUsernames[idx] : "anonymous";
        return name;
      });
      leaderboardEntries.push(`#${pos} ${playerNames.join(", ")}`);
    }
    showEndGameMenu(playerPosition, leaderboardEntries.join(", "));
  }
  function sendCreateLobby(gameId) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const writer = new DataWriter();
    writer.writeUint8(SERVER_IDS.CREATE_LOBBY);
    writer.writeInt32(gameId);
    writer.writeUint8(SERVER_IDS.FINISH);
    socket.send(writer.toArrayBuffer());
  }
  async function showGameSelectionMenu() {
    return new Promise((resolve) => {
      const gameMenu = document.getElementById("gameMenu");
      const gameList = document.getElementById("gameList");
      const cancelBtn = document.getElementById("gameMenuCancel");
      if (!gameMenu || !gameList || !cancelBtn) {
        resolve(-1);
        return;
      }
      gameList.innerHTML = "";
      CLIENT_DESCRIPTIONS.forEach((gameDesc, index) => {
        const gameItem = document.createElement("div");
        gameItem.className = "gameItem";
        const gameName = document.createElement("div");
        gameName.className = "gameItemName";
        gameName.textContent = gameDesc.name;
        const gamePlayers = document.createElement("div");
        gamePlayers.className = "gameItemPlayers";
        gamePlayers.textContent = `${gameDesc.desc.playerCount} joueur${gameDesc.desc.playerCount > 1 ? "s" : ""}`;
        gameItem.appendChild(gameName);
        gameItem.appendChild(gamePlayers);
        gameItem.addEventListener("click", () => {
          gameMenu.classList.remove("show");
          resolve(index);
        });
        gameList.appendChild(gameItem);
      });
      gameMenu.classList.add("show");
      const handleCancel = () => {
        gameMenu.classList.remove("show");
        cancelBtn.removeEventListener("click", handleCancel);
        resolve(-1);
      };
      cancelBtn.addEventListener("click", handleCancel);
      const handleOutsideClick = (e) => {
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
  function sendJoinLobby(lobbyHash) {
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
      if (buttonsDiv) buttonsDiv.style.display = isWaiting ? "none" : "flex";
    }
  }
  function showWaitingMenu() {
    const waitingMenu = document.getElementById("waitingMenu");
    if (waitingMenu) {
      waitingMenu.classList.add("show");
      updateWaitingMenu();
      updateUI();
    }
  }
  function hideWaitingMenu() {
    const waitingMenu = document.getElementById("waitingMenu");
    if (waitingMenu) {
      waitingMenu.classList.remove("show");
      updateUI();
    }
  }
  function updateWaitingMenu() {
    const waitingMenuPlayers = document.getElementById("waitingMenuPlayers");
    if (waitingMenuPlayers) {
      const players = currentPlayerCount !== null ? currentPlayerCount : "?";
      const max = maxPlayers !== null ? maxPlayers : "?";
      waitingMenuPlayers.textContent = `${players} joueur${currentPlayerCount !== null && currentPlayerCount > 1 ? "s" : ""} connecté${currentPlayerCount !== null && currentPlayerCount > 1 ? "s" : ""} sur ${max}`;
    }
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
        const copyBtn = document.getElementById("copyLobbyIdBtn");
        if (copyBtn) {
          const originalText = copyBtn.innerHTML;
          copyBtn.innerHTML = "✓";
          setTimeout(() => {
            copyBtn.innerHTML = originalText;
          }, 1e3);
        }
      }).catch((err) => {
        console.error("Failed to copy lobby ID:", err);
      });
    }
  }
  function showEndGameMenu(playerPosition, leaderboardText) {
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
    globalGameEngine = null;
    globalGameId = -1;
    lobbyId = null;
    currentPlayerCount = null;
    maxPlayers = null;
    globalRoomUsernames = [];
    updateUI();
  }
  function startGame() {
    if (!globalGameEngine)
      return;
    const gameEngine = globalGameEngine;
    const gameCanvas = document.getElementById("gameCanvas");
    if (!gameCanvas) return;
    const _ctx = gameCanvas.getContext("2d");
    if (!_ctx) return;
    const ctx = _ctx;
    gameEngine.setCanvas(gameCanvas);
    gameEngine.start();
    socket?.send(gameEngine.clientNetwork(null).toArrayBuffer());
    gameCanvas.style.display = "block";
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;
    const handleResize = () => {
      gameCanvas.width = window.innerWidth;
      gameCanvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    function gameLoop() {
      ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
      gameEngine.drawGame(ctx);
      gameEngine.drawJoysticks(ctx);
      animationFrameId = requestAnimationFrame(gameLoop);
    }
    gameLoop();
  }
  function stopGame() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    const gameCanvas = document.getElementById("gameCanvas");
    if (gameCanvas) {
      gameCanvas.style.display = "none";
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    updateUI();
    initConnection();
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
    const copyLobbyIdBtn = document.getElementById("copyLobbyIdBtn");
    if (copyLobbyIdBtn) {
      copyLobbyIdBtn.addEventListener("click", copyLobbyId);
    }
    const endGameMenuBtn = document.getElementById("endGameMenuBtn");
    if (endGameMenuBtn) {
      endGameMenuBtn.addEventListener("click", goToMainMenu);
    }
  });
  document.addEventListener("touchstart", (e) => {
    if (globalGameEngine) {
      globalGameEngine.handleTouchEvent("touchstart", e);
    }
  }, { passive: false });
  document.addEventListener("touchmove", (e) => {
    if (globalGameEngine) {
      globalGameEngine.handleTouchEvent("touchmove", e);
    }
  }, { passive: false });
  document.addEventListener("touchend", (e) => {
    if (globalGameEngine) {
      globalGameEngine.handleTouchEvent("touchend", e);
    }
  }, { passive: false });
  document.addEventListener("touchcancel", (e) => {
    if (globalGameEngine) {
      globalGameEngine.handleTouchEvent("touchend", e);
    }
  }, { passive: false });
})();
