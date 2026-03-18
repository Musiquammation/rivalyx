import { collision } from "./collision";
import { GameMap } from "./GameMap";

export enum EntityBehavior {
	NONE,

	JUMP_FLOOR,
	JUMP_CEILING,
	JUMP_LEFT,
	JUMP_RIGHT,
		
	IDLE_FLOOR,
	IDLE_CEILING,
	IDLE_LEFT,
	IDLE_RIGHT,
		
	WALK_FLOOR,
	WALK_CEILING,

	CLIMB_LEFT,
	CLIMB_RIGHT,
}


export abstract class Entity {
    x: number;
    y: number;
    vx: number;
    vy: number;

    constructor(x: number, y: number, vx: number, vy: number) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
    }


    abstract getSize(): {w: number, h: number};
    resetJumps() {}
    onPlatform(
        behavior: EntityBehavior,
        previousSpeed: {vx: number, vy: number}
    ) {}


    applyCollisions(map: GameMap, speed: number) {
        const es = this.getSize();
		const lp = {x: this.x, y: this.y};
        const previousSpeed = {vx: this.vx, vy: this.vy};
		const np = {
			x: this.x + this.vx * speed,
			y: this.y + this.vy * speed,
		};

		// Apply ontouch events
		for (const block of map.blocks) {
			const size = block.getSize();
			if (!size)
				continue;

			/*const collObj = block.getCollision();
			if (!coll.right && !coll.up && !coll.left && !coll.down)
				continue;*/

			const coll = collision.rect_centeredRect(
				block.x, block.y, size.w, size.h,
				np.x, np.y, es.w, es.h
			);

			if (coll) {
				block.onTouch(this);
			}
		}


		// Resolve collisions
		for (const block of map.blocks) {
			const size = block.getSize();
			if (!size)
				continue;

			const collObj = block.getCollision();
			if (
				!collObj.right &&
				!collObj.up &&
				!collObj.left &&
				!collObj.down
			) {continue;}

			if (!collision.rect_centeredRect(
				block.x, block.y, size.w, size.h,
				np.x, np.y, es.w, es.h
			)) {
				continue;
			}


			let behavior = EntityBehavior.NONE;


			// Floor
			if (collObj.up && lp.y <= block.y - es.h/2) {
				np.y = block.y - es.h/2;
				this.vy = 0;
				this.resetJumps();
				behavior = EntityBehavior.IDLE_FLOOR;
			}

			// Ceiling
			if (collObj.down && lp.y >= block.y + size.h + es.h/2) {
				np.y = block.y + size.h + es.h/2;
				this.vy = 0;
				behavior = EntityBehavior.IDLE_CEILING;
			}


			// Left
			if (collObj.right && lp.x <= block.x - es.w/2) {
				np.x = block.x - es.w/2;
				if (this.vy > 0 && this.vx > 0) {
					this.vy = 0;
					this.resetJumps();
					behavior = EntityBehavior.CLIMB_LEFT;
				} else {
					behavior = EntityBehavior.IDLE_LEFT;
				}

				this.vx = 0;
			}

			// Right
			if (collObj.left && lp.x >= block.x + size.w + es.w/2) {
				np.x = block.x + size.w + es.w/2;
				if (this.vy > 0 && this.vx < 0) {
					this.vy = 0;
					this.resetJumps();
					behavior = EntityBehavior.CLIMB_RIGHT;
				} else {
					behavior = EntityBehavior.IDLE_RIGHT;
				}

				this.vx = 0;
			}


			this.onPlatform(behavior, previousSpeed);

			if (!collision.rect_centeredRect(
				block.x, block.y, size.w, size.h,
				np.x, np.y, es.w, es.h
			)) {
				continue;
			}


			/**
			 * Player is stillres inside the block: collision must be resolved.
			 * This situations occurs face to a moving block
			*/

			console.warn("TODO: player inside a block");
		}


		this.x = np.x;
		this.y = np.y;


	}
}