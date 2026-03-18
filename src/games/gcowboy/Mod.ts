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
    
}

