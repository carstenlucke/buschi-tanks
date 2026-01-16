import { hexToPixel, pixelToHex, HEX_SIZE, inBounds } from './hex.js';
import { getReachableHexes, applyMove, getUnitAt, getAttackableTargets, applyAttack, endTurn, checkAutoEndTurn, getTrenchTargets, buildTrench } from './rules.js';
import { SIDE, createInitialState, UNIT_TYPES } from './state.js';

const TERRAIN = {
    PLAIN: { name: 'Plain', cost: 1, color: 0x90EE90 },
    FOREST: { name: 'Forest', cost: 2, color: 0x228B22 },
    HILL: { name: 'Hill', cost: 2, color: 0x808080 },
    TRENCH: { name: 'Trench', cost: 1, color: 0x8B4513 }
};

export class Board {
    constructor(scene, state, gameMode = 'AI') {
        this.scene = scene;
        this.state = state;
        this.gameMode = gameMode; // AI or PVP
        this.width = 18; // Doubled from 9
        this.height = 22; // Doubled from 11
        this.hexGraphics = null;
        this.selectionGraphics = null;
        this.unitGroup = null;
        this.textGroup = null;
        this.gameOverGroup = null;
        this.actionBtn = null; // Engineer Action Btn

        this.selectedHex = null;
        this.selectedUnitId = null;
        this.reachableHexes = [];
        this.attackableTargets = [];
        this.coordText = null;
        this.turnText = null;
        this.mapData = new Map();
    }

    create() {
        this.hexGraphics = this.scene.add.graphics();
        this.selectionGraphics = this.scene.add.graphics();
        this.unitGroup = this.scene.add.group();
        this.textGroup = this.scene.add.group();
        this.gameOverGroup = this.scene.add.group();

        this.boardOffset = { x: HEX_SIZE + 10, y: HEX_SIZE + 35 };

        this.generateMap(this.state.rngSeed);
        this.drawGrid();
        this.createLegend();
        this.createUI(); // Initial creation
        this.drawUnits();

        // Setup Camera
        const cam = this.scene.cameras.main;
        const gridWidthPx = this.width * HEX_SIZE * 1.5 + 100;
        const gridHeightPx = this.height * HEX_SIZE * Math.sqrt(3) + 100;

        cam.setBounds(0, 0, Math.max(this.scene.scale.width, gridWidthPx), Math.max(this.scene.scale.height, gridHeightPx));

        // Handle Window Resize
        this.scene.scale.on('resize', (gameSize) => {
            const width = gameSize.width;
            const height = gameSize.height;
            cam.setBounds(0, 0, Math.max(width, gridWidthPx), Math.max(height, gridHeightPx));
            this.updateUIPositions(width, height);
        });

        // Keyboard input
        this.scene.input.keyboard.on('keydown-T', () => {
            this.handleAction();
        });

        // Draggable camera
        this.scene.input.on('pointermove', (p) => {
            if (!p.isDown) return;
            cam.scrollX -= (p.x - p.prevPosition.x) / cam.zoom;
            cam.scrollY -= (p.y - p.prevPosition.y) / cam.zoom;
        });

        this.scene.input.on('pointerdown', (pointer) => {
            if (this.state.gameOver) return;

            // Allow input if:
            // 1. Blue Turn (always allowed if not AI active)
            // 2. Red Turn AND PvP Mode
            const isRedTurn = this.state.activeSide === SIDE.RED;
            if (isRedTurn && this.gameMode === 'AI') return; // Block input during AI turn

            this.handlePointerDown(pointer);
        });
    }

    createUI() {
        // UI should be fixed to camera!
        this.turnText = this.scene.add.text(0, 0, '', {
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
        this.updateTurnText();

        this.btnContainer = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(100);

        const btnBg = this.scene.add.rectangle(0, 0, 100, 40, 0x444444)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.handleEndTurn());

        const btnText = this.scene.add.text(0, 0, 'WEITER', {
            fontSize: '16px', fill: '#ffffff'
        }).setOrigin(0.5);

        this.btnContainer.add([btnBg, btnText]);

        this.coordText = this.scene.add.text(10, 0, 'Selected: (-,-)', {
            fontSize: '16px',
            fill: '#ffffff'
        }).setScrollFactor(0).setDepth(100);

        // Action Button (Build Trench) - Initially hidden
        this.actionBtn = this.scene.add.container(0, 0);
        const actBg = this.scene.add.rectangle(0, 0, 120, 40, 0x008800)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.handleAction());
        const actText = this.scene.add.text(0, 0, 'Build Trench', { fontSize: '14px', fill: '#fff' }).setOrigin(0.5);
        this.actionBtn.add([actBg, actText]);
        this.actionBtn.setVisible(false);
        this.actionBtn.setScrollFactor(0).setDepth(100);

        this.textGroup.add(this.turnText);

        // Position everything initially
        this.updateUIPositions(this.scene.scale.width, this.scene.scale.height);
    }

    updateUIPositions(width, height) {
        // Turn Text: Top Center
        this.turnText.setPosition(width / 2, 30);

        // WEITER Button: Top Right (SAFE AREA)
        // Moved from bottom-right (where mobile bars are) to top-right
        this.btnContainer.setPosition(width - 70, 40);

        // Info Text: Bottom Left
        this.coordText.setPosition(10, height - 30);

        // Action Button: Bottom Right (Moved up to be safe)
        // Originally at width-200, height-40.
        // Let's ensure it's above the bottom bar area.
        this.actionBtn.setPosition(width - 80, height - 100);
    }

    updateTurnText() {
        if (this.state.gameOver) {
            const winnerName = this.state.playerNames[this.state.winner];
            this.turnText.setText(`GAME OVER! Winner: ${winnerName}`);
            this.turnText.setColor('#ffff00');
        } else {
            const activeName = this.state.playerNames[this.state.activeSide];
            const nameBlue = this.state.playerNames[SIDE.BLUE];
            const nameRed = this.state.playerNames[SIDE.RED];
            this.turnText.setText(`Turn ${this.state.turnNumber} - ${activeName} (Score: ${nameBlue}:${this.state.score.BLUE} ${nameRed}:${this.state.score.RED})`);
            this.turnText.setColor(this.state.activeSide === SIDE.BLUE ? '#4444ff' : '#ff4444');
        }
    }

    handleEndTurn() {
        if (this.state.gameOver) return;

        // Singleplayer: Only Blue can end turn manually (Red is AI)
        // Multiplayer: Both can end turn
        const isRedTurn = this.state.activeSide === SIDE.RED;

        if (this.gameMode === 'AI' && isRedTurn) return; // Wait for AI

        endTurn(this.state);
        this.onTurnChange();
    }

    handleAction() {
        // Engineer Action: Build Trench
        if (!this.selectedUnitId) return;
        const unit = this.state.units.find(u => u.id === this.selectedUnitId);
        if (!unit || unit.type !== 'ENGINEER') return;

        // Toggle Build Mode
        if (this.buildMode) {
            this.buildMode = false;
            this.buildTargets = [];
            this.drawHighlights();
            this.coordText.setText(`Order Canceled.`);
        } else {
            const targets = getTrenchTargets(this.state, unit, this);
            if (targets.length > 0) {
                this.buildMode = true;
                this.buildTargets = targets;
                this.drawHighlights();
                this.coordText.setText(`Select target for Trench.`);
            } else {
                this.coordText.setText(`No valid targets for Trench.`);
            }
        }
    }

    onTurnChange() {
        this.deselect();
        this.updateTurnText();
        this.drawUnits();

        if (this.state.gameOver) {
            this.showGameOver();
            return;
        }

        // Only run AI if Singleplayer AND Red Turn
        if (this.gameMode === 'AI' && this.state.activeSide === SIDE.RED) {
            console.log("Starting AI turn...");
            import('./ai.js').then(module => {
                module.executeRedTurn(this.state, this, () => {
                    this.drawUnits();
                    this.updateTurnText();
                    if (this.state.gameOver) this.showGameOver();
                });
            });
        }
    }

    generateMap(seed) {
        const rng = this.mulberry32(seed);
        for (let q = 0; q < this.width; q++) {
            for (let r = 0; r < this.height; r++) {
                const rand = rng();
                let type = TERRAIN.PLAIN;
                if (rand < 0.2) type = TERRAIN.FOREST;
                else if (rand < 0.35) type = TERRAIN.HILL;
                else if (rand < 0.40) type = TERRAIN.TRENCH;

                // Store using Axial Coordinates as key
                // Convert Odd-Q Offset to Axial
                const axialQ = q;
                const axialR = r - (q - (q & 1)) / 2;

                this.mapData.set(`${axialQ},${axialR}`, type);
            }
        }
    }

    setTerrain(q, r, typeName) {
        // Find terrain object by name
        let terrain = TERRAIN.PLAIN;
        if (typeName === 'Trench') terrain = TERRAIN.TRENCH;
        // ... support others if needed
        this.mapData.set(`${q},${r}`, terrain);
    }

    mulberry32(a) {
        return function () {
            var t = a += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    }

    getTerrain(q, r) {
        return this.mapData.get(`${q},${r}`) || TERRAIN.PLAIN;
    }

    drawGrid() {
        this.hexGraphics.clear();
        for (let q = 0; q < this.width; q++) {
            for (let r = 0; r < this.height; r++) {
                if (!inBounds(q, r, this.width, this.height)) continue;

                const frameCol = q;
                const frameRow = r;
                const axialQ = frameCol;
                const axialR = frameRow - (frameCol - (frameCol & 1)) / 2;

                // Use Axial for lookup
                const terrain = this.getTerrain(axialQ, axialR);

                this.hexGraphics.lineStyle(2, 0xaaaaaa, 1.0);
                this.hexGraphics.fillStyle(terrain.color, 1.0);

                const pos = hexToPixel(axialQ, axialR);
                this.drawHex(this.hexGraphics, pos.x + this.boardOffset.x, pos.y + this.boardOffset.y, true);
            }
        }
    }

    drawHex(graphics, x, y, fill = false) {
        const points = [];
        for (let i = 0; i < 6; i++) {
            const angle_deg = 60 * i;
            const angle_rad = Math.PI / 180 * angle_deg;
            points.push({
                x: x + HEX_SIZE * Math.cos(angle_rad),
                y: y + HEX_SIZE * Math.sin(angle_rad)
            });
        }
        if (fill) graphics.fillPoints(points, true);
        graphics.strokePoints(points, true);
    }

    drawUnits() {
        this.unitGroup.clear(true, true);
        this.state.units.forEach(unit => {
            const pos = hexToPixel(unit.q, unit.r);
            const x = pos.x + this.boardOffset.x;
            const y = pos.y + this.boardOffset.y;

            const color = unit.side === SIDE.BLUE ? 0x0000FF : 0xFF0000;
            const circle = this.scene.add.circle(x, y, HEX_SIZE * 0.6, color);
            circle.setStrokeStyle(2, 0xffffff);

            const label = unit.type.charAt(0);
            const text = this.scene.add.text(x, y, label, {
                fontSize: '16px',
                fill: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            const hpText = this.scene.add.text(x, y + 10, unit.hp.toString(), {
                fontSize: '10px',
                fill: '#ffffff'
            }).setOrigin(0.5);

            if (unit.actedThisTurn) {
                circle.setAlpha(0.5);
            }

            this.unitGroup.add(circle);
            this.unitGroup.add(text);
            this.unitGroup.add(hpText);
        });
    }

    handlePointerDown(pointer) {
        if (this.state.gameOver) return;

        const x = pointer.x - this.boardOffset.x;
        const y = pointer.y - this.boardOffset.y;
        const hex = pixelToHex(x, y);
        console.log(`Click at (${x},${y}) -> Hex (${hex.q}, ${hex.r})`);

        if (!inBounds(hex.q, hex.r, this.width, this.height)) {
            console.log("Out of bounds!");
            this.deselect();
            return;
        }

        // Handle build mode selection
        if (this.buildMode && this.selectedUnitId) {
            const targetHex = this.buildTargets.find(h => h.q === hex.q && h.r === hex.r);
            if (targetHex) {
                const unit = this.state.units.find(u => u.id === this.selectedUnitId);
                if (unit) {
                    buildTrench(this.state, unit, targetHex);
                    this.afterAction();
                }
                return;
            }
        }

        const isReachable = this.reachableHexes.some(h => h.q === hex.q && h.r === hex.r);
        if (this.selectedUnitId && isReachable) {
            applyMove(this.state, this.selectedUnitId, hex);
            this.afterAction();
            return;
        }

        const isAttackable = this.attackableTargets.find(h => h.q === hex.q && h.r === hex.r);
        if (this.selectedUnitId && isAttackable) {
            applyAttack(this.state, this.selectedUnitId, isAttackable.unitId);
            this.afterAction();
            return;
        }

        const clickedUnit = getUnitAt(this.state, hex.q, hex.r);
        console.log("Clicked Unit:", clickedUnit);

        if (clickedUnit) {
            if (clickedUnit.side === this.state.activeSide) {
                this.selectUnit(clickedUnit);
            } else {
                this.selectHex(hex);
                this.coordText.setText(`Enemy: ${clickedUnit.type} (${clickedUnit.hp}HP)`);
            }
        } else {
            this.selectHex(hex);
        }
    }

    afterAction() {
        this.deselect();
        this.drawUnits();

        this.updateTurnText();

        if (this.state.gameOver) {
            this.showGameOver();
            return;
        }

        if (checkAutoEndTurn(this.state)) {
            this.onTurnChange();
        }
    }

    selectUnit(unit) {
        // Reset build mode when selecting a new unit
        this.buildMode = false;
        this.buildTargets = [];

        if (unit.actedThisTurn) {
            this.coordText.setText(`Unit: ${unit.type} (Moved)`);
            this.selectHex(unit);
            return;
        }

        if (this.state.activeSide !== unit.side) return;

        this.selectedUnitId = unit.id;
        this.selectedHex = { q: unit.q, r: unit.r };

        this.reachableHexes = getReachableHexes(this.state, unit, this);
        this.attackableTargets = getAttackableTargets(this.state, unit);

        this.drawSelection(this.selectedHex);
        this.drawHighlights();

        const stats = UNIT_TYPES[unit.type];
        this.coordText.setText(`${unit.type} (${unit.hp}HP) - Move:${stats.move} Rng:${stats.range} Atk:${stats.attack} Def:${stats.defense}`);

        // Engineer special
        if (unit.type === 'ENGINEER' && getTrenchTargets(this.state, unit, this).length > 0) {
            this.actionBtn.setVisible(true);
        } else {
            this.actionBtn.setVisible(false);
        }
    }

    selectHex(hex) {
        this.deselect();
        this.selectedHex = hex;
        this.drawSelection(hex);
        const terrain = this.getTerrain(hex.q, hex.r);
        this.coordText.setText(`Selected: (${hex.q}, ${hex.r}) - ${terrain.name}`);
    }

    deselect() {
        this.selectedUnitId = null;
        this.selectedHex = null;
        this.reachableHexes = [];
        this.attackableTargets = [];
        this.buildMode = false; // Reset build mode
        this.buildTargets = []; // Clear build targets
        this.selectionGraphics.clear();
        this.coordText.setText('Selected: (-,-)');
        if (this.actionBtn) this.actionBtn.setVisible(false);
    }

    drawSelection(hex) {
        this.selectionGraphics.clear();
        this.selectionGraphics.lineStyle(4, 0xffff00, 1);
        const pos = hexToPixel(hex.q, hex.r);
        this.drawHex(this.selectionGraphics, pos.x + this.boardOffset.x, pos.y + this.boardOffset.y);
    }

    drawHighlights() {
        this.selectionGraphics.clear(); // Clear all previous highlights
        this.selectionGraphics.lineStyle(0);

        // Move Highlights (Cyan)
        this.selectionGraphics.fillStyle(0x00ffff, 0.3);
        this.reachableHexes.forEach(h => {
            const pos = hexToPixel(h.q, h.r);
            this.drawHex(this.selectionGraphics, pos.x + this.boardOffset.x, pos.y + this.boardOffset.y, true);
        });

        // Attack Highlights (Red)
        this.selectionGraphics.fillStyle(0xff0000, 0.4);
        this.attackableTargets.forEach(h => {
            const pos = hexToPixel(h.q, h.r);
            this.drawHex(this.selectionGraphics, pos.x + this.boardOffset.x, pos.y + this.boardOffset.y, true);
        });

        // Build Highlights (Orange)
        if (this.buildMode) {
            this.selectionGraphics.fillStyle(0xFF8800, 0.5); // Orange for differentiation
            this.buildTargets.forEach(h => {
                const pos = hexToPixel(h.q, h.r);
                this.drawHex(this.selectionGraphics, pos.x + this.boardOffset.x, pos.y + this.boardOffset.y, true);
            });
        }

        // Selection Outline
        if (this.selectedHex) {
            this.selectionGraphics.lineStyle(4, 0xffff00, 1);
            const pos = hexToPixel(this.selectedHex.q, this.selectedHex.r);
            this.drawHex(this.selectionGraphics, pos.x + this.boardOffset.x, pos.y + this.boardOffset.y, false);
        }
    }

    createLegend() {
        const legendX = this.scene.scale.width - 120;
        let legendY = 60;

        const bg = this.scene.add.graphics();
        bg.fillStyle(0x333333, 0.8);
        bg.fillRoundedRect(legendX - 10, legendY - 10, 120, 120, 10);

        Object.values(TERRAIN).forEach(t => {
            const circle = this.scene.add.circle(legendX, legendY + 5, 8, t.color);
            this.scene.add.text(legendX + 15, legendY - 3, t.name, { fontSize: '12px', fill: '#fff' });
            legendY += 25;
        });
    }

    showGameOver() {
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;
        this.gameOverGroup.clear(true, true);

        const bg = this.scene.add.rectangle(width / 2, height / 2, width * 0.8, 200, 0x000000, 0.8);

        const text = this.scene.add.text(width / 2, height / 2 - 20, `${this.state.winner} WINS!`, {
            fontSize: '32px',
            fill: this.state.winner === SIDE.BLUE ? '#4444ff' : '#ff4444',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const restartBtn = this.scene.add.rectangle(width / 2, height / 2 + 40, 150, 40, 0x444444)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.restartGame());

        const restartText = this.scene.add.text(width / 2, height / 2 + 40, 'RESTART', {
            fontSize: '18px', fill: '#ffffff'
        }).setOrigin(0.5);

        this.gameOverGroup.add(bg);
        this.gameOverGroup.add(text);
        this.gameOverGroup.add(restartBtn);
        this.gameOverGroup.add(restartText);
    }

    restartGame() {
        this.scene.scene.restart();
    }
}
