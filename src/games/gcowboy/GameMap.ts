import { Block } from "./Block";
import { mods } from "./mods";
import { Player } from "./Player";
import { PowerUpEntity } from "./PowerUp";
import { Star } from "./Star";

const STAR_COULDOWN = 5*1000;

export class GameMap {
    blocks: Block[] = [];
    stars: Star[] = [];
	players: Player[];
    powerups: PowerUpEntity[] = [];
    
    gameBox = {
        left: -16000,
        top: -9000,
        right: 16000,
        bottom: 900
    };

    private starCouldown = STAR_COULDOWN;

    constructor(players: Player[]) {
        this.players = players;
    }


    runTest() {
        this.blocks.push(new Block(-400, 200, [
            new mods.Size(800, 100)
        ]));

        this.blocks.push(new Block(400, -200, [
            new mods.Size(100, 500)
        ]));

        this.blocks.push(new Block(0, 0, [
            new mods.StarSpawner(1)
        ]));

        this.blocks.push(new Block(-400, -200, [
            new mods.Hit(),
            new mods.Size(100, 100)
        ]));

        this.blocks.push(new Block(-400, -300, [
            new mods.PowerupSpawner(1000)
        ]))
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
                    this.stars.push(new Star(spawner.x, spawner.y,
                        Star.SPEED, -Star.JUMP, Star.DEADTIME));
                        
                    break;
                }
            }
        }
    }
}

