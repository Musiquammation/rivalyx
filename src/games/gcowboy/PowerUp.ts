import { DataReader } from "../../net/DataReader";
import { DataWriter } from "../../net/DataWriter";
import { Block } from "./Block";
import { Entity, EntityBehavior } from "./Entity";

export enum PowerType {
	DEFAULT,
	FIRE,
	ICE,
	SHELL,
	JUMPER
}

const POWER_STATS = [
	{vx: 1,  vy: 0,   jmp: false},      // default
	{vx: 0,  vy: 0,   jmp: false},      // fire
	{vx: 0,  vy: 0,   jmp: false},      // ice
	{vx: .1, vy: -.5, jmp: true},       // shell
	{vx: .1, vy: -.5, jmp: true},       // jumper
];


export function newPowerUp(x: number, y: number, type: PowerType) {
	return new PowerUpEntity(x, y, POWER_STATS[type].vx, POWER_STATS[type].vy, type);
}

export class PowerUpEntity extends Entity {
	static readonly WIDTH = 32;
	static readonly HEIGHT = 32;
	static readonly TYPES_COUNT = 5;

	type: PowerType;

	constructor(x: number, y: number, vx: number, vy: number, type: PowerType) {
		super(x, y, vx, vy);
		this.type = type;
	}

	override getSize() {
		return {w: PowerUpEntity.WIDTH, h: PowerUpEntity.HEIGHT};
	}

	override onPlatform(
		behavior: EntityBehavior,
		prev_vx: number, prev_vy: number,
		block: Block
	) {
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
}



type powerUp_t = powerups.Default |
	powerups.Fire |
	powerups.Ice |
	powerups.Shell |
	powerups.Jumper;


export namespace powerups {
	export class Default {}
	export class Fire {}
	export class Ice {}
	export class Shell {}
	export class Jumper {}


	export function send(writer: DataWriter, powerup: powerUp_t) {
		if (powerup instanceof Default) {
			return;
		}

	}

	export function recv(reader: DataReader, powerup: powerUp_t) {

	}

	export function produce(type: PowerType) {
		switch (type) {
		case PowerType.DEFAULT:
			return new powerups.Default();

		case PowerType.FIRE:
			return new powerups.Fire();

		case PowerType.ICE:
			return new powerups.Ice();

		case PowerType.SHELL:
			return new powerups.Shell();

		case PowerType.JUMPER:
			return new powerups.Jumper();
		}
	}

	export function getType(powerup: powerUp_t) {
		if (powerup instanceof Default)
			return PowerType.DEFAULT;

		if (powerup instanceof Fire)
			return PowerType.FIRE;

		if (powerup instanceof Ice)
			return PowerType.ICE;

		if (powerup instanceof Shell)
			return PowerType.SHELL;

		if (powerup instanceof Jumper)
			return PowerType.JUMPER;
	
		return PowerType.DEFAULT;
	}
}


