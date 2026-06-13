import type { GameConfig } from './types'

export const GAME_CONFIG: GameConfig = {
  width: 800,
  height: 600,
  scale: 1,
}

export const PLAYER_CONFIG = {
  health: 100,
  maxHealth: 100,
  speed: 200,
  attackDamage: 10,
  attackCooldown: 0.3,
  size: 20,
}

export const ENEMY_CONFIG = {
  health: 30,
  maxHealth: 30,
  speed: 80,
  detectionRange: 200,
  attackDamage: 5,
  attackCooldown: 1,
  size: 16,
}

export const COLORS = {
  player: 0xff6b9d,
  enemy: 0xff006e,
  background: 0x0a0e27,
  ui: 0xfb5607,
  health: 0x06ffa5,
}
