import { Block } from "./Block";
import { collision } from "./collision";
import { Entity, EntityBehavior } from "./Entity";
import { Player } from "./Player";

export class Star extends Entity {
    static readonly JUMP = 0.7;
    static readonly SPEED = 0.2;
    static readonly GRAVITY = 1 / 1000;
	static readonly WIDTH = 64;
	static readonly HEIGHT = 64;
	static readonly RAND_JUMP_MIN = .7;
	static readonly RAND_JUMP_MAX = 1.3;
	static readonly DEADTIME = 1000;

    deadtime: number;

    constructor(x: number, y: number, vx: number, vy: number, deadtime: number) {
        super(x, y, vx, vy);
        this.deadtime = deadtime;
    }


    override getSize() {
        return {w: Star.WIDTH, h: Star.HEIGHT};
    }

    override onPlatform(
        behavior: EntityBehavior,
        prev_vx: number,
        prev_vy: number,
        block: Block
    )
    {
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
            this.vx = -prev_vx;
            break;
        }    
    }


    checkPlayerCollisions(players: Player[]) {
        let touched: Player | null = null;
        for (const player of players) {
            if (!collision.centeredRect_centeredRect(
                this.x, this.y, Star.WIDTH, Star.HEIGHT,
                player.x, player.y, Player.WIDTH, Player.HEIGHT
            )) {
                continue;
            }

            if (touched !== null) {
                // Two players touch at the same time the star
                return -2;
            }

            touched = player;
        }


        if (!touched)
            return -1;

        touched.stars++;
        return touched.stars;
    }
}