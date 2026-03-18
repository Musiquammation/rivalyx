import { Entity } from "./Entity";
import { GameMap } from "./GameMap";
import { Mod } from "./Mod";
import { mods } from "./mods";
import { Player } from "./Player";

export class Block {
	x: number;
	y: number;
	mods: Mod[];
	containsFrameToRun: boolean;

    static readonly DEFAULT_COLLISION = {
        right: true,
        up: true,
        left: true,
        down: true
    };

	constructor(x: number, y: number, mods: Mod[]) {
		this.x = x;
		this.y = y;
		this.mods = mods;

		this.containsFrameToRun = false;
		for (let m of mods) {
			if (m.hasFrameToRun()) {
				this.containsFrameToRun = true;
				break;
			}
		}
	}

	getSize() {
		for (let m of this.mods) {
			const s = m.getSize();
			if (s) {
                return s;
            }
		}

		return null;
	}

    getCollision() {
        for (let m of this.mods) {
			const s = m.getCollision();
			if (s) {
                return s;
            }
		}

        return Block.DEFAULT_COLLISION;
    }

	getStarSpawn() {
		let s = 0;
		for (let m of this.mods) {
			s = Math.max(s, m.getStarSpawn());
		}

        return s;
	}

	getHit() {
		for (let m of this.mods)
			if (m.getHit())
				return true;

        return false;
	}

	
	runFrame(map: GameMap, speed: number) {
		if (!this.containsFrameToRun)
			return;

		for (let m of this.mods)
			m.runFrame(map, this, speed);

	}

	onTouch(player: Entity) {
		
	}
}

