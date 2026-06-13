import Phaser from 'phaser'
import { GAME_CONFIG, COLORS } from '../config'
import { Player } from '../entities/Player'
import { Enemy } from '../entities/Enemy'

export default class GameScene extends Phaser.Scene {
  private player!: Player
  private enemies: Enemy[] = []
  private cursors!: Phaser.Input.Keyboard.CursorKeys
  private attacking: boolean = false
  private healthText!: Phaser.GameObjects.Text
  private waveText!: Phaser.GameObjects.Text
  private waveCount: number = 1
  private enemiesKilled: number = 0
  private weaponGraphics!: Phaser.GameObjects.Graphics

  constructor() {
    super('GameScene')
  }

  preload() {
    // Recursos pueden cargar aquí
  }

  create() {
    this.setupInput()
    this.createPlayer()
    this.spawnEnemies(3)
    this.createUI()
    this.setupMouseInput()

    // Eventos de ataque
    this.input.on('pointerdown', () => {
      this.attacking = true
    })

    this.input.on('pointerup', () => {
      this.attacking = false
    })
  }

  private setupInput() {
    if (!this.input.keyboard) {
      console.error('Keyboard input not available')
      return
    }
    this.cursors = this.input.keyboard.createCursorKeys()
  }

  private createPlayer() {
    this.player = new Player(this, GAME_CONFIG.width / 2, GAME_CONFIG.height / 2)
  }

  private spawnEnemies(count: number) {
    // Limpiar enemigos previos
    this.enemies.forEach(e => e.destroy())
    this.enemies = []

    for (let i = 0; i < count; i++) {
      let x, y
      let validSpawn = false

      // Asegurar que los enemigos no aparezcan encima del jugador
      while (!validSpawn) {
        x = Phaser.Math.Between(50, GAME_CONFIG.width - 50)
        y = Phaser.Math.Between(50, GAME_CONFIG.height - 50)

        const dist = Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y)
        if (dist > 150) {
          validSpawn = true
        }
      }

      const enemy = new Enemy(this, x, y, this.player)
      this.enemies.push(enemy)
    }
  }

  private createUI() {
    // Salud del jugador
    this.healthText = this.add.text(16, 16, '', {
      font: '24px Arial',
      color: '#' + COLORS.health.toString(16).padStart(6, '0'),
    })
    this.healthText.setDepth(100)

    // Wave count
    this.waveText = this.add.text(GAME_CONFIG.width - 200, 16, '', {
      font: '20px Arial',
      color: '#' + COLORS.ui.toString(16).padStart(6, '0'),
    })
    this.waveText.setDepth(100)
  }

  private setupMouseInput() {
    // Rastrear posición del mouse para apuntar
  }

  update() {
    if (this.player.active) {
      // Actualizar jugador
      const pointerX = this.input.activePointer.x
      const pointerY = this.input.activePointer.y
      this.player.update(this.cursors, pointerX, pointerY)

      // Actualizar enemigos
      for (const enemy of this.enemies) {
        if (enemy.active) {
          enemy.update()

          // Detectar colisión con el jugador
          if (
            Phaser.Physics.Arcade.Distance(this.player, enemy as any) < 25
            && enemy.canAttack()
          ) {
            const isDead = this.player.damage(enemy.getAttackDamage())
            enemy.performAttack()

            if (isDead) {
              this.gameOver()
            }
          }
        }
      }

      // Sistema de ataque
      if (this.attacking && this.player.canAttack()) {
        this.performPlayerAttack()
        this.player.performAttack()
      }

      // Actualizar UI
      this.updateUI()

      // Comprobar victoria
      if (this.enemies.filter(e => e.active).length === 0) {
        this.nextWave()
      }

      // Mantener al jugador en los límites
      this.physics.world.wrap(this.player, 32)
      this.cameras.main.centerOn(this.player.x, this.player.y)
    }
  }

  private performPlayerAttack() {
    const attackRange = 50
    const pointerX = this.input.activePointer.x
    const pointerY = this.input.activePointer.y

    // Ajustar a posición de cámara
    const worldPointerX = pointerX + this.cameras.main.scrollX
    const worldPointerY = pointerY + this.cameras.main.scrollY

    for (const enemy of this.enemies) {
      if (!enemy.active) continue

      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        enemy.x,
        enemy.y,
      )

      if (dist < attackRange) {
        const isDead = enemy.damage(this.player.getAttackDamage())
        if (isDead) {
          enemy.destroy()
          this.enemiesKilled++
        }
      }
    }

    // Efecto visual del ataque (línea de ataque)
    this.showAttackEffect()
  }

  private showAttackEffect() {
    const angle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      this.input.activePointer.x + this.cameras.main.scrollX,
      this.input.activePointer.y + this.cameras.main.scrollY,
    )

    // Crear efecto visual
    const graphics = this.make.graphics({ x: this.player.x, y: this.player.y, add: false })
    graphics.lineStyle(3, COLORS.ui, 0.8)
    graphics.lineBetween(0, 0, Math.cos(angle) * 50, Math.sin(angle) * 50)

    graphics.generateTexture('slash_effect', 100, 100)
    const slash = this.add.image(this.player.x, this.player.y, 'slash_effect')
    slash.setRotation(angle)
    slash.setAlpha(0.8)

    graphics.destroy()

    this.tweens.add({
      targets: slash,
      alpha: 0,
      duration: 100,
      onComplete: () => {
        slash.destroy()
      },
    })
  }

  private updateUI() {
    const health = this.player.getHealth()
    const maxHealth = this.player.getMaxHealth()
    this.healthText.setText(`HP: ${health}/${maxHealth}`)

    this.waveText.setText(`Wave: ${this.waveCount}\nEnemies: ${this.enemies.filter(e => e.active).length}`)
  }

  private nextWave() {
    this.waveCount++
    this.spawnEnemies(Math.min(3 + this.waveCount, 8))

    // Mostrar notificación
    const waveNotif = this.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2,
      `Wave ${this.waveCount}!`,
      {
        font: '48px Arial',
        color: '#' + COLORS.ui.toString(16).padStart(6, '0'),
      },
    )
    waveNotif.setOrigin(0.5)
    waveNotif.setDepth(1000)

    this.tweens.add({
      targets: waveNotif,
      y: waveNotif.y - 50,
      alpha: 0,
      duration: 1500,
      ease: 'Quad.easeOut',
      onComplete: () => {
        waveNotif.destroy()
      },
    })
  }

  private gameOver() {
    this.scene.pause()

    const gameOverText = this.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2,
      `GAME OVER\nWaves Survived: ${this.waveCount - 1}\nEnemies Killed: ${this.enemiesKilled}`,
      {
        font: '36px Arial',
        color: '#' + COLORS.ui.toString(16).padStart(6, '0'),
        align: 'center',
      },
    )
    gameOverText.setOrigin(0.5)
    gameOverText.setDepth(1000)

    const restartText = this.add.text(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height / 2 + 100,
      'Click to restart',
      {
        font: '20px Arial',
        color: '#' + COLORS.health.toString(16).padStart(6, '0'),
      },
    )
    restartText.setOrigin(0.5)
    restartText.setDepth(1000)

    this.input.once('pointerdown', () => {
      this.scene.restart()
    })
  }
}
