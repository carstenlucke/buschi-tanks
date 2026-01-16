import { SIDE, UNIT_TYPES, HQ_POSITIONS } from './state.js';
import { getReachableHexes, getAttackableTargets, applyMove, applyAttack, endTurn, checkWinCondition, getUnitAt } from './rules.js';
import { getDistance } from './hex.js';

const TARGET_VALUE = {
    'ARTILLERY': 4,
    'MG': 3,
    'INFANTRY': 2,
    'ENGINEER': 1
};

export async function executeRedTurn(state, board, onUpdate) {
    if (state.activeSide !== SIDE.RED || state.gameOver) return;

    console.log("AI Starting Turn...");

    // Get all Red units
    // We iterate one by one with a delay for visual effect? 
    // Or just valid logic. Prompt doesn't demand animation, but "Vibecoding" usually implies good UX.
    // I'll make it async with small delays.

    const units = state.units.filter(u => u.side === SIDE.RED);

    for (const unit of units) {
        if (state.gameOver) break;
        if (unit.hp <= 0) continue; // Dead

        await new Promise(r => setTimeout(r, 500)); // 500ms delay per unit

        processUnit(state, unit, board);
        if (onUpdate) onUpdate();
    }

    if (!state.gameOver) {
        await new Promise(r => setTimeout(r, 500));
        endTurn(state);
        if (onUpdate) onUpdate();
    }
}

function processUnit(state, unit, board) {
    // 1. Attack
    const targets = getAttackableTargets(state, unit);
    if (targets.length > 0) {
        // Pick best target
        // Sort descending by value
        targets.sort((a, b) => {
            const unitA = state.units.find(u => u.id === a.unitId);
            const unitB = state.units.find(u => u.id === b.unitId);
            const valA = unitA ? TARGET_VALUE[unitA.type] : 0;
            const valB = unitB ? TARGET_VALUE[unitB.type] : 0;
            return valB - valA;
        });

        console.log(`AI Unit ${unit.id} attacking ${targets[0].unitId}`);
        applyAttack(state, unit.id, targets[0].unitId);
        return;
    }

    // 2. Move (if didn't attack)
    // AI Logic: Move towards Blue HQ, then Attack if possible after move?
    // Rules say "actedThisTurn = true" after move. Can you attack after move?
    // Prompt 6: "applyMove... actedThisTurn = true".
    // Prompt 7: "applyAttack... actedThisTurn = true".
    // So you can only do ONE action per turn?
    // Prompt 12 says Engineer "Kostet Aktion".
    // Usually in these games: Move THEN Attack.
    // But Prompt 6 says "applyMove" sets "actedThisTurn = true".
    // This implies Move consumes the turn.
    // So if I move, I cannot attack.
    // Let's re-read Prompt 6: "applyMove(state, unitId, toHex) ... actedThisTurn = true".
    // Yes, Move ends unit turn.
    // Prompt 7: "applyAttack ... actedThisTurn = true".
    // Attack also ends unit turn.
    // So AI logic:
    // 1. Can I attack NOW? If yes, should I? (Yes, always attack if in range).
    // 2. If not, Move.
    // Wait, typical strategy: Move into range, THEN attack next turn.
    // Or if Move+Attack allowed: "Unit..actedThisTurn" usually strictly limits.
    // I will assume strict "One Action per Unit" based on code I wrote.

    const moves = getReachableHexes(state, unit, board);
    if (moves.length > 0) {
        const blueHQ = HQ_POSITIONS.BLUE;

        // Filter/Sort moves
        // Logic: specific desire to move to HQ?
        // Sort by distance to HQ
        moves.sort((a, b) => {
            const distA = getDistance(a, blueHQ);
            const distB = getDistance(b, blueHQ);

            // Secondary: Safety? (Avoid >= 2 enemies)
            // Let's stick to Distance for now as MVP.
            return distA - distB;
        });

        // Pick best move
        const bestMove = moves[0];
        console.log(`AI Unit ${unit.id} moving to (${bestMove.q},${bestMove.r})`);
        applyMove(state, unit.id, bestMove);
    }
}
