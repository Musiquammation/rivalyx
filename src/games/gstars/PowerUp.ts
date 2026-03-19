import { DataReader } from "../../net/DataReader";
import { DataWriter } from "../../net/DataWriter";
import { Block } from "./Block";
import { Entity, EntityBehavior } from "./Entity";
import { flags } from "./flags";
import { Player } from "./Player";
import { Projectile, ProjectileType } from "./Projectile";

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


export function createPowerUp(x: number, y: number, type: PowerType) {
	return new PowerUpEntity(x, y, POWER_STATS[type].vx, POWER_STATS[type].vy, type);
}

export class PowerUpEntity extends Entity {
	static readonly WIDTH = 32;
	static readonly HEIGHT = 32;


	/// TODO: set this value to 5
	static readonly TYPES_COUNT = 3;

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



export type powerUp_t = powerups.Default |
	powerups.Fire |
	powerups.Ice |
	powerups.Shell |
	powerups.Jumper;


export namespace powerups {
	export class Default {

	}

	export class Fire {
		static readonly LIMIT = 2;
		static readonly SPEED = 0.4;
	}
	
	export class Ice {
		static readonly LIMIT = 4;
		static readonly SPEED = 0.3;
	}

	export class Shell {

	}

	export class Jumper {

	}


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

	export function start(power: powerUp_t, player: Player) {
		if (power instanceof Default) {
			return;
		}

		if (power instanceof Fire) {
			if (player.projectiles.length < Fire.LIMIT) {
				const dir = (player.flags & flags.LOOK_LEFT) ? -1 : 1;
				player.projectiles.push(new Projectile(
					player.x + dir * Player.WIDTH/2,
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
				const dir = (player.flags & flags.LOOK_LEFT) ? -1 : 1;
				player.projectiles.push(new Projectile(
					player.x + dir * Player.WIDTH/2,
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

	export function use(power: powerUp_t, player: Player) {
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

	export function stop(power: powerUp_t, player: Player) {
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

	export function projectile(power: powerUp_t, player: Player) {
	}
}


