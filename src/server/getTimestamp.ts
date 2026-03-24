export const TIME_PRECISION = 1;

export function getTimestamp() {
    return Math.floor(performance.now())  >>> 0;
}

