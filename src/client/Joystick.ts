export enum JoystickPlacement { 
	CENTERED,
	SCREEN_RATIO,
	GAME_RATIO
}

export interface JoystickColor {
	base: number[];
	stick: number[];
}


export const JOYSTICK_COLORS: {[key: string]: JoystickColor} = {
	blue: {base: [35, 65, 165], stick: [65, 99, 208]},
	red:  {base: [148, 45, 45], stick: [208, 65, 65]}
};



export class Joystick {
	x: number;
	y: number;
	xpl: JoystickPlacement;
	ypl: JoystickPlacement;
	radius = 32;
	radiusRatio: number;
	label: string;
	color: JoystickColor;

	activeTouchId?: number;
	stickX: number;
	stickY: number;
	
	// Position d'origine du joystick (où le joueur a touché)
	originX?: number;
	originY?: number;

	keys;
	pressedKeys: string[] = [];

	constructor(
		x: number,
		y: number,
		xpl: JoystickPlacement,
		ypl: JoystickPlacement,
		color: JoystickColor,
		label: string,
		radiusRatio: number = 1,
		keys: {key: string, a: number, r: number}[] = []
	) {
		this.x = x;
		this.y = y;
		this.xpl = xpl;
		this.ypl = ypl;
		this.label = label;
		this.color = color;
		this.radiusRatio = radiusRatio;

		this.activeTouchId = undefined;
		this.stickX = 0;
		this.stickY = 0;
		this.originX = undefined;
		this.originY = undefined;

		this.keys = keys;
	}

	static readonly FACTOR = 0.05;

	updateRatio(screenArea: number) {
		this.radius = screenArea * this.radiusRatio * Joystick.FACTOR;
	}


	getStick() {
		if (this.pressedKeys.length === 0) {
			return {x: this.stickX, y: this.stickY};
		}

		let x = 0;
		let y = 0;
		let r = 0;
		let n = 0;

		for (const p of this.pressedKeys) {
			for (const k of this.keys) {
				if (k.key === p) {
					r += k.r;
					x += k.r * Math.cos(k.a);
					y += k.r * Math.sin(k.a);
					n++;
				}
			}
		}

		// Take average values
		n = 1/n;
		x *= n;
		y *= n;
		r *= n;


		const factor = r / Math.sqrt(x*x + y*y);
		x *= factor;
		y *= factor;
		
		return {x, y};

	}
}