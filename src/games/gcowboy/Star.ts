import { Entity, EntityBehavior } from "./Entity";

export class Star extends Entity {
    static readonly JUMP = 0.7;
    static readonly SPEED = 0.2;
    static readonly GRAVITY = 1 / 1000;
	static readonly WIDTH = 64;
	static readonly HEIGHT = 64;
	static readonly RAND_JUMP_MIN = .7;
	static readonly RAND_JUMP_MAX = 1.3;

    constructor(x: number, y: number) {
        super(x, y, Star.SPEED, -Star.JUMP);
    }


    override getSize() {
        return {w: Star.WIDTH, h: Star.HEIGHT};
    }

    override onPlatform(
        behavior: EntityBehavior,
        previousSpeed: { vx: number; vy: number; })
    {
        console.log(behavior);

        switch (behavior) {
        case EntityBehavior.IDLE_FLOOR:
        {
            const r = (Star.RAND_JUMP_MIN + Math.random() *
                (Star.RAND_JUMP_MAX - Star.RAND_JUMP_MIN));

            this.vy = -Star.JUMP * r;
            break;
        }

        case EntityBehavior.IDLE_LEFT:
        case EntityBehavior.IDLE_RIGHT:
        case EntityBehavior.CLIMB_LEFT:
        case EntityBehavior.CLIMB_RIGHT:
            this.vx = -previousSpeed.vx;
            break;
        }    
    }
}