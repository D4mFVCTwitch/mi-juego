import Phaser from 'phaser'
import { PLAYER_CONFIG, COLORS } from '../config'
import type { Vector2 } from '../types'

export class Player extends Phaser.Physics.Arcade.Sprite {
  private health: number
  private maxHealth: number
  private speed: number
  private attackDamage: number
  private attackCooldown: number
  private lastAttackTime: number = 0
  private direction: Vector2 = { x: 0, y: 0 }
  private weaponGraphics!: Phaser.GameObjects.Graphics

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
  ) {
    super(scene, x, y)
    
    this.health = PLAYER_CONFIG.health
    this.maxHealth = PLAYER_CONFIG.maxHealth
    this.speed = PLAYER_CONFIG.speed
    this.attackDamage = PLAYER_CONFIG.attackDamage
    this.attackCooldown = PLAYER_CONFIG.attackCooldown

    // Crear sprite del jugador (círculo relleno)
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false })
    graphics.fillStyle(COLORS.player, 1)
    graphics.fillCircle(PLAYER_CONFIG.size / 2, PLAYER_CONFIG.size / 2, PLAYER_CONFIG.size / 2)
    graphics.generateTexture('player_texture', PLAYER_CONFIG.size, PLAYER_CONFIG.size)
    graphics.destroy()

    this.setTexture('player_texture')
    this.setBounce(0.2)
    this.setDrag(0.99)
    this.setMaxVelocity(this.speed, this.speed)

    scene.physics.world.enable(this)
    scene.add.existing(this)
  }

  update(cursors: Phaser.Input.Keyboard.CursorKeys | null, pointerX: number, pointerY: number) {
    // Reset velocidad
    this.setVelocity(0, 0)

    // Movimiento con WASD
    let moving = false
    const moveSpeed = this.speed

    if (cursors?.up.isDown || (this.scene.input.keyboard?.isDown('W') ?? false)) {
      this.setVelocityY(-moveSpeed)
      moving = true
    }
    if (cursors?.down.isDown || (this.scene.input.keyboard?.isDown('S') ?? false)) {
      this.setVelocityY(moveSpeed)
      moving = true
    }
    if (cursors?.left.isDown || (this.scene.input.keyboard?.isDown('A') ?? false)) {
      this.setVelocityX(-moveSpeed)
      moving = true
    }
    if (cursors?.right.isDown || (this.scene.input.keyboard?.isDown('D') ?? false)) {
      this.setVelocityX(moveSpeed)
      moving = true
    }

    // Normalizar diagonal movement
    if (this.body?.velocity) {
      const velocity = this.body.velocity as Phaser.Math.Vector2
      if (Math.abs(velocity.x) > 0 && Math.abs(velocity.y) > 0) {
        velocity.normalize().scale(moveSpeed)
      }
    }

    // Mirar hacia el mouse
    const dx = pointerX - this.x
    const dy = pointerY - this.y
    const angle = Math.atan2(dy, dx)
    this.setRotation(angle)
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

  getAttackCooldown(): number {
    return this.attackCooldown
  }

  getLastAttackTime(): number {
    return this.lastAttackTime
  }
}
