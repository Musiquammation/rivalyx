import { Block } from "./Block";
import { mods } from "./mods";
import { Player } from "./Player";
import { Star } from "./Star";

const STAR_COULDOWN = 5*1000;

export class GameMap {
    blocks: Block[] = [];
    stars: Star[] = [];
	players: Player[];

    private starCouldown = STAR_COULDOWN;

    constructor(players: Player[]) {
        this.players = players;
    }


    runTest() {
        this.blocks.push(new Block(-400, 200, [
            new mods.MSize(800, 100)
        ]));

        this.blocks.push(new Block(400, -200, [
            new mods.MSize(100, 500)
        ]));

        this.blocks.push(new Block(0, 0, [
            new mods.MStarSpawner(1)
        ]));
    }


    spawnStars(speed: number) {
        this.starCouldown -= speed;

        if (this.starCouldown < 0) {
            this.starCouldown += STAR_COULDOWN;

            // Select a star
            const starSpawners = new Array<{x: number, y: number, luck: number}>();

            let s = 0;
            for (const block of this.blocks) {
                const luck = block.getStarSpawn();
                if (luck > 0) {
                    s += luck;
                    starSpawners.push({x: block.x, y: block.y, luck});
                }
            }

            const rand = Math.floor(Math.random() * s);
            s = 0;
            for (const spawner of starSpawners) {
                s += spawner.luck;
                if (rand < s) {
                    this.stars.push(new Star(spawner.x, spawner.y));
                    break;
                }
            }
        }
    }
}

