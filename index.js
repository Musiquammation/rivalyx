(function() {
  "use strict";
  var _a, _b, _c;
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
    getLength() {
      return this.view.byteLength;
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
    CLIENT_IDS2[CLIENT_IDS2["SYNC"] = 6] = "SYNC";
    CLIENT_IDS2[CLIENT_IDS2["FINISH"] = 7] = "FINISH";
    return CLIENT_IDS2;
  })(CLIENT_IDS || {});
  var SERVER_IDS = /* @__PURE__ */ ((SERVER_IDS2) => {
    SERVER_IDS2[SERVER_IDS2["WELCOME"] = 0] = "WELCOME";
    SERVER_IDS2[SERVER_IDS2["CREATE_LOBBY"] = 1] = "CREATE_LOBBY";
    SERVER_IDS2[SERVER_IDS2["JOIN_LOBBY"] = 2] = "JOIN_LOBBY";
    SERVER_IDS2[SERVER_IDS2["SEEK_LOBBY"] = 3] = "SEEK_LOBBY";
    SERVER_IDS2[SERVER_IDS2["GAME_DATA"] = 4] = "GAME_DATA";
    SERVER_IDS2[SERVER_IDS2["SYNC"] = 5] = "SYNC";
    SERVER_IDS2[SERVER_IDS2["FINISH"] = 6] = "FINISH";
    return SERVER_IDS2;
  })(SERVER_IDS || {});
  var ButtonPlacement = /* @__PURE__ */ ((ButtonPlacement2) => {
    ButtonPlacement2[ButtonPlacement2["CENTERED"] = 0] = "CENTERED";
    ButtonPlacement2[ButtonPlacement2["SCREEN_RATIO"] = 1] = "SCREEN_RATIO";
    ButtonPlacement2[ButtonPlacement2["GAME_RATIO"] = 2] = "GAME_RATIO";
    return ButtonPlacement2;
  })(ButtonPlacement || {});
  const BUTTON_COLORS = {
    blue: { idle: [35, 65, 165], pressed: [65, 99, 208] },
    red: { idle: [148, 45, 45], pressed: [208, 65, 65] },
    yellow: { idle: [165, 165, 35], pressed: [208, 208, 65] }
  };
  const _Button = class _Button {
    constructor(x, y, xpl, ypl, color, label, widthRatio, heightRatio, keys = []) {
      this.activeTouchId = null;
      this.pressedKeys = [];
      this.x = x;
      this.y = y;
      this.xpl = xpl;
      this.ypl = ypl;
      this.widthRatio = widthRatio;
      this.heightRatio = heightRatio;
      this.label = label;
      this.color = color;
      this.width = 0;
      this.height = 0;
      this.keys = keys;
    }
    updateRatio(screenArea) {
      this.width = screenArea * this.widthRatio * _Button.FACTOR;
      this.height = screenArea * this.heightRatio * _Button.FACTOR;
    }
  };
  _Button.FACTOR = 0.05;
  let Button = _Button;
  const TIME_PRECISION = 10;
  function getTimestamp() {
    return Math.floor(performance.now() * TIME_PRECISION) >>> 0;
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
    constructor(x, y, xpl, ypl, color, label, radiusRatio = 1, keys = []) {
      this.radius = 32;
      this.pressedKeys = [];
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
      this.keys = keys;
    }
    updateRatio(screenArea) {
      this.radius = screenArea * this.radiusRatio * _Joystick.FACTOR;
    }
    getStick() {
      if (this.pressedKeys.length === 0) {
        return { x: this.stickX, y: this.stickY };
      }
      let x = 0;
      let y = 0;
      let r = 0;
      let n = 0;
      for (const p of this.pressedKeys) {
        for (const k of this.keys) {
          if (k.key === p) {
            let dx = Math.cos(k.a);
            let dy = Math.sin(k.a);
            if (Math.abs(dx - -1) < 1e-4) dx = -1;
            else if (Math.abs(dx) < 1e-4) dx = 0;
            else if (Math.abs(dx - 1) < 1e-4) dx = 1;
            if (Math.abs(dy - -1) < 1e-4) dy = -1;
            else if (Math.abs(dy) < 1e-4) dy = 0;
            else if (Math.abs(dy - 1) < 1e-4) dy = 1;
            r += k.r;
            x += k.r * dx;
            y += k.r * dy;
            n++;
          }
        }
      }
      if (n === 0) {
        return { x: this.stickX, y: this.stickY };
      }
      if (x === 0 && y === 0) {
        return { x: 0, y: 0 };
      }
      n = 1 / n;
      x *= n;
      y *= n;
      r *= n;
      const factor = r / Math.sqrt(x * x + y * y);
      x *= factor;
      y *= factor;
      return { x, y };
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
      duration /= TIME_PRECISION;
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
        this.runFrame(date - startDate);
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
          let notFound = true;
          for (const button of this.buttons) {
            if (button.activeTouchId !== null)
              continue;
            const pos = this.getButtonPosition(button, screenWidth, screenHeight, canvasWidth, canvasHeight);
            const halfWidth = button.width / 2;
            const halfHeight = button.height / 2;
            if (clientX >= pos.x - halfWidth && clientX <= pos.x + halfWidth && clientY >= pos.y - halfHeight && clientY <= pos.y + halfHeight) {
              button.activeTouchId = touchId;
              notFound = false;
              break;
            }
          }
          if (notFound) {
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
          }
        } else if (kind === "touchmove") {
          for (const joystick of this.joysticks) {
            if (joystick.activeTouchId === touchId && joystick.originX !== void 0 && joystick.originY !== void 0) {
              this.updateJoystickPosition(joystick, clientX, clientY);
              break;
            }
          }
        } else if (kind === "touchend" || kind === "touchcancel") {
          let found = false;
          for (const button of this.buttons) {
            if (button.activeTouchId === touchId) {
              button.activeTouchId = null;
              found = true;
              break;
            }
          }
          if (!found) {
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
    }
    handleKeypress(code) {
      for (const button of this.buttons) {
        if (button.keys.indexOf(code) < 0)
          continue;
        if (button.pressedKeys.indexOf(code) >= 0)
          continue;
        button.pressedKeys.push(code);
      }
      for (const joystick of this.joysticks) {
        for (const key of joystick.keys) {
          if (key.key !== code)
            continue;
          if (joystick.pressedKeys.indexOf(code) >= 0)
            continue;
          joystick.pressedKeys.push(code);
        }
      }
    }
    handleKeyup(code) {
      for (const button of this.buttons) {
        if (button.keys.indexOf(code) < 0)
          continue;
        if (button.pressedKeys.indexOf(code) < 0)
          continue;
        button.pressedKeys = button.pressedKeys.filter((x) => x !== code);
      }
      for (const joystick of this.joysticks) {
        for (const key of joystick.keys) {
          if (key.key !== code)
            continue;
          if (joystick.pressedKeys.indexOf(code) < 0)
            continue;
          joystick.pressedKeys = joystick.pressedKeys.filter((x) => x !== code);
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
      return joystick.getStick();
    }
    getButton(label) {
      const button = Array.from(this.buttons).find((j) => j.label === label);
      if (!button) return false;
      return button.pressedKeys.length || button.activeTouchId !== null;
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
    getButtonPosition(button, screenWidth, screenHeight, canvasWidth, canvasHeight) {
      let x;
      let y;
      switch (button.xpl) {
        case ButtonPlacement.CENTERED:
          x = screenWidth / 2 + button.x;
          break;
        case ButtonPlacement.SCREEN_RATIO:
          x = screenWidth * button.x;
          break;
        case ButtonPlacement.GAME_RATIO:
          x = canvasWidth * button.x;
          break;
        default:
          x = button.x;
      }
      switch (button.ypl) {
        case ButtonPlacement.CENTERED:
          y = screenHeight / 2 + button.y;
          break;
        case ButtonPlacement.SCREEN_RATIO:
          y = screenHeight * button.y;
          break;
        case ButtonPlacement.GAME_RATIO:
          y = canvasHeight * button.y;
          break;
        default:
          y = button.y;
      }
      return { x, y };
    }
    handleGamepad(gamepad) {
      for (const button of this.buttons) {
        for (const key of button.keys) {
          const match = key.match(/^Controller(\d+)$/);
          if (!match) continue;
          const buttonIndex = parseInt(match[1]);
          if (buttonIndex >= gamepad.buttons.length) continue;
          const pressed = gamepad.buttons[buttonIndex].pressed;
          const alreadyPressed = button.pressedKeys.indexOf(key) >= 0;
          if (pressed && !alreadyPressed) {
            button.pressedKeys.push(key);
          } else if (!pressed && alreadyPressed) {
            button.pressedKeys = button.pressedKeys.filter((x) => x !== key);
          }
        }
      }
      let i = 0;
      for (const joystick of this.joysticks) {
        const axisX = 2 * i;
        const axisY = 2 * i + 1;
        i++;
        if (axisX >= gamepad.axes.length || axisY >= gamepad.axes.length) continue;
        const hasKeyboardInput = joystick.pressedKeys.length > 0;
        const hasTouchInput = joystick.activeTouchId !== void 0;
        if (hasKeyboardInput || hasTouchInput) continue;
        const x = gamepad.axes[axisX];
        const y = gamepad.axes[axisY];
        const deadzone = 0.1;
        joystick.stickX = Math.abs(x) > deadzone ? x : 0;
        joystick.stickY = Math.abs(y) > deadzone ? y : 0;
      }
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
        const stick = joystick.getStick();
        ctx.fillStyle = `rgba(${joystick.color.base[0]}, ${joystick.color.base[1]}, ${joystick.color.base[2]}, 0.5)`;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fill();
        const stickRadius = radius * 0.4;
        ctx.fillStyle = `rgba(${joystick.color.stick[0]}, ${joystick.color.stick[1]}, ${joystick.color.stick[2]}, 0.8)`;
        ctx.beginPath();
        ctx.arc(
          pos.x + stick.x * radius * 0.6,
          pos.y + stick.y * radius * 0.6,
          stickRadius,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
    drawButtons(ctx, screenArea) {
      if (!this.canvas) return;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const canvasWidth = this.canvas.width;
      const canvasHeight = this.canvas.height;
      for (const button of this.buttons) {
        button.updateRatio(screenArea);
        const pos = this.getButtonPosition(button, screenWidth, screenHeight, canvasWidth, canvasHeight);
        const width = button.width;
        const height = button.height;
        const color = button.activeTouchId === null && button.pressedKeys.length === 0 ? button.color.idle : button.color.pressed;
        ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.5)`;
        ctx.fillRect(pos.x - width / 2, pos.y - height / 2, width, height);
        ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, 1.0)`;
        ctx.lineWidth = 3;
        ctx.strokeRect(pos.x - width / 2, pos.y - height / 2, width, height);
      }
    }
  }
  const _ImageLoader = class _ImageLoader {
    constructor() {
      this.images = /* @__PURE__ */ new Map();
    }
    static createMissingTexture() {
      const canvas = document.createElement("canvas");
      canvas.width = 2;
      canvas.height = 2;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      const half = 1;
      const pink = "#ff00ff";
      const black = "#000000";
      ctx.fillStyle = pink;
      ctx.fillRect(0, 0, half, half);
      ctx.fillRect(half, half, half, half);
      ctx.fillStyle = black;
      ctx.fillRect(half, 0, half, half);
      ctx.fillRect(0, half, half, half);
      return canvas;
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
      return _ImageLoader.MISSING_TEXTURE;
    }
  };
  _ImageLoader.MISSING_TEXTURE = _ImageLoader.createMissingTexture();
  let ImageLoader = _ImageLoader;
  const _Block = class _Block {
    constructor(x, y, mods2) {
      this.x = x;
      this.y = y;
      this.mods = mods2;
      this.containsFrameToRun = false;
      for (let m of mods2) {
        if (m.hasFrameToRun()) {
          this.containsFrameToRun = true;
          break;
        }
      }
    }
    getSize() {
      for (let m of this.mods) {
        const s = m.getSize();
        if (s) {
          return s;
        }
      }
      return null;
    }
    getCollision() {
      for (let m of this.mods) {
        const s = m.getCollision();
        if (s) {
          return s;
        }
      }
      return _Block.DEFAULT_COLLISION;
    }
    getStarSpawn() {
      let s = 0;
      for (let m of this.mods) {
        s = Math.max(s, m.getStarSpawn());
      }
      return s;
    }
    getHit() {
      for (let m of this.mods)
        if (m.getHit())
          return true;
      return false;
    }
    runFrame(map, speed) {
      if (!this.containsFrameToRun)
        return;
      for (let m of this.mods)
        m.runFrame(map, this, speed);
    }
    onTouch(player) {
    }
  };
  _Block.DEFAULT_COLLISION = {
    right: true,
    up: true,
    left: true,
    down: true
  };
  let Block = _Block;
  var collision;
  ((collision2) => {
    function rect_rect(x1, y1, w1, h1, x2, y2, w2, h2) {
      return !(x1 + w1 <= x2 || x1 >= x2 + w2 || y1 + h1 <= y2 || y1 >= y2 + h2);
    }
    collision2.rect_rect = rect_rect;
    function rect_centeredRect(rx, ry, rw, rh, cx, cy, cw, ch) {
      const halfW = cw * 0.5;
      const halfH = ch * 0.5;
      const x2 = cx - halfW;
      const y2 = cy - halfH;
      return rect_rect(
        rx,
        ry,
        rw,
        rh,
        x2,
        y2,
        cw,
        ch
      );
    }
    collision2.rect_centeredRect = rect_centeredRect;
    function centeredRect_centeredRect(cx1, cy1, cw1, ch1, cx2, cy2, cw2, ch2) {
      const halfW1 = cw1 * 0.5;
      const halfH1 = ch1 * 0.5;
      const halfW2 = cw2 * 0.5;
      const halfH2 = ch2 * 0.5;
      return rect_rect(
        cx1 - halfW1,
        cy1 - halfH1,
        cw1,
        ch1,
        cx2 - halfW2,
        cy2 - halfH2,
        cw2,
        ch2
      );
    }
    collision2.centeredRect_centeredRect = centeredRect_centeredRect;
  })(collision || (collision = {}));
  const _Mod = class _Mod {
    getSize() {
      return null;
    }
    getCollision() {
      return null;
    }
    getStarSpawn() {
      return 0;
    }
    getHit() {
      return false;
    }
    getKill() {
      return false;
    }
    hasFrameToRun() {
      return false;
    }
    runFrame(map, block, speed) {
    }
  };
  _Mod.NO_COLL = {
    right: false,
    up: false,
    left: false,
    down: false
  };
  let Mod = _Mod;
  var EntityBehavior = /* @__PURE__ */ ((EntityBehavior2) => {
    EntityBehavior2[EntityBehavior2["NONE"] = 0] = "NONE";
    EntityBehavior2[EntityBehavior2["JUMP_FLOOR"] = 1] = "JUMP_FLOOR";
    EntityBehavior2[EntityBehavior2["JUMP_CEILING"] = 2] = "JUMP_CEILING";
    EntityBehavior2[EntityBehavior2["JUMP_LEFT"] = 3] = "JUMP_LEFT";
    EntityBehavior2[EntityBehavior2["JUMP_RIGHT"] = 4] = "JUMP_RIGHT";
    EntityBehavior2[EntityBehavior2["IDLE_FLOOR"] = 5] = "IDLE_FLOOR";
    EntityBehavior2[EntityBehavior2["IDLE_CEILING"] = 6] = "IDLE_CEILING";
    EntityBehavior2[EntityBehavior2["IDLE_LEFT"] = 7] = "IDLE_LEFT";
    EntityBehavior2[EntityBehavior2["IDLE_RIGHT"] = 8] = "IDLE_RIGHT";
    EntityBehavior2[EntityBehavior2["WALK_FLOOR"] = 9] = "WALK_FLOOR";
    EntityBehavior2[EntityBehavior2["WALK_CEILING"] = 10] = "WALK_CEILING";
    EntityBehavior2[EntityBehavior2["CLIMB_LEFT"] = 11] = "CLIMB_LEFT";
    EntityBehavior2[EntityBehavior2["CLIMB_RIGHT"] = 12] = "CLIMB_RIGHT";
    return EntityBehavior2;
  })(EntityBehavior || {});
  class Entity {
    constructor(x, y, vx, vy) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
    }
    resetJumps() {
    }
    onPlatform(behavior, prev_vx, prev_vy, block) {
    }
    applyCollisions(map, speed) {
      const es = this.getSize();
      const lp = { x: this.x, y: this.y };
      const prev_vx = this.vx;
      const prev_vy = this.vy;
      const np = {
        x: this.x + this.vx * speed,
        y: this.y + this.vy * speed
      };
      for (const block of map.blocks) {
        const size = block.getSize();
        if (!size)
          continue;
        const coll = collision.rect_centeredRect(
          block.x,
          block.y,
          size.w,
          size.h,
          np.x,
          np.y,
          es.w,
          es.h
        );
        if (coll) {
          block.onTouch(this);
        }
      }
      for (const block of map.blocks) {
        const size = block.getSize();
        if (!size)
          continue;
        const collObj = block.getCollision();
        if (!collObj.right && !collObj.up && !collObj.left && !collObj.down) {
          continue;
        }
        if (!collision.rect_centeredRect(
          block.x,
          block.y,
          size.w,
          size.h,
          np.x,
          np.y,
          es.w,
          es.h
        )) {
          continue;
        }
        let behavior = 0;
        if (collObj.up && lp.y <= block.y - es.h / 2) {
          np.y = block.y - es.h / 2;
          this.vy = 0;
          this.resetJumps();
          behavior = 5;
        }
        if (collObj.down && lp.y >= block.y + size.h + es.h / 2) {
          np.y = block.y + size.h + es.h / 2;
          this.vy = 0;
          behavior = 6;
        }
        if (collObj.right && lp.x <= block.x - es.w / 2) {
          np.x = block.x - es.w / 2;
          if (this.vy > 0 && this.vx > 0) {
            this.vy = 0;
            this.resetJumps();
            behavior = 11;
          } else {
            behavior = 7;
          }
          this.vx = 0;
        }
        if (collObj.left && lp.x >= block.x + size.w + es.w / 2) {
          np.x = block.x + size.w + es.w / 2;
          if (this.vy > 0 && this.vx < 0) {
            this.vy = 0;
            this.resetJumps();
            behavior = 12;
          } else {
            behavior = 8;
          }
          this.vx = 0;
        }
        this.onPlatform(behavior, prev_vx, prev_vy, block);
        if (!collision.rect_centeredRect(
          block.x,
          block.y,
          size.w,
          size.h,
          np.x,
          np.y,
          es.w,
          es.h
        )) {
          continue;
        }
        console.warn("TODO: entity inside a block");
      }
      this.x = np.x;
      this.y = np.y;
    }
    isOutsideBox(box) {
      const size = this.getSize();
      return this.x + size.w / 2 < box.left || this.x - size.w / 2 > box.right || this.y + size.h / 2 < box.top || this.y - size.h / 2 > box.bottom;
    }
  }
  var flags;
  ((flags2) => {
    flags2.DIVE = 1;
    flags2.LOOK_LEFT = 2;
    flags2.JUMP = 4;
    flags2.WAS_JUMPING = 8;
    flags2.STAR_ADD = 16;
    flags2.STAR_REM = 32;
    flags2.POWER = 64;
    flags2.WAS_POWER = 128;
  })(flags || (flags = {}));
  const _Star = class _Star extends Entity {
    constructor(x, y, vx, vy, deadtime) {
      super(x, y, vx, vy);
      this.deadtime = deadtime;
    }
    getSize() {
      return { w: _Star.WIDTH, h: _Star.HEIGHT };
    }
    onPlatform(behavior, prev_vx, prev_vy, block) {
      switch (behavior) {
        case EntityBehavior.IDLE_FLOOR: {
          const r = _Star.RAND_JUMP_MIN + Math.random() * (_Star.RAND_JUMP_MAX - _Star.RAND_JUMP_MIN);
          this.vy = -_Star.JUMP * r;
          break;
        }
        case EntityBehavior.IDLE_LEFT:
        case EntityBehavior.IDLE_RIGHT:
        case EntityBehavior.CLIMB_LEFT:
        case EntityBehavior.CLIMB_RIGHT:
          this.vx = -prev_vx;
          break;
      }
    }
  };
  _Star.JUMP = 0.7;
  _Star.SPEED = 0.2;
  _Star.GRAVITY = 1 / 1e3;
  _Star.WIDTH = 64;
  _Star.HEIGHT = 64;
  _Star.RAND_JUMP_MIN = 0.7;
  _Star.RAND_JUMP_MAX = 1.3;
  _Star.DEADTIME = 1e3;
  let Star = _Star;
  let Player$2 = (_a = class extends Entity {
    constructor(x, y) {
      super(x, y, 0, 0);
      this.dirX = 0;
      this.flags = 0;
      this.sessionAlive = true;
      this.respawnCouldown = -1;
      this.jumps = _a.JUMPS;
      this.stars = 0;
      this.mustReleaseStar = null;
      this.immuneCouldown = _a.IMMUNE_COULDOWN;
      this.powerup = new powerups.Default();
      this.projectiles = [];
      this.freezeCouldown = 0;
    }
    runCouldowns(speed) {
      if (this.freezeCouldown > 0) {
        this.freezeCouldown -= speed;
        return false;
      }
      if (this.respawnCouldown > 0) {
        this.respawnCouldown -= speed;
        if (this.respawnCouldown > 0)
          return true;
      }
      this.immuneCouldown -= speed;
      return false;
    }
    frame(speed) {
      if (this.dirX > 0) {
        const maxSpeed = _a.MAX_SPEED * this.dirX;
        let vx = this.vx;
        if (vx > maxSpeed) {
          vx -= _a.SLOW_DOWN * speed;
          if (vx < maxSpeed) {
            vx = maxSpeed;
          }
        } else {
          if (vx < 0) {
            vx += _a.ACC_REVERSE * speed;
          } else {
            vx += _a.ACCELERATION * speed;
          }
          if (vx > maxSpeed) {
            vx = maxSpeed;
          }
        }
        this.vx = vx;
      } else if (this.dirX < 0) {
        const maxSpeed = _a.MAX_SPEED * this.dirX;
        let vx = this.vx;
        if (vx < maxSpeed) {
          vx -= _a.SLOW_DOWN * speed;
          if (vx < maxSpeed) {
            vx = maxSpeed;
          }
        } else {
          if (vx > 0) {
            vx -= _a.ACC_REVERSE * speed;
          } else {
            vx -= _a.ACCELERATION * speed;
          }
          if (vx < maxSpeed) {
            vx = maxSpeed;
          }
        }
        this.vx = vx;
      } else {
        if (this.vx > 0) {
          this.vx -= _a.DECELERATION * speed;
          if (this.vx < 0) {
            this.vx = 0;
          }
        } else if (this.vx < 0) {
          this.vx += _a.DECELERATION * speed;
          if (this.vx > 0) {
            this.vx = 0;
          }
        }
      }
      if ((this.flags & flags.JUMP) === 0) {
        this.flags &= ~flags.WAS_JUMPING;
      } else if ((this.flags & flags.WAS_JUMPING) === 0) {
        this.flags |= flags.WAS_JUMPING;
        if (this.jumps > 0) {
          this.vy = -_a.JUMP;
          this.jumps--;
        }
      }
      if ((this.flags & flags.POWER) === 0) {
        this.flags &= ~flags.WAS_POWER;
        powerups.stop(this.powerup, this);
      } else if ((this.flags & flags.WAS_POWER) === 0) {
        this.flags |= flags.WAS_POWER;
        powerups.start(this.powerup, this);
      } else {
        powerups.use(this.powerup, this);
      }
    }
    releaseStar(map, x, y) {
      if (this.stars <= 0)
        return;
      this.stars--;
      map.stars.push(new Star(
        this.x,
        this.y,
        this.flags & flags.LOOK_LEFT ? -Star.SPEED : Star.SPEED,
        -Star.JUMP,
        Star.DEADTIME
      ));
    }
    hit() {
      if (this.freezeCouldown > 0)
        return;
      if (this.immuneCouldown <= 0) {
        this.immuneCouldown = _a.IMMUNE_COULDOWN;
        this.mustReleaseStar = { x: this.x, y: this.y };
      }
    }
    kill() {
      this.mustReleaseStar = { x: this.x, y: this.y - _a.HEIGHT };
      this.immuneCouldown = _a.IMMUNE_COULDOWN;
      this.respawnCouldown = _a.RESPAWN_COULDOWN;
      this.freezeCouldown = 0;
      this.x = 0;
      this.y = 0;
    }
    resetJumps() {
      this.jumps = _a.JUMPS;
    }
    onPlatform(behavior, prev_vx, prev_vy, block) {
      if (block.getHit()) {
        this.hit();
      }
    }
    getSize() {
      return { w: _a.WIDTH, h: _a.HEIGHT };
    }
    onIce(dir) {
      if (this.freezeCouldown <= 0)
        this.freezeCouldown = _a.FREEZE_TIME;
    }
    onFire() {
      if (this.freezeCouldown > 0) {
        this.freezeCouldown = 0;
        return;
      }
      this.hit();
    }
  }, _a.WIDTH = 32, _a.HEIGHT = 32, _a.JUMPS = 2, _a.JUMP = 1.2, _a.DOMINATION_BOUNCE = 0.7, _a.DOMINATION_FORCE = 0.6, _a.GRAVITY = 2.4 / 1e3, _a.MAX_SPEED = 1.5, _a.ACCELERATION = 6, _a.DECELERATION = 7, _a.ACC_REVERSE = 13, _a.SLOW_DOWN = 1.5, _a.DASH = 3, _a.RESPAWN_COULDOWN = 3 * 1e3, _a.IMMUNE_COULDOWN = 1 * 1e3, _a.FREEZE_TIME = 1.5 * 1e3, _a);
  function checkPlayerCollisions(entity, players) {
    const size = entity.getSize();
    let touched = null;
    for (const player of players) {
      if (player.respawnCouldown > 0)
        continue;
      if (!collision.centeredRect_centeredRect(
        entity.x,
        entity.y,
        size.w,
        size.h,
        player.x,
        player.y,
        Player$2.WIDTH,
        Player$2.HEIGHT
      )) {
        continue;
      }
      if (touched !== null) {
        return null;
      }
      touched = player;
    }
    return touched;
  }
  var ProjectileType = /* @__PURE__ */ ((ProjectileType2) => {
    ProjectileType2[ProjectileType2["ICE"] = 0] = "ICE";
    ProjectileType2[ProjectileType2["FIRE"] = 1] = "FIRE";
    return ProjectileType2;
  })(ProjectileType || {});
  const BOUCES = [
    4,
    // ice
    2
    // fire
  ];
  const _Projectile = class _Projectile extends Entity {
    constructor(x, y, vx, vy, type, bounces = BOUCES[type]) {
      super(x, y, vx, vy);
      this.type = type;
      this.bounces = bounces;
    }
    getSize() {
      return { w: _Projectile.RADIUS, h: _Projectile.RADIUS };
    }
    applyOnPlayer(player) {
      switch (this.type) {
        case 0:
          player.onIce(this.vx);
          break;
        case 1:
          player.onFire();
          break;
      }
    }
    onPlatform(behavior, prev_vx, prev_vy) {
      switch (behavior) {
        case EntityBehavior.IDLE_FLOOR: {
          this.vy = -_Projectile.JUMP;
          this.bounces--;
          break;
        }
        case EntityBehavior.IDLE_LEFT:
        case EntityBehavior.IDLE_RIGHT:
        case EntityBehavior.CLIMB_LEFT:
        case EntityBehavior.CLIMB_RIGHT:
          this.vx = -prev_vx;
          break;
      }
    }
  };
  _Projectile.RADIUS = 16;
  _Projectile.JUMP = 0.3;
  _Projectile.GRAVITY = 1.2 / 1e3;
  let Projectile = _Projectile;
  const POWER_STATS = [
    { vx: 1, vy: 0, jmp: false },
    // default
    { vx: 0, vy: 0, jmp: false },
    // fire
    { vx: 0, vy: 0, jmp: false },
    // ice
    { vx: 0.1, vy: -0.5, jmp: true },
    // shell
    { vx: 0.1, vy: -0.5, jmp: true }
    // jumper
  ];
  function createPowerUp(x, y, type) {
    return new PowerUpEntity(x, y, POWER_STATS[type].vx, POWER_STATS[type].vy, type);
  }
  const _PowerUpEntity = class _PowerUpEntity extends Entity {
    constructor(x, y, vx, vy, type) {
      super(x, y, vx, vy);
      this.type = type;
    }
    getSize() {
      return { w: _PowerUpEntity.WIDTH, h: _PowerUpEntity.HEIGHT };
    }
    onPlatform(behavior, prev_vx, prev_vy, block) {
      switch (behavior) {
        case EntityBehavior.IDLE_FLOOR:
          if (POWER_STATS[this.type].jmp)
            this.vy = -prev_vy;
          break;
        case EntityBehavior.IDLE_LEFT:
        case EntityBehavior.IDLE_RIGHT:
        case EntityBehavior.CLIMB_LEFT:
        case EntityBehavior.CLIMB_RIGHT:
          this.vx = -prev_vx;
          break;
      }
    }
  };
  _PowerUpEntity.WIDTH = 32;
  _PowerUpEntity.HEIGHT = 32;
  _PowerUpEntity.TYPES_COUNT = 3;
  let PowerUpEntity = _PowerUpEntity;
  var powerups;
  ((powerups2) => {
    class Default {
    }
    powerups2.Default = Default;
    const _Fire = class _Fire {
    };
    _Fire.LIMIT = 2;
    _Fire.SPEED = 0.4;
    let Fire = _Fire;
    powerups2.Fire = Fire;
    const _Ice = class _Ice {
    };
    _Ice.LIMIT = 4;
    _Ice.SPEED = 0.3;
    let Ice = _Ice;
    powerups2.Ice = Ice;
    class Shell {
    }
    powerups2.Shell = Shell;
    class Jumper {
    }
    powerups2.Jumper = Jumper;
    function send(writer, powerup) {
      if (powerup instanceof Default) {
        return;
      }
    }
    powerups2.send = send;
    function recv(reader, powerup) {
    }
    powerups2.recv = recv;
    function produce(type) {
      switch (type) {
        case 0:
          return new powerups2.Default();
        case 1:
          return new powerups2.Fire();
        case 2:
          return new powerups2.Ice();
        case 3:
          return new powerups2.Shell();
        case 4:
          return new powerups2.Jumper();
      }
    }
    powerups2.produce = produce;
    function getType(powerup) {
      if (powerup instanceof Default)
        return 0;
      if (powerup instanceof Fire)
        return 1;
      if (powerup instanceof Ice)
        return 2;
      if (powerup instanceof Shell)
        return 3;
      if (powerup instanceof Jumper)
        return 4;
      return 0;
    }
    powerups2.getType = getType;
    function start(power, player) {
      if (power instanceof Default) {
        return;
      }
      if (power instanceof Fire) {
        if (player.projectiles.length < Fire.LIMIT) {
          const dir = player.flags & flags.LOOK_LEFT ? -1 : 1;
          player.projectiles.push(new Projectile(
            player.x + dir * Player$2.WIDTH / 2,
            player.y,
            dir * Fire.SPEED,
            -Projectile.JUMP,
            ProjectileType.FIRE
          ));
        }
        return;
      }
      if (power instanceof Ice) {
        if (player.projectiles.length < Ice.LIMIT) {
          const dir = player.flags & flags.LOOK_LEFT ? -1 : 1;
          player.projectiles.push(new Projectile(
            player.x + dir * Player$2.WIDTH / 2,
            player.y,
            dir * Ice.SPEED,
            -Projectile.JUMP,
            ProjectileType.ICE
          ));
        }
        return;
      }
      if (power instanceof Shell) {
        return;
      }
      if (power instanceof Jumper) {
        return;
      }
    }
    powerups2.start = start;
    function use(power, player) {
      if (power instanceof Default) {
        return;
      }
      if (power instanceof Fire) {
        return;
      }
      if (power instanceof Ice) {
        return;
      }
      if (power instanceof Shell) {
        return;
      }
      if (power instanceof Jumper) {
        return;
      }
    }
    powerups2.use = use;
    function stop(power, player) {
      if (power instanceof Default) {
        return;
      }
      if (power instanceof Fire) {
        return;
      }
      if (power instanceof Ice) {
        return;
      }
      if (power instanceof Shell) {
        return;
      }
      if (power instanceof Jumper) {
        return;
      }
    }
    powerups2.stop = stop;
    function projectile(power, player) {
    }
    powerups2.projectile = projectile;
  })(powerups || (powerups = {}));
  var mods;
  ((mods2) => {
    class Size extends Mod {
      constructor(w, h) {
        super();
        this.w = w;
        this.h = h;
      }
      getSize() {
        return { w: this.w, h: this.h };
      }
    }
    mods2.Size = Size;
    class StarSpawner extends Mod {
      constructor(spawn) {
        super();
        this.spawn = spawn;
      }
      getStarSpawn() {
        return this.spawn;
      }
      getCollision() {
        return Mod.NO_COLL;
      }
    }
    mods2.StarSpawner = StarSpawner;
    class Hit extends Mod {
      getHit() {
        return true;
      }
    }
    mods2.Hit = Hit;
    class PowerupSpawner extends Mod {
      constructor(frequency) {
        super();
        this.couldown = 0;
        this.frequency = frequency;
      }
      hasFrameToRun() {
        return true;
      }
      runFrame(map, block, speed) {
        if (!map.isServer)
          return;
        this.couldown -= speed;
        if (this.couldown > 0)
          return;
        this.couldown += this.frequency;
        const type = Math.floor(Math.random() * PowerUpEntity.TYPES_COUNT);
        map.powerups.push(createPowerUp(block.x, block.y, type));
      }
    }
    mods2.PowerupSpawner = PowerupSpawner;
  })(mods || (mods = {}));
  const STAR_COULDOWN = 5 * 1e3;
  class GameMap {
    constructor(players, isServer) {
      this.blocks = [];
      this.stars = [];
      this.powerups = [];
      this.gameBox = {
        left: -16e3,
        top: -9e3,
        right: 16e3,
        bottom: 900
      };
      this.starCouldown = STAR_COULDOWN;
      this.players = players;
      this.isServer = isServer;
    }
    runTest() {
      this.blocks.push(new Block(-400, 200, [
        new mods.Size(800, 100)
      ]));
      this.blocks.push(new Block(400, -200, [
        new mods.Size(100, 500)
      ]));
      this.blocks.push(new Block(0, 0, [
        new mods.StarSpawner(1)
      ]));
      this.blocks.push(new Block(-400, -200, [
        new mods.Hit(),
        new mods.Size(100, 100)
      ]));
      this.blocks.push(new Block(-400, -300, [
        new mods.PowerupSpawner(1e3)
      ]));
    }
    spawnStars(speed) {
      this.starCouldown -= speed;
      if (this.starCouldown < 0) {
        this.starCouldown += STAR_COULDOWN;
        const starSpawners = new Array();
        let s = 0;
        for (const block of this.blocks) {
          const luck = block.getStarSpawn();
          if (luck > 0) {
            s += luck;
            starSpawners.push({ x: block.x, y: block.y, luck });
          }
        }
        const rand = Math.floor(Math.random() * s);
        s = 0;
        for (const spawner of starSpawners) {
          s += spawner.luck;
          if (rand < s) {
            this.stars.push(new Star(
              spawner.x,
              spawner.y,
              Star.SPEED,
              -Star.JUMP,
              Star.DEADTIME
            ));
            break;
          }
        }
      }
    }
    collectPlayerDominations() {
      const dominations = [];
      for (const player of this.players) {
        if (player.vy < Player$2.DOMINATION_FORCE)
          continue;
        const list = new Array();
        for (const victim of this.players) {
          if (victim === player || victim.respawnCouldown > 0)
            continue;
          if (player.y + Player$2.HEIGHT / 2 < victim.y - Player$2.HEIGHT / 2) {
            list.push(victim);
          }
        }
        if (list) {
          dominations.push({ player, list });
        }
      }
      return dominations;
    }
    applyDominations(dominations) {
      for (const d of dominations) {
        const player = d.player;
        let jump = false;
        for (const victim of d.list) {
          if (collision.rect_centeredRect(
            player.x,
            player.y,
            Player$2.WIDTH,
            Player$2.HEIGHT,
            victim.x,
            victim.y,
            Player$2.WIDTH,
            Player$2.HEIGHT
          )) {
            jump = true;
            victim.hit();
          }
        }
        if (jump) {
          player.vy *= -Player$2.DOMINATION_BOUNCE;
        }
      }
    }
  }
  let ServData$1 = class ServData {
    constructor() {
      this.leaderboard = null;
      this.sessionDeadPlayers = 0;
    }
  };
  let Snapshot$6 = (_b = class {
    constructor(isServer) {
      this.starsToWin = 7;
      this.frame = 0;
      this.servData = isServer ? new ServData$1() : null;
      const players = [];
      for (let i = 0; i < _b.PLAYER_COUNT; i++) {
        players.push(new Player$2(0, 0));
      }
      this.map = new GameMap(players, isServer);
      this.map.runTest();
    }
    produceLeaderboard() {
      if (!this.servData)
        return;
      const playerIndices = this.map.players.map((_, i) => i);
      playerIndices.sort((a, b) => this.map.players[b].stars - this.map.players[a].stars);
      this.servData.leaderboard = playerIndices;
    }
    getLeaderboard() {
      if (!this.servData)
        return null;
      return this.servData.leaderboard;
    }
    killPlayer(idx) {
      if (this.servData && this.map.players[idx].sessionAlive) {
        this.map.players[idx].sessionAlive = false;
        this.map.players[idx].stars = -++this.servData.sessionDeadPlayers;
      }
    }
  }, _b.PLAYER_COUNT = 2, _b);
  const gcowboy = {
    Snapshot: Snapshot$6
  };
  const Snapshot$5 = gcowboy.Snapshot;
  const gstars_game = {
    playerCount: Snapshot$5.PLAYER_COUNT,
    createSnapshot(isServer) {
      const snapshot = new Snapshot$5(isServer);
      return snapshot;
    },
    extractInput(reader) {
      const writer = new DataWriter();
      const dx = reader.readFloat32();
      const flags2 = reader.readUint8();
      writer.writeFloat32(dx);
      writer.writeUint8(flags2);
      return writer.toArrayBuffer();
    },
    handleInput(snapshot, data, user) {
      const player = snapshot.map.players[user];
      player.dirX = data.readFloat32();
      player.flags = data.readUint8();
    },
    frame(snapshot, speed) {
      const map = snapshot.map;
      const playerDominations = map.collectPlayerDominations();
      for (const block of map.blocks) {
        block.runFrame(map, speed);
      }
      for (const player of map.players) {
        for (const p of player.projectiles) {
          p.vy += Projectile.GRAVITY * speed;
          p.applyCollisions(map, speed);
        }
        if (player.runCouldowns(speed))
          continue;
        player.vy += Player$2.GRAVITY * speed;
        player.applyCollisions(map, speed);
        if (player.freezeCouldown > 0)
          continue;
        player.frame(speed);
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
      for (let powerup of map.powerups) {
        powerup.vy += Star.GRAVITY * speed;
        powerup.applyCollisions(map, speed);
      }
      for (let star of map.stars) {
        star.vy += Star.GRAVITY * speed;
        star.applyCollisions(map, speed);
        star.deadtime -= speed;
      }
      map.applyDominations(playerDominations);
      if (map.isServer)
        map.spawnStars(speed);
      for (let i = map.stars.length - 1; i >= 0; i--) {
        const star = map.stars[i];
        if (star.isOutsideBox(map.gameBox)) {
          map.stars.splice(i, 1);
          continue;
        }
        if (star.deadtime > 0)
          continue;
        const touched = checkPlayerCollisions(star, map.players);
        if (touched === null)
          continue;
        if (++touched.stars >= snapshot.starsToWin) {
          snapshot.produceLeaderboard();
        }
        map.stars.splice(i, 1);
      }
      for (let i = map.powerups.length - 1; i >= 0; i--) {
        const powerup = map.powerups[i];
        if (powerup.isOutsideBox(map.gameBox)) {
          map.powerups.splice(i, 1);
          continue;
        }
        const touched = checkPlayerCollisions(powerup, map.players);
        if (touched === null)
          continue;
        touched.powerup = powerups.produce(powerup.type);
        map.powerups.splice(i, 1);
      }
      for (const player of map.players) {
        for (let i = player.projectiles.length - 1; i >= 0; i--) {
          const p = player.projectiles[i];
          if (p.bounces < 0 || p.isOutsideBox(map.gameBox)) {
            player.projectiles.splice(i, 1);
            continue;
          }
          const victim = checkPlayerCollisions(p, map.players);
          if (victim === null || victim === player)
            continue;
          switch (p.type) {
            case ProjectileType.ICE:
              victim.onIce(p.vx);
              break;
            case ProjectileType.FIRE:
              victim.onFire();
              break;
          }
          player.projectiles.splice(i, 1);
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
      for (const player of snapshot.map.players) {
        const lifeFlag = reader.readUint8();
        player.flags = reader.readUint8();
        if (lifeFlag === -1) {
          player.sessionAlive = false;
          player.respawnCouldown = Player$2.RESPAWN_COULDOWN;
          continue;
        }
        player.sessionAlive = true;
        if (lifeFlag === 0) {
          player.respawnCouldown = Player$2.RESPAWN_COULDOWN;
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
        player.immuneCouldown = reader.readUint8() * (Player$2.IMMUNE_COULDOWN / 250);
        player.freezeCouldown = reader.readUint8() * (Player$2.FREEZE_TIME / 250);
        player.projectiles.length = 0;
        const projectileCount = reader.readUint8();
        for (let i = 0; i < projectileCount; i++) {
          const x = reader.readFloat32();
          const y = reader.readFloat32();
          const type2 = reader.readInt8();
          const vx = reader.readInt8() / 10;
          const bounces = reader.readInt8();
          const vy = reader.readFloat32();
          player.projectiles.push(new Projectile(x, y, vx, vy, type2, bounces));
        }
        const type = reader.readUint8();
        player.powerup = powerups.produce(type);
        powerups.recv(reader, player.powerup);
      }
      const starCount = reader.readUint16();
      snapshot.map.stars.length = 0;
      for (let i = 0; i < starCount; i++) {
        const x = reader.readFloat32();
        const y = reader.readFloat32();
        const vx = reader.readFloat32();
        const vy = reader.readFloat32();
        const deadtime = reader.readUint8() * (Star.DEADTIME / 250);
        const star = new Star(x, y, vx, vy, deadtime);
        snapshot.map.stars.push(star);
      }
      const powerUpCount = reader.readUint16();
      snapshot.map.powerups.length = 0;
      for (let i = 0; i < powerUpCount; i++) {
        const x = reader.readFloat32();
        const y = reader.readFloat32();
        const vy = reader.readFloat32();
        const type = reader.readUint8();
        const vx = reader.readInt8() / 10;
        const powerUp = new PowerUpEntity(x, y, vx, vy, type);
        snapshot.map.powerups.push(powerUp);
      }
    },
    writeNetworkDesc(snapshot, writer) {
      for (const player of snapshot.map.players) {
        let lifeFlag;
        if (!player.sessionAlive) {
          lifeFlag = -1;
        } else if (player.respawnCouldown > 0) {
          lifeFlag = 0;
        } else {
          lifeFlag = 1;
        }
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
        writer.writeInt8(Math.floor(Math.max(
          player.immuneCouldown,
          0
        ) * (250 / Player$2.IMMUNE_COULDOWN)));
        writer.writeInt8(Math.floor(Math.max(
          player.freezeCouldown,
          0
        ) * (250 / Player$2.FREEZE_TIME)));
        writer.writeUint8(player.projectiles.length);
        for (const p of player.projectiles) {
          writer.writeFloat32(p.x);
          writer.writeFloat32(p.y);
          writer.writeInt8(p.type);
          writer.writeInt8(Math.floor(p.vx * 10));
          writer.writeInt8(p.bounces);
          writer.writeFloat32(p.vy);
        }
        writer.writeUint8(powerups.getType(player.powerup));
        powerups.send(writer, player.powerup);
      }
      writer.writeUint16(snapshot.map.stars.length);
      for (const star of snapshot.map.stars) {
        writer.writeFloat32(star.x);
        writer.writeFloat32(star.y);
        writer.writeFloat32(star.vx);
        writer.writeFloat32(star.vy);
        writer.writeInt8(Math.floor(Math.max(star.deadtime, 0) * (250 / Star.DEADTIME)));
      }
      writer.writeUint16(snapshot.map.powerups.length);
      for (const powerUp of snapshot.map.powerups) {
        writer.writeFloat32(powerUp.x);
        writer.writeFloat32(powerUp.y);
        writer.writeFloat32(powerUp.vy);
        writer.writeUint8(powerUp.type);
        writer.writeInt8(Math.floor(powerUp.vx * 10));
      }
    }
  };
  function drawBlock(ctx, block) {
    const size = block.getSize();
    if (!size) {
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(block.x, block.y, 10, 0, 2 * Math.PI);
      ctx.fill();
      return;
    }
    ctx.save();
    ctx.strokeStyle = block.getHit() ? "yellow" : "white";
    ctx.lineWidth = 10;
    ctx.strokeRect(block.x, block.y, size.w, size.h);
    ctx.restore();
  }
  class Memory {
    constructor() {
      this.sentX = NaN;
      this.sentFlag = 0;
      this.respawnCouldown = -1;
      this.camX = 0;
      this.camY = 0;
      this.camZ = 1;
    }
  }
  const POWERUP_TEXTURES = [
    "defaultPowerup",
    "flowerFire",
    "flowerIce",
    "shell",
    "jump"
  ];
  const gstars_client = {
    game: gstars_game,
    name: "Stars",
    images: {
      playerRed: "assets/gstars/player-red.svg",
      playerBlue: "assets/gstars/player-blue.svg",
      star: "assets/gstars/star.svg",
      flowerFire: "assets/gstars/flower-fire.svg",
      flowerIce: "assets/gstars/flower-ice.svg",
      defaultPowerup: "assets/gstars/defaultPowerup.svg"
    },
    gameSize: { width: 1600, height: 900 },
    createMemory(snapshot, client, playerIndex) {
      client.appendJoystick(new Joystick(
        0.9,
        0.9,
        JoystickPlacement.SCREEN_RATIO,
        JoystickPlacement.SCREEN_RATIO,
        playerIndex === 0 ? JOYSTICK_COLORS.red : JOYSTICK_COLORS.blue,
        "move",
        1,
        [
          { key: "KeyD", r: 1, a: 0 },
          { key: "KeyA", r: 1, a: Math.PI },
          { key: "KeyW", r: 1, a: Math.PI * 3 / 2 },
          { key: "KeyS", r: 1, a: Math.PI * 1 / 2 }
        ]
      ));
      client.appendButton(new Button(
        0.1,
        0.9,
        ButtonPlacement.SCREEN_RATIO,
        ButtonPlacement.SCREEN_RATIO,
        playerIndex === 0 ? BUTTON_COLORS.red : BUTTON_COLORS.blue,
        "jump",
        1,
        1,
        ["KeyW", "Controller2", "Controller3"]
      ));
      client.appendButton(new Button(
        0.1,
        0.8,
        ButtonPlacement.SCREEN_RATIO,
        ButtonPlacement.SCREEN_RATIO,
        BUTTON_COLORS.yellow,
        "powerup",
        1,
        1,
        ["Space", "Controller0", "Controller1"]
      ));
      return new Memory();
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
      ctx.save();
      ctx.translate(800, 450);
      ctx.scale(memory.camZ, memory.camZ);
      ctx.translate(-memory.camX, -memory.camY);
      for (const block of snapshot.map.blocks) {
        drawBlock(ctx, block);
      }
      for (const player2 of snapshot.map.players) {
        for (const p of player2.projectiles) {
          switch (p.type) {
            case ProjectileType.ICE:
              ctx.fillStyle = "#0ff";
              break;
            case ProjectileType.FIRE:
              ctx.fillStyle = "#f70";
              break;
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, Projectile.RADIUS, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
      for (const powerup of snapshot.map.powerups) {
        ctx.save();
        ctx.translate(powerup.x, powerup.y);
        const path = POWERUP_TEXTURES[powerup.type];
        ctx.drawImage(
          imageLoader.getImage(path),
          -PowerUpEntity.WIDTH / 2,
          -PowerUpEntity.HEIGHT / 2,
          PowerUpEntity.WIDTH,
          PowerUpEntity.HEIGHT
        );
        ctx.restore();
      }
      const starImg = imageLoader.getImage("star");
      for (const star of snapshot.map.stars) {
        ctx.save();
        ctx.translate(star.x, star.y);
        ctx.drawImage(
          starImg,
          -Star.WIDTH / 2,
          -Star.HEIGHT / 2,
          Star.WIDTH,
          Star.HEIGHT
        );
        ctx.restore();
      }
      const imagesNames = ["playerRed", "playerBlue"];
      for (let i = 0; i < 2; i++) {
        const player2 = snapshot.map.players[i];
        if (player2.respawnCouldown > 0)
          continue;
        const px = player2.x;
        const py = player2.y;
        ctx.save();
        ctx.translate(px, py);
        ctx.scale(
          snapshot.map.players[i].flags & flags.LOOK_LEFT ? -1 : 1,
          1
        );
        ctx.drawImage(
          imageLoader.getImage(imagesNames[i]),
          -Player$2.WIDTH / 2,
          -Player$2.HEIGHT / 2,
          Player$2.WIDTH,
          Player$2.HEIGHT
        );
        ctx.restore();
      }
      ctx.restore();
      ctx.restore();
      ctx.drawImage(
        imageLoader.getImage("star"),
        10,
        10,
        50,
        50
      );
      const player = snapshot.map.players[playerIndex];
      const starsCount = player.stars.toString().padStart(2, "0");
      const starsToWinCount = snapshot.starsToWin.toString().padStart(2, "0");
      ctx.fillStyle = "yellow";
      ctx.font = "32px monospace";
      ctx.fillText(`${starsCount}/${starsToWinCount}`, 70, 45);
      let powerupImg;
      if (player.powerup instanceof powerups.Default) {
        powerupImg = POWERUP_TEXTURES[0];
      } else if (player.powerup instanceof powerups.Fire) {
        powerupImg = POWERUP_TEXTURES[1];
      } else if (player.powerup instanceof powerups.Ice) {
        powerupImg = POWERUP_TEXTURES[2];
      } else {
        powerupImg = "";
      }
      ctx.drawImage(
        imageLoader.getImage(powerupImg),
        10,
        70,
        50,
        50
      );
    },
    clientFrame(snapshot, memory, playerIndex, client) {
      const player = snapshot.map.players[playerIndex];
      if (player.respawnCouldown <= 0) {
        memory.respawnCouldown = -1;
      } else if (memory.respawnCouldown > 0) {
        memory.respawnCouldown -= 1e3 / 60;
      } else {
        memory.respawnCouldown = Player$2.RESPAWN_COULDOWN;
      }
      let dir = client.getJoyStickDirection("move");
      if (!dir) {
        dir = { x: 0, y: 0 };
      }
      let flag = memory.sentFlag & flags.WAS_JUMPING & flags.WAS_POWER;
      if (dir.y < -0.8)
        flag |= flags.DIVE;
      if (dir.x < 0) {
        flag |= flags.LOOK_LEFT;
      } else if (dir.x === 0) {
        flag |= memory.sentFlag & flags.LOOK_LEFT;
      }
      if (client.getButton("jump")) {
        flag |= flags.JUMP;
      }
      if (client.getButton("powerup")) {
        flag |= flags.POWER;
      }
      if (dir.x != memory.sentX || flag != memory.sentFlag) {
        memory.sentX = dir.x;
        memory.sentFlag = flag;
        const writer = new DataWriter();
        writer.writeFloat32(dir.x);
        writer.writeUint8(flag);
        client.addInput(writer.toArrayBuffer());
      }
      if (player.respawnCouldown >= 0) {
        memory.camX = 0;
        memory.camY = 0;
      } else {
        memory.camX = player.x;
        memory.camY = player.y;
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
  let Snapshot$4 = (_c = class {
    constructor(isServer) {
      this.players = [
        new Player$1(540, 290),
        new Player$1(540, 2090)
      ];
      this.tiles = new Int16Array(_c.TILES_Y * _c.TILES_X);
      this.frame = 0;
      this.servData = isServer ? new ServData() : null;
      this.tiles.fill(_c.LIFETIME);
    }
    *onSquare() {
      const seen = /* @__PURE__ */ new Set();
      for (const player of this.players) {
        const px = player.x;
        const py = player.y;
        for (let dy = -_c.SEND_RANGE; dy <= _c.SEND_RANGE; dy++) {
          for (let dx = -_c.SEND_RANGE; dx <= _c.SEND_RANGE; dx++) {
            const idx = _c.getIdx(px + dx, py + dy);
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
      if (x < 0 || y < 0 || x >= _c.TILES_X || y >= _c.TILES_Y)
        return -1;
      return y * _c.TILES_X + x;
    }
  }, _c.TILES_X = 9, _c.TILES_Y = 21, _c.LIFETIME = 12 * 1e3, _c.SEND_RANGE = 3, _c.PLAYER_RADIUS = 40, _c.TILE_MODULO = 5 * 1e3, _c);
  const gpackice = {
    Snapshot: Snapshot$4
  };
  const Snapshot$3 = gpackice.Snapshot;
  const PLAYER_SPEED$1 = 0.4;
  const TILE_MODULO = Snapshot$3.TILE_MODULO;
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
      const intSpeed = Math.floor(speed);
      for (let i = 0; i < snapshot.tiles.length; i++) {
        const tile = snapshot.tiles[i];
        if (tile > 0 && tile % TILE_MODULO !== 0) {
          snapshot.tiles[i] = Math.max(tile - intSpeed, Math.floor(tile / TILE_MODULO) * TILE_MODULO);
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
        snapshot.tiles[tile.idx] = reader.readInt16();
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
      for (const tile of snapshot.onSquare()) {
        writer.writeInt16(tile.value);
      }
    }
  };
  const Snapshot$2 = gpackice.Snapshot;
  const TILES_X = Snapshot$2.TILES_X;
  const TILES_Y = Snapshot$2.TILES_Y;
  function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
    ctx.fill();
  }
  const packice_client = {
    game: packice_game,
    name: "Pingouins",
    images: {
      playerRed: "assets/gpackice/player-red.svg",
      playerBlue: "assets/gpackice/player-blue.svg"
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
      let tile = 0;
      ctx.save();
      for (let y = 0; y < TILES_Y; y++) {
        for (let x = 0; x < TILES_X; x++) {
          const line = snapshot.tiles[tile];
          tile++;
          if (line === 0)
            continue;
          ctx.fillStyle = `rgba(255,255,255,${line / Snapshot$2.LIFETIME})`;
          drawRoundedRect(ctx, 100 * x + 100, 100 * y + 150, 80, 80, 10);
        }
      }
      ctx.restore();
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
    gstars_client,
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
        case CLIENT_IDS.SYNC:
          handleSync();
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
    const now = getTimestamp();
    const diff = window.FORCED_LATENCY - (now - lastPackageSendTimestamp);
    const bufferToSend = globalGameEngine.handleNetwork(reader).toArrayBuffer();
    if (diff >= 0) {
      setTimeout(() => {
        lastPackageSendTimestamp = getTimestamp();
        socket?.send(bufferToSend);
      }, diff);
    } else if (globalGameEngine && socket) {
      socket.send(bufferToSend);
      lastPackageSendTimestamp = now;
    }
  }
  function handleSync() {
    if (!socket)
      return;
    const now = getTimestamp();
    const buffer = new DataWriter(6);
    buffer.writeUint8(SERVER_IDS.SYNC);
    buffer.writeUint32(now);
    buffer.writeUint8(SERVER_IDS.FINISH);
    socket.send(buffer.toArrayBuffer());
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
    window.addEventListener("gamepadconnected", (e) => {
      console.log("Gamepad connected:", e.gamepad);
    });
    window.addEventListener("gamepaddisconnected", (e) => {
      console.log("Gamepad disconnected:", e.gamepad);
    });
    let lastFrameDate = getTimestamp();
    function gameLoop() {
      const now = getTimestamp();
      const gamepad = navigator.getGamepads()[0];
      if (gamepad)
        gameEngine.handleGamepad(gamepad);
      gameEngine.runFrame(now - lastFrameDate);
      lastFrameDate = now;
      const screenArea = Math.sqrt(
        window.innerWidth * window.innerWidth + window.innerHeight * window.innerHeight
      );
      ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
      gameEngine.draw(ctx);
      gameEngine.drawJoysticks(ctx, screenArea);
      gameEngine.drawButtons(ctx, screenArea);
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
        if (globalGameEngine)
          return;
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
  document.addEventListener("keypress", (e) => {
    if (globalGameEngine) {
      globalGameEngine.handleKeypress(e.code);
    }
  });
  document.addEventListener("keyup", (e) => {
    if (globalGameEngine) {
      globalGameEngine.handleKeyup(e.code);
    }
  });
})();
