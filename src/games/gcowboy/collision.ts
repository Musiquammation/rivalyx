export namespace collision {
    export function rect_rect(
        x1: number, y1: number, w1: number, h1: number,
        x2: number, y2: number, w2: number, h2: number
    ) {
        return !(x1 + w1 <= x2 ||
                    x1 >= x2 + w2 ||
                    y1 + h1 <= y2 ||
                    y1 >= y2 + h2);
    }

    export function rect_centeredRect(
        rx: number, ry: number, rw: number, rh: number,
        cx: number, cy: number, cw: number, ch: number
    ) {
        const halfW = cw * 0.5;
        const halfH = ch * 0.5;

        const x2 = cx - halfW;
        const y2 = cy - halfH;

        return rect_rect(
            rx, ry, rw, rh,
            x2, y2, cw, ch
        );
    }

    export function centeredRect_centeredRect(
        cx1: number, cy1: number, cw1: number, ch1: number,
        cx2: number, cy2: number, cw2: number, ch2: number
    ) {
        const halfW1 = cw1 * 0.5;
        const halfH1 = ch1 * 0.5;
        const halfW2 = cw2 * 0.5;
        const halfH2 = ch2 * 0.5;

        return rect_rect(
            cx1 - halfW1, cy1 - halfH1, cw1, ch1,
            cx2 - halfW2, cy2 - halfH2, cw2, ch2
        );
    }
}