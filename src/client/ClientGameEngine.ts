import { DataReader } from "../net/DataReader";
import { DataWriter } from "../net/DataWriter";
import { ImageLoader } from "./ImageLoader";


export enum JoystickPlacement { 
	CENTERED,
	SCREEN_RATIO,
	GAME_RATIO
}


export class Joystick {
	x: number;
	y: number;
	xpl: JoystickPlacement;
	ypl: JoystickPlacement;
	radius: number;
	label: string;

	activeTouchId?: number;
	stickX: number;
	stickY: number;
	
	// Position d'origine du joystick (où le joueur a touché)
	originX?: number;
	originY?: number;

	constructor(
		x: number,
		y: number,
		xpl: JoystickPlacement,
		ypl: JoystickPlacement,
		label: string,
		radius: number = 32
	) {
		this.x = x;
		this.y = y;
		this.xpl = xpl;
		this.ypl = ypl;
		this.label = label;
		this.radius = radius;

		this.activeTouchId = undefined;
		this.stickX = 0;
		this.stickY = 0;
		this.originX = undefined;
		this.originY = undefined;
	}
}


export abstract class ClientGameEngine {
	joysticks = new Set<Joystick>();
	playerIndex = -1;

	private canvas: HTMLCanvasElement | null = null;
	protected imageLoader: ImageLoader;

	constructor(imageLoader: ImageLoader) {
		this.imageLoader = imageLoader;
	}

	abstract start(): void;
	abstract getGameSize(): {width: number, height: number};
	protected abstract draw(ctx: CanvasRenderingContext2D): void;

	drawGame(ctx: CanvasRenderingContext2D) {
		const gameSize = this.getGameSize();
		const screenWidth = this.canvas!.width;
		const screenHeight = this.canvas!.height;

		const scaleX = screenWidth / gameSize.width;
		const scaleY = screenHeight / gameSize.height;

		// Choisir le scale qui "remplit au max" sans déformer
		const scale = Math.min(scaleX, scaleY); // ok, on crop si nécessaire

		// Calcul des offsets pour centrer le jeu sur le canvas
		const offsetX = (screenWidth - gameSize.width * scale) / 2;
		const offsetY = (screenHeight - gameSize.height * scale) / 2;

		// Appliquer la transformation
		ctx.save();
		ctx.translate(offsetX, offsetY);
		ctx.scale(scale, scale);

		this.draw(ctx);
		
		ctx.restore();

	}
	
	abstract clientNetwork(reader: DataReader | null): DataWriter;

	setCanvas(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
	}

	handleTouchEvent(kind: 'touchstart' | 'touchmove' | 'touchend', event: TouchEvent) {
		if (!this.canvas) return;
		
		const rect = this.canvas.getBoundingClientRect();
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

	protected appendJoystick(joystick: Joystick) {
		joystick.stickX = 0;
		joystick.stickY = 0;
		return this.joysticks.add(joystick);
	}
	
	protected removeJoystick(joystick: Joystick) {
		return this.joysticks.delete(joystick);
	}

	protected getJoyStickDirection(label: string) {
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

	drawJoysticks(ctx: CanvasRenderingContext2D) {

		if (!this.canvas) return;
		
		const screenWidth = window.innerWidth;
		const screenHeight = window.innerHeight;
		const canvasWidth = this.canvas.width;
		const canvasHeight = this.canvas.height;

		for (const joystick of this.joysticks) {
			// Ne dessiner que si le joystick est actif
			// if (joystick.activeTouchId === undefined) continue;

			const pos = this.getJoystickPosition(joystick, screenWidth, screenHeight, canvasWidth, canvasHeight);
			const radius = joystick.radius;
			const stickX = joystick.stickX;
			const stickY = joystick.stickY;

			// Draw joystick base
			ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';
			ctx.beginPath();
			ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
			ctx.fill();

			// Draw joystick stick
			const stickRadius = radius * 0.4;
			ctx.fillStyle = 'rgba(150, 150, 150, 0.8)';
			ctx.beginPath();
			ctx.arc(pos.x + stickX * radius * 0.6, pos.y + stickY * radius * 0.6, stickRadius, 0, Math.PI * 2);
			ctx.fill();
		}
	}
}