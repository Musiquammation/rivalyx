export const TIME_PRECISION = 10;

export function getTimestamp() {
    return Math.floor(performance.now() * TIME_PRECISION) >>> 0;
}

