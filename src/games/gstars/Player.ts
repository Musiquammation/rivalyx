import { Block } from "./Block";
import { Entity, EntityBehavior } from "./Entity";
import { GameMap } from "./GameMap";
import { powerUp_t, powerups } from "./PowerUp";
import { Projectile } from "./Projectile";
import { Star } from "./Star";
import { collision } from "./collision";
import { flags } from "./flags";



export class Player extends Entity {
	static readonly WIDTH = 32;
	static readonly HEIGHT = 32;
	static readonly JUMPS = 2;
	
	static readonly JUMP = 1.2;
	static readonly DOMINATION_BOUNCE = 0.7;
	static readonly DOMINATION_FORCE = .6;
	static readonly GRAVITY = 2.400 / 1000;

	static readonly MAX_SPEED = 1.5;
	static readonly ACCELERATION = 6.0;
	static readonly DECELERATION = 7.0;
	static readonly ACC_REVERSE = 13.0;
	static readonly SLOW_DOWN = 1.500;
	static readonly DASH = 3.000;


	static readonly RESPAWN_COULDOWN = 3 * 1000;
	static readonly IMMUNE_COULDOWN = 1 * 1000;

	static readonly FREEZE_TIME = 1.5 * 1000;

	dirX = 0;
	flags = 0;
	sessionAlive = true;
	respawnCouldown = -1;
	jumps = Player.JUMPS;
	stars = 0;
	mustReleaseStar: {x: number, y: number} | null = null;
	immuneCouldown = Player.IMMUNE_COULDOWN;
	powerup: powerUp_t = new powerups.Default();
	projectiles: Projectile[] = [];
	freezeCouldown = 0;


	constructor(x: number, y: number) {
		super(x, y, 0, 0);
	}

	
	runCouldowns(speed: number) {
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

		// Power
		if ((this.flags & flags.POWER) === 0) {
			this.flags &= ~flags.WAS_POWER;
			// Stop power
			powerups.stop(this.powerup, this);

		} else if ((this.flags & flags.WAS_POWER) === 0) {
			// Update flag
			this.flags |= flags.WAS_POWER;
		
			// Apply power
			powerups.start(this.powerup, this);
		} else {
			// Frame power
			powerups.use(this.powerup, this);
		}
	}




	releaseStar(map: GameMap, x: number, y: number) {
		// Release a star
		if (this.stars <= 0)
			return;

		this.stars--;
		map.stars.push(new Star(
			this.x,
			this.y,
			(this.flags & flags.LOOK_LEFT) ? -Star.SPEED : Star.SPEED,
			-Star.JUMP,
			Star.DEADTIME
		));
	}

	hit() {
		if (this.freezeCouldown > 0)
			return;

		if (this.immuneCouldown <= 0) {
			this.immuneCouldown = Player.IMMUNE_COULDOWN;
			this.mustReleaseStar = {x: this.x, y: this.y};
		}
	}
	
	kill() {
		this.mustReleaseStar = {x: this.x, y: this.y - Player.HEIGHT};	
		this.immuneCouldown = Player.IMMUNE_COULDOWN;
		this.respawnCouldown = Player.RESPAWN_COULDOWN;
		this.freezeCouldown = 0;
		this.x = 0;
		this.y = 0;
	}

	override resetJumps() {
		this.jumps = Player.JUMPS;
	}

	override onPlatform(
		behavior: EntityBehavior,
		prev_vx: number, prev_vy: number,
		block: Block
	) {
		if (block.getHit()) {
			this.hit();
		}
		
	}


	override getSize(): { w: number; h: number; } {
		return {w: Player.WIDTH, h: Player.HEIGHT};
	}

	

	onIce(dir: number) {
		if (this.freezeCouldown <= 0)
			this.freezeCouldown = Player.FREEZE_TIME;
	}

	onFire() {
		if (this.freezeCouldown > 0) {
			this.freezeCouldown = 0;
			return;
		}

		this.hit();
	}


	
}


export function checkPlayerCollisions(entity: Entity, players: Player[]) {
	const size = entity.getSize();
	let touched: Player | null = null;
	for (const player of players) {
		if (player.respawnCouldown > 0)
			continue;

		if (!collision.centeredRect_centeredRect(
			entity.x, entity.y, size.w, size.h,
			player.x, player.y, Player.WIDTH, Player.HEIGHT
		)) {
			continue;
		}

		if (touched !== null) {
			// Two players touch at the same time the star
			return null;
		}

		touched = player;
	}


	return touched;
}