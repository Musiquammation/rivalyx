(function() {
  "use strict";
  var _a;
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
    addDataView(view) {
      const length = view.byteLength;
      if (length === 0) return;
      this.checkSize(length);
      new Uint8Array(this.buffer, this.offset, length).set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
      this.offset += length;
    }
    addArrayBuffer(buffer) {
      const length = buffer.byteLength;
      if (length === 0) return;
      this.checkSize(length);
      new Uint8Array(this.buffer, this.offset, length).set(new Uint8Array(buffer));
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
  function getTimestamp() {
    return Date.now() >>> 0;
  }
  var JoystickPlacement = /* @__PURE__ */ ((JoystickPlacement2) => {
    JoystickPlacement2[JoystickPlacement2["CENTERED"] = 0] = "CENTERED";
    JoystickPlacement2[JoystickPlacement2["SCREEN_RATIO"] = 1] = "SCREEN_RATIO";
    JoystickPlacement2[JoystickPlacement2["GAME_RATIO"] = 2] = "GAME_RATIO";
    return JoystickPlacement2;
  })(JoystickPlacement || {});
  const JOYSTICK_COLORS = {
    blue: { base: [35, 65, 165], stick: [65, 99, 208] },
    red: { base: [148, 45, 45], stick: [208, 65, 65] }
  };
  const _Joystick = class _Joystick {
    constructor(x, y, xpl, ypl, color, label, radiusRatio = 1) {
      this.radius = 32;
      this.x = x;
      this.y = y;
      this.xpl = xpl;
      this.ypl = ypl;
      this.label = label;
      this.color = color;
      this.radiusRatio = radiusRatio;
      this.activeTouchId = void 0;
      this.stickX = 0;
      this.stickY = 0;
      this.originX = void 0;
      this.originY = void 0;
    }
    updateRatio(screenArea) {
      this.radius = screenArea * this.radiusRatio * _Joystick.FACTOR;
    }
  };
  _Joystick.FACTOR = 0.05;
  let Joystick = _Joystick;
  const MAX_FRAME_DURATION = 10;
  class ClientGameEngine {
    constructor(imageLoader, object) {
      this.joysticks = /* @__PURE__ */ new Set();
      this.buttons = /* @__PURE__ */ new Set();
      this.playerIndex = -1;
      this.lastSendDate = -Infinity;
      this.canvas = null;
      this.inputs = [];
      this.imageLoader = imageLoader;
      this.object = object;
      this.snapshot = object.game.createSnapshot(false);
    }
    start() {
      this.memory = this.object.createMemory(
        this.snapshot,
        this,
        this.playerIndex
      );
    }
    getGameSize() {
      return this.object.gameSize;
    }
    getTimer() {
      return this.object.getTimer(this.snapshot);
    }
    addInput(data) {
      this.inputs.push({
        date: getTimestamp(),
        user: this.playerIndex,
        content: data
      });
      this.object.game.handleInput(this.snapshot, new DataReader(data), this.playerIndex);
    }
    draw(ctx) {
      const applyToScreen = () => {
        const gameSize = this.getGameSize();
        const screenWidth = this.canvas.width;
        const screenHeight = this.canvas.height;
        const scaleX = screenWidth / gameSize.width;
        const scaleY = screenHeight / gameSize.height;
        const scale = Math.min(scaleX, scaleY);
        const offsetX = (screenWidth - gameSize.width * scale) / 2;
        const offsetY = (screenHeight - gameSize.height * scale) / 2;
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
      };
      this.object.draw(
        this.snapshot,
        this.memory,
        ctx,
        this.canvas.width,
        this.canvas.height,
        this.imageLoader,
        this.playerIndex,
        applyToScreen
      );
    }
    getFirstInput(date) {
      let l = 0;
      let r = this.inputs.length;
      while (l < r) {
        const mid = l + r >>> 1;
        if (this.inputs[mid].date < date)
          l = mid + 1;
        else
          r = mid;
      }
      return l;
    }
    runFrame(duration) {
      while (duration >= MAX_FRAME_DURATION) {
        this.object.game.frame(this.snapshot, MAX_FRAME_DURATION);
        duration -= MAX_FRAME_DURATION;
      }
      this.object.game.frame(this.snapshot, duration);
      this.object.clientFrame(this.snapshot, this.memory, this.playerIndex, this);
    }
    static readInputs(reader) {
      const length = reader.readUint32();
      const newInputs = new Array(length);
      for (let i = 0; i < length; i++) {
        const date = reader.readUint32();
        const byteLength = reader.readUint16();
        const user = reader.readUint16();
        const input = {
          date,
          user,
          content: reader.readUint8Array(byteLength).buffer
        };
        newInputs[i] = input;
      }
      return newInputs;
    }
    mergeInputs(newInputs) {
      const merged = [];
      let i = 0;
      let j = 0;
      while (i < this.inputs.length && j < newInputs.length) {
        if (this.inputs[i].date <= newInputs[j].date) {
          merged.push(this.inputs[i++]);
        } else {
          merged.push(newInputs[j++]);
        }
      }
      while (i < this.inputs.length)
        merged.push(this.inputs[i++]);
      while (j < newInputs.length)
        merged.push(newInputs[j++]);
      return merged;
    }
    simulateInputs(startDate, inputs) {
      if (inputs.length === 0) {
        const date = getTimestamp();
        this.object.game.frame(
          this.snapshot,
          date - startDate
        );
      } else {
        const lengthLimit = inputs.length - 1;
        this.runFrame(Math.max(inputs[0].date - startDate, 0));
        for (let i = 0; i < lengthLimit; i++) {
          const input = inputs[i];
          let date2 = Math.max(startDate, input.date);
          this.object.game.handleInput(
            this.snapshot,
            new DataReader(input.content),
            input.user
          );
          this.runFrame(Math.max(inputs[i + 1].date - date2, 0));
        }
        const date = getTimestamp();
        this.object.game.handleInput(
          this.snapshot,
          new DataReader(inputs[lengthLimit].content),
          this.playerIndex
        );
        this.runFrame(date - inputs[lengthLimit].date);
      }
    }
    handleNetwork(reader) {
      if (reader) {
        reader.readUint32();
        this.object.game.readNetworkDesc(this.snapshot, reader);
        const startDate = reader.readUint32();
        const mergedInputs = this.mergeInputs(
          ClientGameEngine.readInputs(reader)
        );
        this.simulateInputs(startDate, mergedInputs);
      }
      const writer = new DataWriter();
      writer.writeUint8(SERVER_IDS.GAME_DATA);
      writer.writeUint32(getTimestamp());
      for (let input of this.inputs) {
        writer.writeUint32(input.date);
        writer.addArrayBuffer(input.content);
      }
      writer.writeUint32(0);
      writer.writeUint8(SERVER_IDS.FINISH);
      this.inputs.length = 0;
      this.lastSendDate = getTimestamp();
      return writer;
    }
    setCanvas(canvas) {
      this.canvas = canvas;
    }
    handleTouchEvent(kind, event) {
      if (!this.canvas) return;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const canvasWidth = this.canvas.width;
      const canvasHeight = this.canvas.height;
      this.object.handleSubTouchEvent(
        this.snapshot,
        kind,
        event,
        screenWidth,
        screenHeight,
        canvasWidth,
        canvasHeight
      );
      let shouldPreventDefault = true;
      for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        if (element && (element.tagName === "BUTTON" || element.tagName === "A" || element.closest("button") || element.closest("a"))) {
          shouldPreventDefault = false;
          break;
        }
      }
      if (shouldPreventDefault) {
        event.preventDefault();
      }
      for (let i = 0; i < event.changedTouches.length; i++) {
        const touch = event.changedTouches[i];
        const clientX = touch.clientX;
        const clientY = touch.clientY;
        const touchId = touch.identifier;
        const element = document.elementFromPoint(clientX, clientY);
        const isInteractiveElement = element && (element.tagName === "BUTTON" || element.tagName === "A" || element.closest("button") || element.closest("a"));
        if (isInteractiveElement) {
          continue;
        }
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
    appendButton(button) {
      this.buttons.add(button);
    }
    removeButton(button) {
      this.buttons.delete(button);
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
        case JoystickPlacement.CENTERED:
          x = screenWidth / 2 + joystick.x;
          break;
        case JoystickPlacement.SCREEN_RATIO:
          x = screenWidth * joystick.x;
          break;
        case JoystickPlacement.GAME_RATIO:
          x = canvasWidth * joystick.x;
          break;
        default:
          x = joystick.x;
      }
      switch (joystick.ypl) {
        case JoystickPlacement.CENTERED:
          y = screenHeight / 2 + joystick.y;
          break;
        case JoystickPlacement.SCREEN_RATIO:
          y = screenHeight * joystick.y;
          break;
        case JoystickPlacement.GAME_RATIO:
          y = canvasHeight * joystick.y;
          break;
        default:
          y = joystick.y;
      }
      return { x, y };
    }
    drawJoysticks(ctx, screenArea) {
      if (!this.canvas) return;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const canvasWidth = this.canvas.width;
      const canvasHeight = this.canvas.height;
      for (const joystick of this.joysticks) {
        joystick.updateRatio(screenArea);
        const pos = this.getJoystickPosition(joystick, screenWidth, screenHeight, canvasWidth, canvasHeight);
        const radius = joystick.radius;
        const stickX = joystick.stickX;
        const stickY = joystick.stickY;
        ctx.fillStyle = `rgba(${joystick.color.base[0]}, ${joystick.color.base[1]}, ${joystick.color.base[2]}, 0.5)`;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fill();
        const stickRadius = radius * 0.4;
        ctx.fillStyle = `rgba(${joystick.color.stick[0]}, ${joystick.color.stick[1]}, ${joystick.color.stick[2]}, 0.8)`;
        ctx.beginPath();
        ctx.arc(pos.x + stickX * radius * 0.6, pos.y + stickY * radius * 0.6, stickRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
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
  let Player$2 = class Player {
    constructor(x, y) {
      this.alive = true;
      this.x = x;
      this.y = y;
    }
  };
  let ServData$1 = class ServData {
    constructor() {
      this.killedPlayers = [];
    }
  };
  let Snapshot$6 = class Snapshot {
    constructor(isServer) {
      this.players = [
        new Player$2(540, 290),
        new Player$2(540, 2090)
      ];
      this.frame = 0;
      this.servData = isServer ? new ServData$1() : null;
    }
    getLeaderboard() {
      const len = this.players.length;
      if (!this.servData)
        return null;
      const killedPlayers = this.servData.killedPlayers;
      if (killedPlayers.length < this.players.length) {
        return null;
      }
      const leaderboard = new Array(len);
      for (let i = 0; i < len; i++) {
        leaderboard[killedPlayers[i]] = len - i - 1;
      }
      return leaderboard;
    }
    killPlayer(idx) {
      if (this.servData && this.players[idx].alive) {
        this.servData.killedPlayers.push(idx);
        this.players[idx].alive = false;
      }
    }
  };
  const gcowboy = {
    Snapshot: Snapshot$6
  };
  const Snapshot$5 = gcowboy.Snapshot;
  const cowboy_game = {
    playerCount: 2,
    createSnapshot(isServer) {
      const snapshot = new Snapshot$5(isServer);
      return snapshot;
    },
    extractInput(reader) {
      const writer = new DataWriter();
      return writer.toArrayBuffer();
    },
    handleInput(snapshot, data, user) {
      snapshot.players[user];
    },
    frame(snapshot, speed) {
      snapshot.frame += speed;
    },
    getLeaderboard(snapshot) {
      return snapshot.getLeaderboard();
    },
    killPlayer(snapshot, user) {
      snapshot.killPlayer(user);
    },
    readNetworkDesc(snapshot, reader) {
    },
    writeNetworkDesc(snapshot, writer) {
    }
  };
  const cowboy_client = {
    game: cowboy_game,
    name: "Cowboy",
    images: {
      playerRed: "assets/gpackice/player-red.svg",
      playerBlue: "assets/gpackice/player-blue.svg",
      floor: "assets/gpackice/floor.svg"
    },
    gameSize: { width: 1080, height: 2400 },
    createMemory(snapshot, client, playerIndex) {
      client.appendJoystick(new Joystick(
        0.9,
        0.9,
        JoystickPlacement.SCREEN_RATIO,
        JoystickPlacement.SCREEN_RATIO,
        playerIndex === 0 ? JOYSTICK_COLORS.red : JOYSTICK_COLORS.blue,
        "move"
      ));
      return {
        playerDirections: [Math.PI * 1 / 2, Math.PI * 3 / 2],
        lastSentX: Infinity,
        lastSentY: Infinity
      };
    },
    getTimer(snapshot) {
      return -1;
    },
    draw(snapshot, memory, ctx, screenWidth, screenHeight, imageLoader, playerIndex, applyToScreen) {
      if (playerIndex === 0) {
        ctx.fillStyle = "rgb(98, 25, 25)";
      } else {
        ctx.fillStyle = "rgb(25, 39, 98)";
      }
      ctx.fillRect(0, 0, screenWidth, screenHeight);
      ctx.save();
      applyToScreen();
      const imagesNames = ["playerRed", "playerBlue"];
      for (let i = 0; i < 2; i++) {
        const player = snapshot.players[i];
        const px = player.x;
        const py = player.y;
        const half = 40;
        const size = half * 2;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(memory.playerDirections[i]);
        ctx.drawImage(
          imageLoader.getImage(imagesNames[i]),
          -half,
          -half,
          size,
          size
        );
        ctx.restore();
      }
      ctx.restore();
    },
    clientFrame(snapshot, memory, playerIndex, client) {
      for (let i = 0; i < snapshot.players.length; i++) {
        if (i == playerIndex)
          continue;
      }
      let dir = client.getJoyStickDirection("move");
      if (!dir) {
        dir = { x: 0, y: 0 };
      }
      if (dir.x != memory.lastSentX || dir.y != memory.lastSentY) {
        memory.lastSentX = dir.x;
        memory.lastSentY = dir.y;
        if (dir.x != 0 || dir.y != 0) {
          memory.playerDirections[playerIndex] = Math.atan2(dir.y, dir.x);
        }
        const writer = new DataWriter();
        writer.writeFloat32(dir.x);
        writer.writeFloat32(dir.y);
        client.addInput(writer.toArrayBuffer());
      }
    },
    handleSubTouchEvent(snapshot, kind, event, screenWidth, screenHeight, canvasWidth, canvasHeight) {
    }
  };
  let Player$1 = class Player {
    constructor(x, y) {
      this.vx = 0;
      this.vy = 0;
      this.alive = true;
      this.x = x;
      this.y = y;
    }
    *getTouchedTiles() {
      const s = 100;
      const x = this.x % s;
      const y = this.y % s;
      const cx = Math.floor((this.x - 90) / s);
      const cy = Math.floor((this.y - 140) / s);
      const r = Snapshot$4.PLAYER_RADIUS;
      const sqR = r * (0.5 * Math.sqrt(2));
      yield Snapshot$4.getIdx(cx, cy);
      if (x + r >= s) {
        yield Snapshot$4.getIdx(cx + 1, cy);
      }
      if (y - r < 0) {
        yield Snapshot$4.getIdx(cx, cy - 1);
      }
      if (x - r < 0) {
        yield Snapshot$4.getIdx(cx - 1, cy);
      }
      if (x + r > 0) {
        yield Snapshot$4.getIdx(cx, cy + 1);
      }
      if (y - sqR < 0 && x + sqR >= s)
        yield Snapshot$4.getIdx(cx + 1, cy - 1);
      if (y - sqR < 0 && x - sqR < 0)
        yield Snapshot$4.getIdx(cx - 1, cy - 1);
      if (y + sqR >= s && x - sqR < 0)
        yield Snapshot$4.getIdx(cx - 1, cy + 1);
      if (y + sqR >= s && x + sqR >= s)
        yield Snapshot$4.getIdx(cx + 1, cy + 1);
    }
  };
  class ServData {
    constructor() {
      this.killedPlayers = [];
    }
  }
  let Snapshot$4 = (_a = class {
    constructor(isServer) {
      this.players = [
        new Player$1(540, 290),
        new Player$1(540, 2090)
      ];
      this.tiles = new Int16Array(_a.TILES_Y * _a.TILES_X);
      this.frame = 0;
      this.servData = isServer ? new ServData() : null;
      this.tiles.fill(_a.LIFETIME);
    }
    *onSquare() {
      const seen = /* @__PURE__ */ new Set();
      for (const player of this.players) {
        const px = player.x;
        const py = player.y;
        for (let dy = -_a.SEND_RANGE; dy <= _a.SEND_RANGE; dy++) {
          for (let dx = -_a.SEND_RANGE; dx <= _a.SEND_RANGE; dx++) {
            const idx = _a.getIdx(px + dx, py + dy);
            if (idx === -1) continue;
            if (seen.has(idx)) continue;
            seen.add(idx);
            yield { idx, value: this.tiles[idx] };
          }
        }
      }
    }
    getLeaderboard() {
      const len = this.players.length;
      if (!this.servData)
        return null;
      const killedPlayers = this.servData.killedPlayers;
      if (killedPlayers.length < this.players.length) {
        return null;
      }
      const leaderboard = new Array(len);
      for (let i = 0; i < len; i++) {
        leaderboard[killedPlayers[i]] = len - i - 1;
      }
      return leaderboard;
    }
    killPlayer(idx) {
      if (this.servData && this.players[idx].alive) {
        console.log("Kill " + idx);
        this.servData.killedPlayers.push(idx);
        this.players[idx].alive = false;
      }
    }
    static getIdx(x, y) {
      if (x < 0 || y < 0 || x >= _a.TILES_X || y >= _a.TILES_Y)
        return -1;
      return y * _a.TILES_X + x;
    }
  }, _a.TILES_X = 9, _a.TILES_Y = 21, _a.LIFETIME = 12 * 1e3, _a.SEND_RANGE = 3, _a.PLAYER_RADIUS = 40, _a);
  const gpackice = {
    Snapshot: Snapshot$4
  };
  const Snapshot$3 = gpackice.Snapshot;
  const PLAYER_SPEED$1 = 0.4;
  const TILE_MODULO = 5 * 1e3;
  const packice_game = {
    playerCount: 2,
    createSnapshot(isServer) {
      const snapshot = new Snapshot$3(isServer);
      return snapshot;
    },
    extractInput(reader) {
      const writer = new DataWriter();
      const x = reader.readFloat32();
      const y = reader.readFloat32();
      writer.writeFloat32(x);
      writer.writeFloat32(y);
      return writer.toArrayBuffer();
    },
    handleInput(snapshot, data, user) {
      const player = snapshot.players[user];
      player.vx = data.readFloat32();
      player.vy = data.readFloat32();
    },
    frame(snapshot, speed) {
      for (let i = 0; i < snapshot.players.length; i++) {
        const player = snapshot.players[i];
        if (!player.alive)
          continue;
        player.x += player.vx * (speed * PLAYER_SPEED$1);
        player.y += player.vy * (speed * PLAYER_SPEED$1);
        let alive = false;
        for (let idx of player.getTouchedTiles()) {
          if (idx < 0)
            continue;
          const v = snapshot.tiles[idx];
          if (v === 0)
            continue;
          alive = true;
          if (v % TILE_MODULO === 0) {
            snapshot.tiles[idx] = v - 1;
            continue;
          }
        }
        if (!alive) {
          snapshot.killPlayer(i);
        }
      }
      for (let i = 0; i < snapshot.tiles.length; i++) {
        const tile = snapshot.tiles[i];
        if (tile > 0 && tile % TILE_MODULO !== 0) {
          snapshot.tiles[i] = Math.max(tile - speed, Math.floor(tile / TILE_MODULO) * TILE_MODULO);
        }
      }
      snapshot.frame += speed;
    },
    getLeaderboard(snapshot) {
      return snapshot.getLeaderboard();
    },
    killPlayer(snapshot, user) {
      snapshot.killPlayer(user);
    },
    readNetworkDesc(snapshot, reader) {
      for (let player of snapshot.players) {
        player.x = reader.readFloat32();
        player.y = reader.readFloat32();
        player.vx = reader.readFloat32();
        player.vy = reader.readFloat32();
        player.alive = reader.readInt8() != 0;
      }
      for (const tile of snapshot.onSquare()) {
        snapshot.tiles[tile.idx] = tile.value;
      }
    },
    writeNetworkDesc(snapshot, writer) {
      for (let player of snapshot.players) {
        writer.writeFloat32(player.x);
        writer.writeFloat32(player.y);
        writer.writeFloat32(player.vx);
        writer.writeFloat32(player.vy);
        writer.writeInt8(player.alive ? 1 : 0);
      }
    }
  };
  const Snapshot$2 = gpackice.Snapshot;
  const TILES_X = Snapshot$2.TILES_X;
  const TILES_Y = Snapshot$2.TILES_Y;
  const packice_client = {
    game: packice_game,
    name: "Pingouins",
    images: {
      playerRed: "assets/gpackice/player-red.svg",
      playerBlue: "assets/gpackice/player-blue.svg",
      floor: "assets/gpackice/floor.svg"
    },
    gameSize: { width: 1080, height: 2400 },
    createMemory(snapshot, client, playerIndex) {
      client.appendJoystick(new Joystick(
        0.9,
        0.9,
        JoystickPlacement.SCREEN_RATIO,
        JoystickPlacement.SCREEN_RATIO,
        playerIndex === 0 ? JOYSTICK_COLORS.red : JOYSTICK_COLORS.blue,
        "move"
      ));
      return {
        playerDirections: [Math.PI * 1 / 2, Math.PI * 3 / 2],
        lastSentX: Infinity,
        lastSentY: Infinity
      };
    },
    getTimer(snapshot) {
      return -1;
    },
    draw(snapshot, memory, ctx, screenWidth, screenHeight, imageLoader, playerIndex, applyToScreen) {
      if (playerIndex === 0) {
        ctx.fillStyle = "rgb(98, 25, 25)";
      } else {
        ctx.fillStyle = "rgb(25, 39, 98)";
      }
      ctx.fillRect(0, 0, screenWidth, screenHeight);
      ctx.save();
      applyToScreen();
      const floorImg = imageLoader.getImage("floor");
      let tile = 0;
      for (let y = 0; y < TILES_Y; y++) {
        for (let x = 0; x < TILES_X; x++) {
          const line = snapshot.tiles[tile];
          ctx.save();
          ctx.globalAlpha = line / Snapshot$2.LIFETIME;
          ctx.drawImage(floorImg, 100 * x + 90, 100 * y + 140, 100, 100);
          ctx.restore();
          tile++;
        }
      }
      const imagesNames = ["playerRed", "playerBlue"];
      for (let i = 0; i < 2; i++) {
        const player = snapshot.players[i];
        const px = player.x;
        const py = player.y;
        const half = Snapshot$2.PLAYER_RADIUS;
        const size = half * 2;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(memory.playerDirections[i]);
        ctx.drawImage(
          imageLoader.getImage(imagesNames[i]),
          -half,
          -half,
          size,
          size
        );
        ctx.restore();
      }
      ctx.restore();
    },
    clientFrame(snapshot, memory, playerIndex, client) {
      for (let i = 0; i < snapshot.players.length; i++) {
        if (i == playerIndex)
          continue;
        const vx = snapshot.players[i].vx;
        const vy = snapshot.players[i].vy;
        if (vx != 0 || vy != 0) {
          memory.playerDirections[i] = Math.atan2(vy, vx);
        }
      }
      let dir = client.getJoyStickDirection("move");
      if (!dir) {
        dir = { x: 0, y: 0 };
      }
      if (dir.x != memory.lastSentX || dir.y != memory.lastSentY) {
        memory.lastSentX = dir.x;
        memory.lastSentY = dir.y;
        if (dir.x != 0 || dir.y != 0) {
          memory.playerDirections[playerIndex] = Math.atan2(dir.y, dir.x);
        }
        const writer = new DataWriter();
        writer.writeFloat32(dir.x);
        writer.writeFloat32(dir.y);
        client.addInput(writer.toArrayBuffer());
      }
    },
    handleSubTouchEvent(snapshot, kind, event, screenWidth, screenHeight, canvasWidth, canvasHeight) {
    }
  };
  class Player {
    constructor(x, y) {
      this.vx = 0;
      this.vy = 0;
      this.eliminationFrame = -1;
      this.x = x;
      this.y = y;
    }
  }
  let Snapshot$1 = class Snapshot {
    constructor() {
      this.players = [
        new Player(540, 290),
        new Player(540, 2090)
      ];
    }
  };
  const gtest = {
    Snapshot: Snapshot$1
  };
  const Snapshot = gtest.Snapshot;
  const PLAYER_SPEED = 0.6;
  const test_game = {
    playerCount: 2,
    createSnapshot(isServer) {
      const snapshot = new Snapshot();
      return snapshot;
    },
    extractInput(reader) {
      const writer = new DataWriter();
      const x = reader.readFloat32();
      const y = reader.readFloat32();
      writer.writeFloat32(x);
      writer.writeFloat32(y);
      return writer.toArrayBuffer();
    },
    handleInput(snapshot, data, user) {
      const player = snapshot.players[user];
      player.vx = data.readFloat32();
      player.vy = data.readFloat32();
    },
    frame(snapshot, speed) {
      for (let player of snapshot.players) {
        player.x += player.vx * speed * PLAYER_SPEED;
        player.y += player.vy * speed * PLAYER_SPEED;
      }
    },
    getLeaderboard(snapshot) {
      return null;
    },
    killPlayer(snapshot, user) {
    },
    readNetworkDesc(snapshot, reader) {
      for (let player of snapshot.players) {
        player.x = reader.readFloat32();
        player.y = reader.readFloat32();
        player.vx = reader.readFloat32();
        player.vy = reader.readFloat32();
      }
    },
    writeNetworkDesc(snapshot, writer) {
      for (let player of snapshot.players) {
        writer.writeFloat32(player.x);
        writer.writeFloat32(player.y);
        writer.writeFloat32(player.vx);
        writer.writeFloat32(player.vy);
      }
    }
  };
  window.dirX = 0;
  window.dirY = 0;
  const test_client = {
    game: test_game,
    name: "Test",
    images: {
      playerRed: "assets/gpackice/player-red.svg",
      playerBlue: "assets/gpackice/player-blue.svg",
      floor: "assets/gpackice/floor.svg"
    },
    gameSize: { width: 1080, height: 2400 },
    createMemory(snapshot, client, playerIndex) {
      client.appendJoystick(new Joystick(
        0.9,
        0.9,
        JoystickPlacement.SCREEN_RATIO,
        JoystickPlacement.SCREEN_RATIO,
        playerIndex === 0 ? JOYSTICK_COLORS.red : JOYSTICK_COLORS.blue,
        "move"
      ));
      return {
        playerDirections: [Math.PI * 1 / 2, Math.PI * 3 / 2],
        lastSentX: Infinity,
        lastSentY: Infinity
      };
    },
    getTimer(snapshot) {
      return -1;
    },
    draw(snapshot, memory, ctx, screenWidth, screenHeight, imageLoader, playerIndex, applyToScreen) {
      if (playerIndex === 0) {
        ctx.fillStyle = "rgb(98, 25, 25)";
      } else {
        ctx.fillStyle = "rgb(25, 39, 98)";
      }
      ctx.fillRect(0, 0, screenWidth, screenHeight);
      ctx.save();
      applyToScreen();
      const imagesNames = ["playerRed", "playerBlue"];
      for (let i = 0; i < snapshot.players.length; i++) {
        const player = snapshot.players[i];
        const px = player.x;
        const py = player.y;
        const size = 100;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(memory.playerDirections[i]);
        ctx.drawImage(
          imageLoader.getImage(imagesNames[i]),
          -50,
          -50,
          size,
          size
        );
        ctx.restore();
      }
      ctx.restore();
    },
    clientFrame(snapshot, memory, playerIndex, client) {
      for (let i = 0; i < snapshot.players.length; i++) {
        if (i == playerIndex)
          continue;
        const vx = snapshot.players[i].vx;
        const vy = snapshot.players[i].vy;
        if (vx != 0 || vy != 0) {
          memory.playerDirections[i] = Math.atan2(vy, vx);
        }
      }
      let dir = client.getJoyStickDirection("move");
      if (!dir) {
        dir = { x: 0, y: 0 };
      }
      if (dir.x != memory.lastSentX || dir.y != memory.lastSentY) {
        memory.lastSentX = dir.x;
        memory.lastSentY = dir.y;
        if (dir.x != 0 || dir.y != 0) {
          memory.playerDirections[playerIndex] = Math.atan2(dir.y, dir.x);
        }
        const writer = new DataWriter();
        writer.writeFloat32(dir.x);
        writer.writeFloat32(dir.y);
        client.addInput(writer.toArrayBuffer());
      }
    },
    handleSubTouchEvent(snapshot, kind, event, screenWidth, screenHeight, canvasWidth, canvasHeight) {
    }
  };
  const CLIENT_DESCRIPTIONS = [
    packice_client,
    cowboy_client,
    test_client
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
  async function initConnection() {
    isLoading = true;
    updateUI();
    socket = new WebSocket(window.SOCKET_ADDRESS);
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
      maxPlayers = CLIENT_DESCRIPTIONS[globalGameId].game.playerCount;
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
      globalGameEngine = new ClientGameEngine(
        globalImageLoader,
        CLIENT_DESCRIPTIONS[globalGameId]
      );
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
    const diff = window.FORCED_LATENCY - (now - lastPackageSendTimestamp);
    const bufferToSend = globalGameEngine.handleNetwork(reader).toArrayBuffer();
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
      leaderboardEntries.push(`#${pos + 1} ${playerNames.join(", ")}`);
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
      for (let i = 0; i < CLIENT_DESCRIPTIONS.length; i++) {
        const gameDesc = CLIENT_DESCRIPTIONS[i];
        const gameItem = document.createElement("div");
        gameItem.className = "gameItem";
        const gameName = document.createElement("div");
        gameName.className = "gameItemName";
        gameName.textContent = gameDesc.name;
        const gamePlayers = document.createElement("div");
        gamePlayers.className = "gameItemPlayers";
        const pc = gameDesc.game.playerCount;
        gamePlayers.textContent = `${pc} joueur${pc > 1 ? "s" : ""}`;
        gameItem.appendChild(gameName);
        gameItem.appendChild(gamePlayers);
        gameItem.addEventListener("click", () => {
          gameMenu.classList.remove("show");
          resolve(i);
        });
        gameList.appendChild(gameItem);
      }
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
        endGamePlayerPosition.textContent = `Top #${playerPosition + 1}`;
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
  function formatTimer(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const tenths = Math.floor(seconds % 1 * 10);
    return `${minutes}:${secs.toString().padStart(2, "0")}.${tenths}`;
  }
  function updateTimerDisplay(gameEngine) {
    const timerElement = document.getElementById("timer");
    if (!timerElement) return;
    const timerValue = gameEngine.getTimer();
    if (timerValue < 0) {
      timerElement.style.display = "none";
    } else {
      timerElement.style.display = "block";
      timerElement.textContent = formatTimer(timerValue);
    }
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
    socket?.send(gameEngine.handleNetwork(null).toArrayBuffer());
    gameCanvas.style.display = "block";
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;
    const handleResize = () => {
      gameCanvas.width = window.innerWidth;
      gameCanvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    let lastFrameDate = Date.now();
    function gameLoop() {
      const now = Date.now();
      gameEngine.runFrame(now - lastFrameDate);
      lastFrameDate = now;
      const screenArea = Math.sqrt(
        window.innerWidth * window.innerWidth + window.innerHeight * window.innerHeight
      );
      ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
      gameEngine.draw(ctx);
      gameEngine.drawJoysticks(ctx, screenArea);
      updateTimerDisplay(gameEngine);
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
    const timerElement = document.getElementById("timer");
    if (timerElement) {
      timerElement.style.display = "none";
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
