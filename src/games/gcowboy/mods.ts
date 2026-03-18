import { Mod } from "./Mod";

export namespace mods {
export class MSize extends Mod {
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


export class MStarSpawner extends Mod {
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

}