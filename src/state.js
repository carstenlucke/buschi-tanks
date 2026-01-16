export const SIDE = {
    BLUE: 'BLUE',
    RED: 'RED'
};

export const UNIT_TYPES = {
    INFANTRY: { name: 'Infantry', hp: 5, move: 2, range: 1, attack: 2, defense: 1 },
    MG: { name: 'MG', hp: 4, move: 2, range: 2, attack: 2, defense: 2 },
    ARTILLERY: { name: 'Artillery', hp: 3, move: 1, range: 4, attack: 3, defense: 0 },
    ENGINEER: { name: 'Engineer', hp: 4, move: 2, range: 1, attack: 1, defense: 1 }
};

export const HQ_POSITIONS = {
    BLUE: offsetToAxial(2, 10),
    RED: offsetToAxial(15, 10)
};

let nextUnitId = 1;

function offsetToAxial(col, row) {
    const q = col;
    const r = row - (col - (col & 1)) / 2;
    return { q, r };
}

export function createInitialState(seed = Date.now(), playerNames = { [SIDE.BLUE]: 'Blue', [SIDE.RED]: 'Red' }) {
    const state = {
        turnNumber: 1,
        activeSide: SIDE.BLUE,
        units: [],
        score: { [SIDE.BLUE]: 0, [SIDE.RED]: 0 },
        playerNames: playerNames,
        hqPositions: HQ_POSITIONS,
        rngSeed: seed,
        gameOver: false,
        winner: null
    };

    // Initialize Units near HQs - DOUBLED
    // Passing (col, row) directly to spawnUnit which now converts

    // Blue Units near (2,10)
    spawnUnit(state, SIDE.BLUE, 'INFANTRY', 1, 10);
    spawnUnit(state, SIDE.BLUE, 'INFANTRY', 3, 10);
    spawnUnit(state, SIDE.BLUE, 'INFANTRY', 2, 9);
    spawnUnit(state, SIDE.BLUE, 'INFANTRY', 2, 11);

    spawnUnit(state, SIDE.BLUE, 'MG', 1, 9);
    spawnUnit(state, SIDE.BLUE, 'MG', 3, 11);

    spawnUnit(state, SIDE.BLUE, 'ARTILLERY', 0, 10);
    spawnUnit(state, SIDE.BLUE, 'ARTILLERY', 4, 10);

    spawnUnit(state, SIDE.BLUE, 'ENGINEER', 1, 11);
    spawnUnit(state, SIDE.BLUE, 'ENGINEER', 3, 9);

    // Red Units near (15,10) - Ensure inside 0-17 width!
    spawnUnit(state, SIDE.RED, 'INFANTRY', 16, 10);
    spawnUnit(state, SIDE.RED, 'INFANTRY', 15, 12);
    spawnUnit(state, SIDE.RED, 'INFANTRY', 15, 9);
    spawnUnit(state, SIDE.RED, 'INFANTRY', 15, 11);

    spawnUnit(state, SIDE.RED, 'MG', 16, 9);
    spawnUnit(state, SIDE.RED, 'MG', 14, 11);

    spawnUnit(state, SIDE.RED, 'ARTILLERY', 17, 10); // Edge (17 is max index for width 18)
    spawnUnit(state, SIDE.RED, 'ARTILLERY', 13, 10);

    spawnUnit(state, SIDE.RED, 'ENGINEER', 16, 11);
    spawnUnit(state, SIDE.RED, 'ENGINEER', 14, 9);

    return state;
}

function spawnUnit(state, side, typeKey, col, row) {
    const type = UNIT_TYPES[typeKey];
    const { q, r } = offsetToAxial(col, row);
    state.units.push({
        id: nextUnitId++,
        side: side,
        type: typeKey, // Store key to ref stats later
        q: q,
        r: r,
        hp: type.hp,
        actedThisTurn: false
    });
}
