import { Block } from "./Block";
import { GameMap } from "./GameMap";

export abstract class Mod {
    static readonly NO_COLL = {
        right: false,
        up: false,
        left: false,
        down: false
    };

    getSize(): {w: number, h: number} | null {return null;} 

    getCollision(): {
        right: boolean,
        up: boolean
        left: boolean
        down: boolean
    } | null {return null;}


    getStarSpawn() {return 0;}
    
    getHit() {return false;}
    
    getKill() {return false;}

    hasFrameToRun() {return false;}

    runFrame(map: GameMap, block: Block, speed: number) {}
}

