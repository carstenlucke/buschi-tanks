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

            // Rule: Artillery can only move onto PLAIN or TRENCH
            if (unit.type === 'ARTILLERY' && (terrain.name !== 'Plain' && terrain.name !== 'Trench')) continue;

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
    if (unit.movedThisTurn) return false; // Can only move once per turn
    if (getUnitAt(state, toHex.q, toHex.r)) return false;
    return true;
}

export function applyMove(state, unitId, toHex) {
    const unit = state.units.find(u => u.id === unitId);
    if (unit) {
        unit.q = toHex.q;
        unit.r = toHex.r;
        unit.movedThisTurn = true;

        // Infantry and MG can Move AND Attack. Others end turn after move.
        const canAttackAfterMove = ['INFANTRY', 'MG'].includes(unit.type);
        if (!canAttackAfterMove) {
            unit.actedThisTurn = true;
        }
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
    attacker.actedThisTurn = true; // Attacking always ends the unit's turn

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
            u.movedThisTurn = false;
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

export function getTrenchTargets(state, unit, board) {
    if (unit.type !== 'ENGINEER') return [];
    if (unit.actedThisTurn) return [];

    const targets = [];
    // Current hex? User said Range 1. Usually implies adjacent. 
    // Let's include current hex + neighbors?
    // "Range 1" usually means distance 1.
    // Let's allow neighbors.

    const neighbors = getNeighbors(unit.q, unit.r);
    // Add current hex too?
    neighbors.push({ q: unit.q, r: unit.r });

    for (const hex of neighbors) {
        if (!inBounds(hex.q, hex.r, board.width, board.height)) continue;

        const terrain = board.getTerrain(hex.q, hex.r);
        // Can only build on Plain
        if (terrain.name !== 'Plain') continue;

        // Cannot build if occupied by another unit? 
        // Or can build under self (current hex)?
        // Can build under ally? 
        // Let's allow building on empty hex or self.
        const occupant = getUnitAt(state, hex.q, hex.r);
        if (occupant && occupant.id !== unit.id) continue;

        targets.push(hex);
    }
    return targets;
}

export function buildTrench(state, unit, targetHex, board) {
    // Validate again
    board.setTerrain(targetHex.q, targetHex.r, 'Trench');
    unit.actedThisTurn = true;
    checkWinCondition(state);
}

export function getUnitAt(state, q, r) {
    return state.units.find(u => u.q === q && u.r === r);
}

export function checkWinCondition(state) {
    if (state.gameOver) return;

    // Check Elimination (No units left)
    const blueCount = state.units.filter(u => u.side === SIDE.BLUE).length;
    const redCount = state.units.filter(u => u.side === SIDE.RED).length;

    if (blueCount === 0) {
        state.gameOver = true;
        state.winner = SIDE.RED;
        return;
    }
    if (redCount === 0) {
        state.gameOver = true;
        state.winner = SIDE.BLUE;
        return;
    }

    // Check Score
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

    // Check HQ Occupation
    const blueHQ = HQ_POSITIONS.BLUE;
    const redHQ = HQ_POSITIONS.RED;

    // Is there a RED unit on BLUE HQ?
    const unitOnBlueHQ = getUnitAt(state, blueHQ.q, blueHQ.r);
    if (unitOnBlueHQ && unitOnBlueHQ.side === SIDE.RED) {
        state.gameOver = true;
        state.winner = SIDE.RED;
        return;
    }

    // Is there a BLUE unit on RED HQ?
    const unitOnRedHQ = getUnitAt(state, redHQ.q, redHQ.r);
    if (unitOnRedHQ && unitOnRedHQ.side === SIDE.BLUE) {
        state.gameOver = true;
        state.winner = SIDE.BLUE;
        return;
    }
}
