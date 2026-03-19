import { Block } from "./Block";

export function drawBlock(ctx: CanvasRenderingContext2D, block: Block) {
    const size = block.getSize();
    if (!size) {
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(block.x, block.y, 10, 0, 2 * Math.PI);
        ctx.fill();
        return;
    }


    ctx.save();
    ctx.strokeStyle = block.getHit() ? "yellow" : "white";
    ctx.lineWidth = 10;
    ctx.strokeRect(block.x, block.y, size.w, size.h);
    ctx.restore();
}