/**
 * Hex Grid Mathematics - Axial Coordinates (q, r)
 * Orientation: Flat-Top
 * Radius: 28px
 */

export const HEX_SIZE = 28;

// Flat-top orientation helper constants
const SQRT3 = Math.sqrt(3);

export function hexToPixel(q, r) {
    const x = HEX_SIZE * (3 / 2 * q);
    const y = HEX_SIZE * (SQRT3 / 2 * q + SQRT3 * r);
    return { x, y };
}

export function pixelToHex(x, y) {
    const q = (2 / 3 * x) / HEX_SIZE;
    const r = (-1 / 3 * x + SQRT3 / 3 * y) / HEX_SIZE;
    return hexRound(q, r);
}

function hexRound(fracQ, fracR) {
    let q = Math.round(fracQ);
    let r = Math.round(fracR);
    let s = Math.round(-fracQ - fracR);

    const qDiff = Math.abs(q - fracQ);
    const rDiff = Math.abs(r - fracR);
    const sDiff = Math.abs(s - (-fracQ - fracR));

    if (qDiff > rDiff && qDiff > sDiff) {
        q = -r - s;
    } else if (rDiff > sDiff) {
        r = -q - s;
    }

    return { q, r }; // s is implicit
}

export function getNeighbors(q, r) {
    // Neighbor directions for axial coordinates (flat-top)
    // +q, +r, -s=0... wait, standard directions
    const directions = [
        { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
        { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }
    ];
    return directions.map(d => ({ q: q + d.q, r: r + d.r }));
}

export function getDistance(a, b) {
    // a and b are {q, r} objects
    const vec = { q: a.q - b.q, r: a.r - b.r };
    return (Math.abs(vec.q) + Math.abs(vec.q + vec.r) + Math.abs(vec.r)) / 2;
}

export function inBounds(q, r, width, height) {
    // For a rectangular map on a hex grid, we usually use "offset" coords for bounds check 
    // or we just define valid Q,R ranges.
    // The prompt asks for 9x11 grid. 
    // Since we are using axial, plotting a rectangle is weird.
    // Usually we map axial to offset to check bounds easily.
    // "odd-q" vertical layout is common for flat-top.
    // Let's implement offset conversion strictly for bounds checking if needed, 
    // or just assume standard rectangular mapping.

    // Using "odd-q" conversion to check 0..width-1 and 0..height-1.
    const col = q;
    const row = r + (q - (q & 1)) / 2;

    return col >= 0 && col < width && row >= 0 && row < height;
}
