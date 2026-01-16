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

class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const { width, height } = this.scale;

        const startText = this.add.text(width / 2, height / 2, 'START', {
            fontSize: '48px',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        startText.on('pointerdown', () => {
            this.scene.start('GameScene');
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.board = null;
        this.state = null;
    }

    create() {
        this.add.text(20, 20, 'Hello Hex', {
            fontSize: '24px',
            fill: '#ffffff'
        });

        this.fpsText = this.add.text(20, 50, 'FPS: 0', {
            fontSize: '16px',
            fill: '#00ff00'
        });

        this.state = createInitialState();
        this.board = new Board(this, this.state);
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
