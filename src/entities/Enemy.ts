import Phaser from 'phaser'
import { ENEMY_CONFIG, COLORS } from '../config'
import type { Vector2 } from '../types'
import type { Player } from './Player'

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  private health: number
  private maxHealth: number
  private speed: number
  private detectionRange: number
  private attackDamage: number
  private attackCooldown: number
  private lastAttackTime: number = 0
  private player: Player
  private target?: Vector2

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    player: Player,
  ) {
    super(scene, x, y)

    this.health = ENEMY_CONFIG.health
    this.maxHealth = ENEMY_CONFIG.maxHealth
    this.speed = ENEMY_CONFIG.speed
    this.detectionRange = ENEMY_CONFIG.detectionRange
    this.attackDamage = ENEMY_CONFIG.attackDamage
    this.attackCooldown = ENEMY_CONFIG.attackCooldown
    this.player = player

    // Crear sprite del enemigo (círculo relleno)
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false })
    graphics.fillStyle(COLORS.enemy, 1)
    graphics.fillCircle(ENEMY_CONFIG.size / 2, ENEMY_CONFIG.size / 2, ENEMY_CONFIG.size / 2)
    graphics.generateTexture('enemy_texture', ENEMY_CONFIG.size, ENEMY_CONFIG.size)
    graphics.destroy()

    this.setTexture('enemy_texture')
    this.setBounce(0.2)
    this.setDrag(0.99)
    this.setMaxVelocity(this.speed, this.speed)

    scene.physics.world.enable(this)
    scene.add.existing(this)
  }

  update() {
    this.setVelocity(0, 0)

    const distToPlayer = Phaser.Math.Distance.Between(
      this.x,
      this.y,
      this.player.x,
      this.player.y,
    )

    if (distToPlayer < this.detectionRange) {
      // Perseguir al jugador
      const angle = Phaser.Math.Angle.Between(this.x, this.y, this.player.x, this.player.y)
      this.setVelocity(Math.cos(angle) * this.speed, Math.sin(angle) * this.speed)

      // Rotar hacia el jugador
      this.setRotation(angle)
    } else {
      // Patrulla aleatoria
      if (!this.target) {
        this.generateRandomTarget()
      }

      const distToTarget = Phaser.Math.Distance.Between(this.x, this.y, this.target!.x, this.target!.y)

      if (distToTarget < 10) {
        this.generateRandomTarget()
      } else {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.target!.x, this.target!.y)
        this.setVelocity(Math.cos(angle) * (this.speed * 0.5), Math.sin(angle) * (this.speed * 0.5))
        this.setRotation(angle)
      }
    }
  }

  private generateRandomTarget() {
    const offset = 150
    this.target = {
      x: this.x + Phaser.Math.Between(-offset, offset),
      y: this.y + Phaser.Math.Between(-offset, offset),
    }
  }

  damage(amount: number) {
    this.health -= amount
    if (this.health < 0) this.health = 0
    return this.health <= 0
  }

  getHealth(): number {
    return this.health
  }

  getMaxHealth(): number {
    return this.maxHealth
  }

  canAttack(): boolean {
    return this.scene.time.now - this.lastAttackTime > this.attackCooldown * 1000
  }

  performAttack(): void {
    this.lastAttackTime = this.scene.time.now
  }

  getAttackDamage(): number {
    return this.attackDamage
  }

  canDetectPlayer(): boolean {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, this.player.x, this.player.y)
    return dist < this.detectionRange
  }
}
