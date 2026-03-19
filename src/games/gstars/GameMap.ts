import { Block } from "./Block";
import { collision } from "./collision";
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
    readonly isServer: boolean;
    
    gameBox = {
        left: -16000,
        top: -9000,
        right: 16000,
        bottom: 900
    };

    private starCouldown = STAR_COULDOWN;

    constructor(players: Player[], isServer: boolean) {
        this.players = players;
        this.isServer = isServer;
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
                    this.stars.push(new Star(spawner.x, spawner.y,
                        Star.SPEED, -Star.JUMP, Star.DEADTIME));
                        
                    break;
                }
            }
        }
    }


    collectPlayerDominations() {
		const dominations: {player: Player, list: Player[]}[] = [];

        for (const player of this.players) {
            if (player.vy < Player.DOMINATION_FORCE)
                continue; // player going to the top or with no enough strong

            const list = new Array<Player>();
            for (const victim of this.players) {
                if (victim === player || victim.respawnCouldown > 0)
                    continue;

                if (player.y + Player.HEIGHT/2 < victim.y - Player.HEIGHT/2) {
                    list.push(victim);
                }
            }


            if (list) {
                dominations.push({player, list});
            }
        }

        return dominations;
    }

    applyDominations(dominations: {player: Player, list: Player[]}[]) {
        for (const d of dominations) {
            const player = d.player;
            let jump = false;

            for (const victim of d.list) {
                if (collision.rect_centeredRect(
                    player.x, player.y, Player.WIDTH, Player.HEIGHT,
                    victim.x, victim.y, Player.WIDTH, Player.HEIGHT
                )) {
                    // Domination applies
                    jump = true;
                    victim.hit();
                }
            }

            if (jump) {
                player.vy *= -Player.DOMINATION_BOUNCE;
            }
        }
    }
}

