import { Block } from "./Block";
import { GameMap } from "./GameMap";
import { Mod } from "./Mod";
import { newPowerUp as createPowerUp, PowerUpEntity } from "./PowerUp";

export namespace mods {
export class Size extends Mod {
	w: number;
	h: number;

    constructor(w: number, h: number) {
        super();
        this.w = w;
        this.h = h;
    }


    override getSize() {
        return {w: this.w, h: this.h};
    }
}


export class StarSpawner extends Mod {
    spawn: number;
    
    constructor(spawn: number) {
        super();
        this.spawn = spawn;
    }

    override getStarSpawn() {
        return this.spawn;
    }

    override getCollision() {
        return Mod.NO_COLL;
    }
}

export class Hit extends Mod {
    override getHit() {
        return true;
    }
}

export class PowerupSpawner extends Mod {
    readonly frequency: number;
    couldown = 0;

    constructor(frequency: number) {
        super();
        this.frequency = frequency;
    }

    override hasFrameToRun() {
        return true;
    }

    override runFrame(map: GameMap, block: Block, speed: number) {
        this.couldown -= speed;
        if (this.couldown > 0)
            return;

        this.couldown += this.frequency;

        const type = Math.floor(Math.random() * PowerUpEntity.TYPES_COUNT);
        map.powerups.push(createPowerUp(block.x, block.y, type));
    }
}


}