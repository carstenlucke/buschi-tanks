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
    // New Logic: 
    // If unit can Move AND Attack (Inf/MG), we should try to Move into range/better position first, THEN Attack.
    // Ideally:
    // 1. Identify best target (Attack Prio).
    // 2. If in range, Attack? Or Move to better spot?
    //    For simple AI: If in range, Attack.
    //    If not in range, Move closer.
    // But now we can Move, THEN Attack.
    // So:
    // 1. Move towards Enemy/HQ.
    // 2. Attack if possible.

    // Step 1: Move (if not moved yet)
    if (!unit.movedThisTurn && !unit.actedThisTurn) {
        const moves = getReachableHexes(state, unit, board);
        if (moves.length > 0) {
            const blueHQ = HQ_POSITIONS.BLUE;

            // Heuristic:
            // - If I can attack someone from current spot, maybe don't move? 
            // - But maybe I can move to a BETTER spot (defensive terrain) and still attack?
            // - MVP: Move towards HQ as before.

            moves.sort((a, b) => {
                const distA = getDistance(a, blueHQ);
                const distB = getDistance(b, blueHQ);
                return distA - distB;
            });

            // Check if we shouldn't move? (e.g. we are on HQ or good spot)
            // Just move to best spot for now.
            const bestMove = moves[0];

            // Only move if it gets us closer? Or just always move?
            // Simple AI: Always move.
            console.log(`AI Unit ${unit.id} moving to (${bestMove.q},${bestMove.r})`);
            applyMove(state, unit.id, bestMove);
        }
    }

    // Step 2: Attack (if not acted yet - applyMove might have set acted for Artillery involved, but not Inf/MG)
    if (!unit.actedThisTurn) {
        const targets = getAttackableTargets(state, unit);
        if (targets.length > 0) {
            targets.sort((a, b) => {
                const unitA = state.units.find(u => u.id === a.unitId);
                const unitB = state.units.find(u => u.id === b.unitId);
                const valA = unitA ? TARGET_VALUE[unitA.type] : 0;
                const valB = unitB ? TARGET_VALUE[unitB.type] : 0;
                return valB - valA;
            });

            console.log(`AI Unit ${unit.id} attacking ${targets[0].unitId}`);
            applyAttack(state, unit.id, targets[0].unitId);
        }
    }
}
