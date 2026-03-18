import { Entity, EntityBehavior as CollBehavior } from "./Entity";
import { GameMap } from "./GameMap";
import { collision } from "./collision";
import { flags } from "./flags";




export class Player extends Entity {
	static readonly WIDTH = 32;
	static readonly HEIGHT = 32;
	static readonly JUMPS = 2;
	
	static readonly JUMP = 1.2;
	static readonly GRAVITY = 2.400 / 1000;

	static readonly MAX_SPEED = 1.5;
	static readonly ACCELERATION = 6.0;
	static readonly DECELERATION = 7.0;
	static readonly ACC_REVERSE = 13.0;
	static readonly SLOW_DOWN = 1.500;
	static readonly DASH = 3.000;


	dirX = 0;
	flags = 0;
	alive = true;
	jumps = Player.JUMPS;


	constructor(x: number, y: number) {
		super(x, y, 0, 0);
	}
	


	frame(speed: number) {
		// Adapt speed
		if (this.dirX > 0) {
			const maxSpeed = Player.MAX_SPEED * this.dirX;
			let vx = this.vx;

			if (vx > maxSpeed) {
				vx -= Player.SLOW_DOWN * speed;
				if (vx < maxSpeed) {
					vx = maxSpeed;
				}
			} else {
				if (vx < 0) {
					vx += Player.ACC_REVERSE * speed;
				} else {
					vx += Player.ACCELERATION * speed;
				}

				if (vx > maxSpeed) {
					vx = maxSpeed;
				}
			}

			this.vx = vx;
		
		} else if (this.dirX < 0) {
			const maxSpeed = Player.MAX_SPEED * this.dirX;
			let vx = this.vx;

			if (vx < maxSpeed) {
				vx -= Player.SLOW_DOWN * speed;
				if (vx < maxSpeed) {
					vx = maxSpeed;
				}
			} else {
				if (vx > 0) {
					vx -= Player.ACC_REVERSE * speed;
				} else {
					vx -= Player.ACCELERATION * speed;
				}

				if (vx < maxSpeed) {
					vx = maxSpeed;
				}
			}

			this.vx = vx;

		} else {
			if (this.vx > 0) {
				this.vx -= Player.DECELERATION * speed;
				if (this.vx < 0) {
					this.vx = 0;
				}
			} else if (this.vx < 0) {
				this.vx += Player.DECELERATION * speed;
				if (this.vx > 0) {
					this.vx = 0;
				}
			}
		}

		// Apply gravity
		this.vy += Player.GRAVITY * speed;

		// Jump
		if ((this.flags & flags.JUMP) === 0) {
			this.flags &= ~flags.WAS_JUMPING;
		} else if ((this.flags & flags.WAS_JUMPING) === 0) {
			// Update flag
			this.flags |= flags.WAS_JUMPING;
		
			// Apply jump
			if (this.jumps > 0) {
				this.vy = -Player.JUMP;
				this.jumps--;
			}
		}
	}





	override resetJumps() {
		this.jumps = Player.JUMPS;
	}

	override onPlatform(behavior: CollBehavior) {
		
	}




	override getSize(): { w: number; h: number; } {
		return {w: Player.WIDTH, h: Player.HEIGHT};
	}

	
}

