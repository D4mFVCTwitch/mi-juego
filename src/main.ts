import Phaser from 'phaser'
import { GAME_CONFIG, COLORS } from './config'
import GameScene from './scenes/GameScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.width,
  height: GAME_CONFIG.height,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [GameScene],
  backgroundColor: COLORS.background,
  render: {
    pixelArt: true,
    antialias: false,
  },
}

const game = new Phaser.Game(config)
