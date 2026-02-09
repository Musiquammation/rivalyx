import { GameInterface } from "../GameInterface";
import { getTimestamp } from "../getTimestamp";
import { DataReader } from "../net/DataReader";
import { DataWriter } from "../net/DataWriter";
import { SERVER_IDS } from "../net/SERVER_IDS";
import { Button } from "./Button";
import { ClientInterface } from "./ClientInterface";
import { ImageLoader } from "./ImageLoader";
import { Joystick, JoystickPlacement } from "./Joystick";


const MAX_FRAME_DURATION = 10;


interface Input {
	date: number;
	content: ArrayBuffer;
}



export class ClientGameEngine {
	joysticks = new Set<Joystick>();
	buttons = new Set<Button>();
	playerIndex = -1;
	lastSendDate = -Infinity;

	private canvas: HTMLCanvasElement | null = null;
	private object: ClientInterface<any, any>;
	private snapshot: any;
	private memory: any;
	private imageLoader: ImageLoader;
	private inputs: Input[] = [];

	constructor(imageLoader: ImageLoader, object: ClientInterface<any, any>) {
		this.imageLoader = imageLoader;
		this.object = object;
		this.snapshot = object.game.createSnapshot();
	}
	

	start() {
		this.memory = this.object.createMemory(
			this.snapshot, this, this.playerIndex);
	}

    getGameSize() {
		return this.object.gameSize;
	}

	getTimer() {
		return this.object.getTimer(this.snapshot);
	}

	addInput(data: ArrayBuffer) {
		this.inputs.push({date: getTimestamp(), content: data});
		this.object.game.handleInput(this.snapshot, new DataReader(data), this.playerIndex);
	}
	
	draw(ctx: CanvasRenderingContext2D) {
		const applyToScreen = () => {
			const gameSize = this.getGameSize();
			const screenWidth = this.canvas!.width;
			const screenHeight = this.canvas!.height;
	
			const scaleX = screenWidth / gameSize.width;
			const scaleY = screenHeight / gameSize.height;
	
			const scale = Math.min(scaleX, scaleY);
	
			const offsetX = (screenWidth - gameSize.width * scale) / 2;
			const offsetY = (screenHeight - gameSize.height * scale) / 2;
			ctx.translate(offsetX, offsetY);
			ctx.scale(scale, scale);
		};

		
		this.object.draw(this.snapshot, this.memory, ctx,
			this.canvas!.width, this.canvas!.height,
			this.imageLoader, this.playerIndex, applyToScreen);
	}
	

	private getFirstInput(date: number): number {
		let l = 0;
		let r = this.inputs.length;

		while (l < r) {
			const mid = (l + r) >>> 1;
			if (this.inputs[mid].date < date)
				l = mid + 1;
			else
				r = mid;
		}
		return l;
	}


	
	runFrame(duration: number) {
		this.object.runPublicFrame(this.snapshot, this.memory, this.playerIndex, this);

		while (duration >= MAX_FRAME_DURATION) {
			this.object.game.frame(this.snapshot, MAX_FRAME_DURATION);
			duration -= MAX_FRAME_DURATION;
		}

		this.object.game.frame(this.snapshot, duration);
	}


	handleNetwork(reader: DataReader | null): DataWriter {
		if (reader) {
			// Date
			const servDate = reader.readUint32();

			// Take status
			this.object.game.readNetworkDesc(this.snapshot, reader);

			if (this.inputs.length === 0) {
				const date = getTimestamp();
				console.log(date - this.lastSendDate);
				this.object.game.frame(
					this.snapshot,
					date - this.lastSendDate
				);
				
			} else {
				// Simulate until now
				const lengthLimit = this.inputs.length - 1;
				console.log("RUN:", lengthLimit);

				console.log(this.inputs[0].date - this.lastSendDate);
				this.object.game.frame(
					this.snapshot,
					Math.max(this.inputs[0].date - this.lastSendDate, 0)
				);

				for (let i = 0; i < lengthLimit; i++) {
					const input = this.inputs[i];
					let date = Math.max(this.lastSendDate, input.date);
					console.log(this.inputs[i+1].date - date, this.snapshot.players[0].y);

					this.object.game.handleInput(this.snapshot,
						new DataReader(input.content), this.playerIndex);

					this.object.game.frame(
						this.snapshot,
						Math.max(this.inputs[i+1].date - date, 0)
					);
				}
	
				const date = getTimestamp();
				this.object.game.handleInput(this.snapshot,
					new DataReader(this.inputs[lengthLimit].content), this.playerIndex);

				console.log(date - this.inputs[lengthLimit].date);
				this.object.game.frame(
					this.snapshot,
					date - this.inputs[lengthLimit].date
				);
			}

		}

		const writer = new DataWriter();
		writer.writeUint8(SERVER_IDS.GAME_DATA);
		writer.writeUint32(getTimestamp());
		
		// Send inputs
		for (let input of this.inputs) {
			writer.writeUint32(input.date);
			writer.addArrayBuffer(input.content);
		}

		writer.writeUint32(0); // final date
		writer.writeUint8(SERVER_IDS.FINISH);
		this.inputs.length = 0; // empty inputs


		this.lastSendDate = getTimestamp();
		return writer;
	}







	setCanvas(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
	}

	handleTouchEvent(kind: 'touchstart' | 'touchmove' | 'touchend', event: TouchEvent) {
		if (!this.canvas) return;
		
		const screenWidth = window.innerWidth;
		const screenHeight = window.innerHeight;
		const canvasWidth = this.canvas.width;
		const canvasHeight = this.canvas.height;
		this.object.handleSubTouchEvent(this.snapshot, kind, event,
			screenWidth, screenHeight, canvasWidth, canvasHeight);

		// Check if any touch is on an interactive element (button, link, etc.)
		let shouldPreventDefault = true;
		for (let i = 0; i < event.changedTouches.length; i++) {
			const touch = event.changedTouches[i];
			const element = document.elementFromPoint(touch.clientX, touch.clientY);
			
			// If touch is on an interactive element, don't prevent default
			if (element && (
				element.tagName === 'BUTTON' ||
				element.tagName === 'A' ||
				element.closest('button') ||
				element.closest('a')
			)) {
				shouldPreventDefault = false;
				break;
			}
		}

		// Only prevent default if touch is not on an interactive element
		if (shouldPreventDefault) {
			event.preventDefault();
		}

		for (let i = 0; i < event.changedTouches.length; i++) {
			const touch = event.changedTouches[i];
			const clientX = touch.clientX;
			const clientY = touch.clientY;
			const touchId = touch.identifier;

			// Check if touch is on an interactive element
			const element = document.elementFromPoint(clientX, clientY);
			const isInteractiveElement = element && (
				element.tagName === 'BUTTON' ||
				element.tagName === 'A' ||
				element.closest('button') ||
				element.closest('a')
			);

			// Skip joystick handling if touch is on an interactive element
			if (isInteractiveElement) {
				continue;
			}

			if (kind === 'touchstart') {
				// Find the closest joystick
				let closestJoystick: Joystick | null = null;
				let minDistance = Infinity;

				for (const joystick of this.joysticks) {
					if (joystick.activeTouchId !== undefined) continue; // Already active
					
					const pos = this.getJoystickPosition(joystick, screenWidth, screenHeight, canvasWidth, canvasHeight);
					const distance = Math.sqrt(Math.pow(clientX - pos.x, 2) + Math.pow(clientY - pos.y, 2));
					
					if (distance < minDistance) {
						minDistance = distance;
						closestJoystick = joystick;
					}
				}

				if (closestJoystick) {
					closestJoystick.activeTouchId = touchId;
					// Définir l'origine au point de toucher initial
					closestJoystick.originX = clientX;
					closestJoystick.originY = clientY;
					closestJoystick.stickX = 0;
					closestJoystick.stickY = 0;
				}
			} else if (kind === 'touchmove') {
				// Update joystick position if this touch is controlling one
				for (const joystick of this.joysticks) {
					if (joystick.activeTouchId === touchId && joystick.originX !== undefined && joystick.originY !== undefined) {
						this.updateJoystickPosition(joystick, clientX, clientY);
						break;
					}
				}
			} else if (kind === 'touchend' || kind === 'touchcancel') {
				// Release joystick
				for (const joystick of this.joysticks) {
					if (joystick.activeTouchId === touchId) {
						joystick.activeTouchId = undefined;
						joystick.stickX = 0;
						joystick.stickY = 0;
						joystick.originX = undefined;
						joystick.originY = undefined;
						break;
					}
				}
			}
		}
	}


	appendButton(button: Button) {
		this.buttons.add(button);
	}

	removeButton(button: Button) {
		this.buttons.delete(button);
	}


	private updateJoystickPosition(joystick: Joystick, clientX: number, clientY: number) {
		if (joystick.originX === undefined || joystick.originY === undefined) return;
		
		const radius = joystick.radius || 50;
		
		const dx = clientX - joystick.originX;
		const dy = clientY - joystick.originY;
		const distance = Math.sqrt(dx * dx + dy * dy);
		
		if (distance <= radius) {
			joystick.stickX = dx / radius;
			joystick.stickY = dy / radius;
		} else {
			// Constrain to radius
			joystick.stickX = dx / distance;
			joystick.stickY = dy / distance;
		}
	}

	appendJoystick(joystick: Joystick) {
		joystick.stickX = 0;
		joystick.stickY = 0;
		return this.joysticks.add(joystick);
	}
	
	removeJoystick(joystick: Joystick) {
		return this.joysticks.delete(joystick);
	}

	getJoyStickDirection(label: string) {
		const joystick = Array.from(this.joysticks).find(j => j.label === label);
		if (!joystick) return null;
		return { x: joystick.stickX, y: joystick.stickY };
	}

	private getJoystickPosition(joystick: Joystick, screenWidth: number, screenHeight: number, 
		canvasWidth: number, canvasHeight: number): { x: number, y: number } {
		// Si le joystick a une origine (actif), utiliser cette origine
		if (joystick.originX !== undefined && joystick.originY !== undefined) {
			return { x: joystick.originX, y: joystick.originY };
		}

		let x: number;
		let y: number;

		// Calculate X position (position par défaut quand inactif)
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

		// Calculate Y position
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

	drawJoysticks(ctx: CanvasRenderingContext2D, screenArea: number) {
		if (!this.canvas) return;
		
		const screenWidth = window.innerWidth;
		const screenHeight = window.innerHeight;
		const canvasWidth = this.canvas.width;
		const canvasHeight = this.canvas.height;

		for (const joystick of this.joysticks) {
			joystick.updateRatio(screenArea);

			// Ne dessiner que si le joystick est actif
			// if (joystick.activeTouchId === undefined) continue;

			const pos = this.getJoystickPosition(joystick, screenWidth, screenHeight, canvasWidth, canvasHeight);
			const radius = joystick.radius;
			const stickX = joystick.stickX;
			const stickY = joystick.stickY;

			// Draw joystick base
			ctx.fillStyle = `rgba(${joystick.color.base[0]}, ${joystick.color.base[1]}, ${joystick.color.base[2]}, 0.5)`;
			ctx.beginPath();
			ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
			ctx.fill();

			// Draw joystick stick
			const stickRadius = radius * 0.4;
			ctx.fillStyle = `rgba(${joystick.color.stick[0]}, ${joystick.color.stick[1]}, ${joystick.color.stick[2]}, 0.8)`;
			ctx.beginPath();
			ctx.arc(pos.x + stickX * radius * 0.6, pos.y + stickY * radius * 0.6, stickRadius, 0, Math.PI * 2);
			ctx.fill();
		}
	}
}

