export interface Vector2 {
  x: number
  y: number
}

export interface GameConfig {
  width: number
  height: number
  scale: number
}

export interface PlayerStats {
  health: number
  maxHealth: number
  speed: number
  attackDamage: number
  attackCooldown: number
}

export interface EnemyStats {
  health: number
  maxHealth: number
  speed: number
  detectionRange: number
  attackDamage: number
  attackCooldown: number
}
