export enum ButtonPlacement { 
	CENTERED,
	SCREEN_RATIO,
	GAME_RATIO
}


export interface ButtonColor {
	idle: number[];
	pressed: number[];
}


export const BUTTON_COLORS: {[key: string]: ButtonColor} = {
	blue: {idle: [35, 65, 165], pressed: [65, 99, 208]},
	red:  {idle: [148, 45, 45], pressed: [208, 65, 65]}
};


export class Button {
	x: number;
	y: number;
	xpl: ButtonPlacement;
	ypl: ButtonPlacement;
	width: number;
	height: number;
	widthRatio: number;
	heightRatio: number;
	label: string;
	color: ButtonColor;
	activeTouchId: number|null = null;

	constructor(
		x: number,
		y: number,
		xpl: ButtonPlacement,
		ypl: ButtonPlacement,
		color: ButtonColor,
		label: string,
		widthRatio: number,
		heightRatio: number,
	) {
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
	}

	static FACTOR = 0.05;

	updateRatio(screenArea: number) {
		this.width = screenArea * this.widthRatio * Button.FACTOR;
		this.height = screenArea * this.heightRatio * Button.FACTOR;
	}
}

