export const SIDE = {
    BLUE: 'BLUE',
    RED: 'RED'
};

export const UNIT_TYPES = {
    INFANTRY: { name: 'Infantry', hp: 5, move: 2, range: 1, attack: 2, defense: 1 },
    MG: { name: 'MG', hp: 4, move: 1, range: 2, attack: 2, defense: 2 },
    ARTILLERY: { name: 'Artillery', hp: 3, move: 1, range: 3, attack: 3, defense: 0 },
    ENGINEER: { name: 'Engineer', hp: 4, move: 2, range: 1, attack: 1, defense: 1 } // Special: Builds Trench
};

export const HQ_POSITIONS = {
    BLUE: { q: 1, r: 5 },
    RED: { q: 7, r: 5 }
};

let nextUnitId = 1;

export function createInitialState(seed = Date.now()) {
    const state = {
        turnNumber: 1,
        activeSide: SIDE.BLUE,
        units: [],
        score: { [SIDE.BLUE]: 0, [SIDE.RED]: 0 },
        hqPositions: HQ_POSITIONS,
        rngSeed: seed,
        gameOver: false,
        winner: null
    };

    // Initialize Units near HQs
    // Blue Units near (1,5)
    spawnUnit(state, SIDE.BLUE, 'INFANTRY', 0, 5);
    spawnUnit(state, SIDE.BLUE, 'MG', 1, 4);
    spawnUnit(state, SIDE.BLUE, 'ARTILLERY', 0, 6);
    spawnUnit(state, SIDE.BLUE, 'ENGINEER', 1, 6); // slightly adjusted positions to be near

    // Red Units near (7,5)
    spawnUnit(state, SIDE.RED, 'INFANTRY', 8, 5);
    spawnUnit(state, SIDE.RED, 'MG', 7, 4);
    spawnUnit(state, SIDE.RED, 'ARTILLERY', 8, 4); // Adjusted for valid grid spots
    spawnUnit(state, SIDE.RED, 'ENGINEER', 7, 6);

    return state;
}

function spawnUnit(state, side, typeKey, q, r) {
    const type = UNIT_TYPES[typeKey];
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
