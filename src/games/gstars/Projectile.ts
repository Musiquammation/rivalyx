import { Entity, EntityBehavior } from "./Entity";
import { Player } from "./Player";



export enum ProjectileType {
	ICE,
	FIRE
}

const BOUCES = [
	4, // ice
	2  // fire
];


export class Projectile extends Entity {
	static readonly RADIUS = 16;
	static readonly JUMP = 0.3;
	static readonly GRAVITY = 1.200 / 1000;

	type;
	bounces: number;


	constructor(
		x: number, y: number,
		vx: number, vy: number,
		type: ProjectileType,
		bounces = BOUCES[type]
	) {
		super(x, y, vx, vy);
		this.type = type;
		this.bounces = bounces;
	}


	override getSize() {
		return {w: Projectile.RADIUS, h: Projectile.RADIUS};
	}


	applyOnPlayer(player: Player) {
		switch (this.type) {
		case ProjectileType.ICE:
			player.onIce(this.vx);
			break;

		case ProjectileType.FIRE:
			player.onFire();
			break;
		}
	}


	override onPlatform(
		behavior: EntityBehavior,
		prev_vx: number,
		prev_vy: number
	)
	{
		switch (behavior) {
		case EntityBehavior.IDLE_FLOOR:
		{
			this.vy = -Projectile.JUMP;
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
}


