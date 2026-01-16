import { Board } from './board.js';
import { createInitialState } from './state.js';

class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    create() {
        console.log('BootScene started');
        this.scene.start('MenuScene');
    }
}

import { SIDE } from './state.js';

class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const { width, height } = this.scale;

        // Title
        this.add.text(width / 2, height / 2 - 100, 'HEX STRATEGY', {
            fontSize: '48px', fill: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Singleplayer Button
        const spBtn = this.add.text(width / 2, height / 2, 'SINGLEPLAYER (vs AI)', {
            fontSize: '24px', fill: '#ffffff', backgroundColor: '#333333', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        spBtn.on('pointerdown', () => {
            this.showOverlay('AI');
        });

        // Multiplayer Button
        const mpBtn = this.add.text(width / 2, height / 2 + 70, 'MULTIPLAYER (Hotseat)', {
            fontSize: '24px', fill: '#ffffff', backgroundColor: '#552222', padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        mpBtn.on('pointerdown', () => {
            this.showOverlay('PVP');
        });

        // HTML Elements
        this.overlay = document.getElementById('menu-overlay');
        this.startBtn = document.getElementById('start-btn');
        this.cancelBtn = document.getElementById('cancel-btn');
        this.p1Input = document.getElementById('p1-name');
        this.p2Input = document.getElementById('p2-name');
        this.p2Group = document.getElementById('p2-group');

        this.startBtn.onclick = () => this.startGame();
        this.cancelBtn.onclick = () => this.hideOverlay();

        this.selectedMode = 'AI';
    }

    showOverlay(mode) {
        this.selectedMode = mode;
        this.overlay.style.display = 'flex';

        if (mode === 'AI') {
            this.p2Group.style.display = 'none';
        } else {
            this.p2Group.style.display = 'block';
        }
    }

    hideOverlay() {
        this.overlay.style.display = 'none';
    }

    startGame() {
        const p1Name = this.p1Input.value || 'Player 1';
        let p2Name = this.p2Input.value || 'Player 2';

        if (this.selectedMode === 'AI') {
            p2Name = 'Computer (AI)';
        }

        const names = {
            [SIDE.BLUE]: p1Name,
            [SIDE.RED]: p2Name
        };

        this.hideOverlay();
        this.scene.start('GameScene', { mode: this.selectedMode, names: names });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.board = null;
        this.state = null;
        this.gameMode = 'AI';
        this.playerNames = null;
    }

    init(data) {
        this.gameMode = data.mode || 'AI';
        this.playerNames = data.names || { [SIDE.BLUE]: 'Blue', [SIDE.RED]: 'Red' };
        console.log("Game Mode:", this.gameMode, "Names:", this.playerNames);
    }

    create() {
        // ... (existing code, but update board constructor call)
        this.add.text(20, 20, '', { // Removed 'Hello Hex'
            fontSize: '24px',
            fill: '#ffffff'
        });

        this.fpsText = this.add.text(20, 50, 'FPS: 0', {
            fontSize: '16px',
            fill: '#00ff00'
        });

        this.state = createInitialState(Date.now(), this.playerNames);
        // Pass game mode to board
        this.board = new Board(this, this.state, this.gameMode);
        this.board.create();
    }

    update(time, delta) {
        this.fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
    }
}

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [BootScene, MenuScene, GameScene]
};

const game = new Phaser.Game(config);
