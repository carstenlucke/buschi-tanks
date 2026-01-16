import { getNeighbors, inBounds, getDistance } from './hex.js';
import { UNIT_TYPES, SIDE, HQ_POSITIONS } from './state.js';

// Terrain Costs
const TERRAIN_COST = {
    'Plain': 1,
    'Forest': 2,
    'Hill': 2,
    'Trench': 1
};

export function getReachableHexes(state, unit, board) {
    if (unit.actedThisTurn) return [];

    const maxMove = UNIT_TYPES[unit.type].move;
    const frontier = [];
    frontier.push({ q: unit.q, r: unit.r, cost: 0 });

    const reachable = [];
    const costSoFar = new Map();
    costSoFar.set(`${unit.q},${unit.r}`, 0);

    while (frontier.length > 0) {
        frontier.sort((a, b) => a.cost - b.cost);
        const current = frontier.shift();

        if (current.cost > maxMove) continue;

        if (current.q !== unit.q || current.r !== unit.r) {
            reachable.push({ q: current.q, r: current.r });
        }

        const neighbors = getNeighbors(current.q, current.r);
        for (const next of neighbors) {
            if (!inBounds(next.q, next.r, board.width, board.height)) continue;

            const occupant = getUnitAt(state, next.q, next.r);
            if (occupant) continue;

            const terrain = board.getTerrain(next.q, next.r);
            const moveCost = TERRAIN_COST[terrain.name] || 1;

            const newCost = current.cost + moveCost;
            if (newCost <= maxMove) {
                const key = `${next.q},${next.r}`;
                if (!costSoFar.has(key) || newCost < costSoFar.get(key)) {
                    costSoFar.set(key, newCost);
                    frontier.push({ q: next.q, r: next.r, cost: newCost });
                }
            }
        }
    }

    return reachable;
}

export function canMove(state, unit, toHex) {
    if (unit.actedThisTurn) return false;
    if (getUnitAt(state, toHex.q, toHex.r)) return false;
    return true;
}

export function applyMove(state, unitId, toHex) {
    const unit = state.units.find(u => u.id === unitId);
    if (unit) {
        unit.q = toHex.q;
        unit.r = toHex.r;
        unit.actedThisTurn = true;
    }
    checkWinCondition(state);
}

export function getAttackableTargets(state, unit) {
    if (unit.actedThisTurn) return [];

    const range = UNIT_TYPES[unit.type].range;
    const targets = [];

    state.units.forEach(other => {
        if (other.side !== unit.side) {
            const dist = getDistance(unit, other);
            if (dist <= range) {
                targets.push({ q: other.q, r: other.r, unitId: other.id });
            }
        }
    });

    return targets;
}

export function applyAttack(state, attackerId, targetId) {
    const attacker = state.units.find(u => u.id === attackerId);
    const target = state.units.find(u => u.id === targetId);

    if (!attacker || !target) return;

    const atkStats = UNIT_TYPES[attacker.type];
    const defStats = UNIT_TYPES[target.type];

    const bonus = Math.round(Math.random());
    const damage = Math.max(0, atkStats.attack - defStats.defense) + bonus;

    target.hp -= damage;
    attacker.actedThisTurn = true;

    console.log(`Attack: ${attacker.type} -> ${target.type} (DMG: ${damage}, HP left: ${target.hp})`);

    if (target.hp <= 0) {
        state.units = state.units.filter(u => u.id !== target.id);
        state.score[attacker.side] += 2;
        console.log("Target eliminated! +2 Score");
    }
    checkWinCondition(state);
}

export function endTurn(state) {
    state.activeSide = state.activeSide === SIDE.BLUE ? SIDE.RED : SIDE.BLUE;

    state.units.forEach(u => {
        if (u.side === state.activeSide) {
            u.actedThisTurn = false;
        }
    });

    if (state.activeSide === SIDE.BLUE) {
        state.turnNumber++;
    }
    console.log(`Turn Ended. Now Active: ${state.activeSide}, Turn: ${state.turnNumber}`);
}

export function checkAutoEndTurn(state) {
    if (state.activeSide === SIDE.BLUE && !state.gameOver) {
        const blueUnits = state.units.filter(u => u.side === SIDE.BLUE);
        if (blueUnits.length > 0 && blueUnits.every(u => u.actedThisTurn)) {
            endTurn(state);
            return true;
        }
    }
    return false;
}

export function canBuildTrench(state, unit, board) {
    if (unit.type !== 'ENGINEER') return false;
    if (unit.actedThisTurn) return false;
    const terrain = board.getTerrain(unit.q, unit.r);
    // Not on Hill or existing Trench
    if (terrain.name === 'Hill' || terrain.name === 'Trench') return false;
    return true;
}

export function buildTrench(state, unit, board) {
    if (!canBuildTrench(state, unit, board)) return;
    board.setTerrain(unit.q, unit.r, 'Trench');
    unit.actedThisTurn = true;
    checkWinCondition(state);
}

export function getUnitAt(state, q, r) {
    return state.units.find(u => u.q === q && u.r === r);
}

export function checkWinCondition(state) {
    if (state.gameOver) return;

    if (state.score[SIDE.BLUE] >= 10) {
        state.gameOver = true;
        state.winner = SIDE.BLUE;
        return;
    }
    if (state.score[SIDE.RED] >= 10) {
        state.gameOver = true;
        state.winner = SIDE.RED;
        return;
    }

    const blueHQ = HQ_POSITIONS.BLUE;
    const redHQ = HQ_POSITIONS.RED;

    const unitOnBlueHQ = getUnitAt(state, blueHQ.q, blueHQ.r);
    if (unitOnBlueHQ && unitOnBlueHQ.side === SIDE.RED) {
        state.gameOver = true;
        state.winner = SIDE.RED;
        return;
    }

    const unitOnRedHQ = getUnitAt(state, redHQ.q, redHQ.r);
    if (unitOnRedHQ && unitOnRedHQ.side === SIDE.BLUE) {
        state.gameOver = true;
        state.winner = SIDE.BLUE;
        return;
    }
}
