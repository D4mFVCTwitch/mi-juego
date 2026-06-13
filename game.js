// Game Constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const COLORS = {
    background: '#532804',
    player: '#ffffff',
    playerGun: '#8a8a8a',
    enemy: '#2b1a0d',
    enemyStroke: '#0b0b0b',
    ui: '#381404',
    health: '#7e0909',
};

const PLAYER_CONFIG = {
    speed: 250,
    size: 12,
    attackDamage: 15,
    attackCooldown: 0.25,
    maxHealth: 100,
};

const ENEMY_CONFIG = {
    speed: 100,
    size: 10,
    attackDamage: 8,
    attackCooldown: 1.2,
    maxHealth: 25,
    detectionRange: 220,
};

const ROOM_TYPES = [
    'normal',
    'trap',
    'normal',
    'heal',
    'normal',
    'trap',
    'normal',
    'heal',
    'normal',
    'boss',
];

const BULLET_CONFIG = {
    speed: 700,
    size: 4,
    damage: 25,
    color: '#fff5c3',
    lifetime: 1.2,
};

const BOSS_CONFIG = {
    speed: 40,
    size: 28,
    attackCooldown: 1.5,
    maxHealth: 260,
    bulletSpeed: 280,
    bulletDamage: 12,
    burstCount: 12,
};

const DOOR_WIDTH = 40;
const DOOR_HEIGHT = 120;
const DOOR_X = GAME_WIDTH - DOOR_WIDTH;
const DOOR_Y = GAME_HEIGHT / 2 - DOOR_HEIGHT / 2;
const SHOP_DOOR_WIDTH = 60;
const SHOP_DOOR_HEIGHT = 16;
const SHOP_DOOR_X = GAME_WIDTH / 2 - SHOP_DOOR_WIDTH / 2;
const SHOP_DOOR_Y = 0;

const HEAL_AMOUNT = 30;
const TRAP_DAMAGE_PER_SECOND = 10;
const SHOP_HEALTH_COST = 10;
const SHOP_DAMAGE_COST = 8;
const HEALTH_UPGRADE_AMOUNT = 10;
const MAX_PLAYER_HEALTH = 200;
const SECRET_COST = 90;

// Game State
class GameState {
    constructor() {
        this.room = 1;
        this.wave = 1;
        this.enemiesKilled = 0;
        this.coins = 0;
        this.gameOver = false;
        this.paused = false;
        this.roomCleared = false;
        this.roomType = ROOM_TYPES[0];
        this.waveStartTime = 0;
        this.healUsed = false;
        this.inShopRoom = false;
        this.shopBoughtThisRoom = false;
        this.coinAwardedThisRoom = false;
        this.shopMessage = '';
        this.everBought = false;
        this.secretPurchased = false;
        this.secretAvailable = false;
        this.secretUsed = false;
        this.secretEnding = false;
        this.previousRoomType = null;
    }
}

// Entity Base Class
class Entity {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.velX = 0;
        this.velY = 0;
    }

    update(dt) {
        this.x += this.velX * dt;
        this.y += this.velY * dt;

        // Bounds
        this.x = Math.max(this.size, Math.min(GAME_WIDTH - this.size, this.x));
        this.y = Math.max(this.size, Math.min(GAME_HEIGHT - this.size, this.y));
    }

    draw(ctx) {}
}

// Player Class
class Player extends Entity {
    constructor(x, y) {
        super(x, y, PLAYER_CONFIG.size);
        this.health = PLAYER_CONFIG.maxHealth;
        this.maxHealth = PLAYER_CONFIG.maxHealth;
        this.speed = PLAYER_CONFIG.speed;
        this.lastAttackTime = -1;
        this.angle = 0;
        this.weaponLevel = 0;
        this.attackCooldown = PLAYER_CONFIG.attackCooldown;
    }

    handleInput(keys, mouseX, mouseY) {
        this.velX = 0;
        this.velY = 0;

        if (keys['w'] || keys['W'] || keys['ArrowUp']) this.velY = -this.speed;
        if (keys['s'] || keys['S'] || keys['ArrowDown']) this.velY = this.speed;
        if (keys['a'] || keys['A'] || keys['ArrowLeft']) this.velX = -this.speed;
        if (keys['d'] || keys['D'] || keys['ArrowRight']) this.velX = this.speed;

        // Normalize diagonal movement
        const magnitude = Math.sqrt(this.velX ** 2 + this.velY ** 2);
        if (magnitude > 0) {
            this.velX = (this.velX / magnitude) * this.speed;
            this.velY = (this.velY / magnitude) * this.speed;
        }

        // Aim at mouse
        this.angle = Math.atan2(mouseY - this.y, mouseX - this.x);
    }

    canAttack() {
        return Date.now() - this.lastAttackTime > this.attackCooldown * 1000;
    }

    performAttack() {
        this.lastAttackTime = Date.now();
    }

    update(dt) {
        // Custom update to allow long secret run world
        const game = window.game;
        if (game && game.secretRunActive) {
            this.x += this.velX * dt;
            this.y += this.velY * dt;
            // clamp vertical position only
            this.y = Math.max(this.size, Math.min(GAME_HEIGHT - this.size, this.y));
            // allow x up to secretRunLength
            this.x = Math.max(this.size, Math.min(game.secretRunLength - this.size, this.x));
        } else {
            super.update(dt);
        }
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
    }

    draw(ctx) {
        // Draw zero-shaped body
        ctx.lineWidth = 4;
        ctx.strokeStyle = COLORS.player;
        ctx.fillStyle = COLORS.background;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = COLORS.player;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Draw pistol shaped like an L
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = COLORS.playerGun;
        ctx.fillRect(this.size * 0.6, -3, this.size * 1.2, 6);
        ctx.fillRect(this.size * 0.2, 4, this.size * 0.6, 8);
        ctx.restore();
    }
}

// Enemy Class
class Enemy extends Entity {
    constructor(x, y, player) {
        super(x, y, ENEMY_CONFIG.size);
        this.health = ENEMY_CONFIG.maxHealth;
        this.maxHealth = ENEMY_CONFIG.maxHealth;
        this.speed = ENEMY_CONFIG.speed;
        this.player = player;
        this.lastAttackTime = -1;
        this.targetX = x;
        this.targetY = y;
        this.patrolTimer = Math.random() * 5;
    }

    update(dt) {
        const distToPlayer = Math.hypot(this.player.x - this.x, this.player.y - this.y);

        if (distToPlayer < ENEMY_CONFIG.detectionRange) {
            // Chase player
            const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
            this.velX = Math.cos(angle) * this.speed;
            this.velY = Math.sin(angle) * this.speed;
        } else {
            // Patrol
            const distToTarget = Math.hypot(this.targetX - this.x, this.targetY - this.y);

            if (distToTarget < 20 || this.patrolTimer <= 0) {
                this.targetX = this.x + (Math.random() - 0.5) * 300;
                this.targetY = this.y + (Math.random() - 0.5) * 300;
                this.targetX = Math.max(30, Math.min(GAME_WIDTH - 30, this.targetX));
                this.targetY = Math.max(30, Math.min(GAME_HEIGHT - 30, this.targetY));
                this.patrolTimer = 3;
            }

            const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
            this.velX = Math.cos(angle) * this.speed * 0.6;
            this.velY = Math.sin(angle) * this.speed * 0.6;
            this.patrolTimer -= dt;
        }

        // Use alternate world width for secret run
        const game = window.game;
        if (game && game.secretRunActive) {
            this.x += this.velX * dt;
            this.y += this.velY * dt;
            // bounds based on secret run length
            const maxX = game.secretRunLength - this.size;
            this.x = Math.max(this.size, Math.min(maxX, this.x));
            this.y = Math.max(this.size, Math.min(GAME_HEIGHT - this.size, this.y));
        } else {
            super.update(dt);
        }

        // During secret run, allow enemies to shoot at player
        if (game && game.secretRunActive) {
            if (this.canAttack()) {
                const angleToPlayer = Math.atan2(this.player.y - this.y, this.player.x - this.x);
                game.enemyBullets.push(new EnemyBullet(this.x, this.y, angleToPlayer));
                this.performAttack();
            }
        }
    }

    canAttack() {
        return Date.now() - this.lastAttackTime > ENEMY_CONFIG.attackCooldown * 1000;
    }

    performAttack() {
        this.lastAttackTime = Date.now();
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
    }

    draw(ctx) {
        // Draw zero-shaped enemy body
        ctx.lineWidth = 4;
        ctx.strokeStyle = COLORS.enemyStroke;
        ctx.fillStyle = COLORS.background;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = this.color || COLORS.enemy;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        const barWidth = this.size * 2.2;
        const barHeight = 2;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.size - 6;

        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }
}

class Bullet extends Entity {
    constructor(x, y, angle, damage) {
        super(x, y, BULLET_CONFIG.size);
        this.angle = angle;
        this.speed = BULLET_CONFIG.speed;
        this.damage = damage;
        this.life = BULLET_CONFIG.lifetime;
        this.dead = false;
    }

    update(dt) {
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
        const worldW = (window.game && window.game.secretRunActive) ? window.game.secretRunLength : GAME_WIDTH;
        if (this.x < -10 || this.x > worldW + 10 || this.y < -10 || this.y > GAME_HEIGHT + 10) {
            this.dead = true;
        }
    }

    draw(ctx) {
        ctx.fillStyle = BULLET_CONFIG.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Boss extends Entity {
    constructor(x, y, player) {
        super(x, y, BOSS_CONFIG.size);
        this.player = player;
        this.health = BOSS_CONFIG.maxHealth;
        this.maxHealth = BOSS_CONFIG.maxHealth;
        this.speed = BOSS_CONFIG.speed;
        this.lastAttackTime = -1;
        this.phase = 0;
        this.angle = 0;
        this.burstTimer = 0;
        this.pattern = 0;
    }

    update(dt) {
        const angle = Math.atan2(this.player.y - this.y, this.player.x - this.x);
        this.angle = angle;

        const targetDistance = 180;
        const distToPlayer = Math.hypot(this.player.x - this.x, this.player.y - this.y);
        const moveSpeed = this.speed * (distToPlayer > targetDistance ? 1 : -1);

        this.velX = Math.cos(angle) * moveSpeed;
        this.velY = Math.sin(angle) * moveSpeed;
        super.update(dt);

        this.burstTimer -= dt;
    }

    tryShoot() {
        const bullets = [];
        if (this.burstTimer > 0) return bullets;
        const cooldown = (this.attackCooldown !== undefined) ? this.attackCooldown : BOSS_CONFIG.attackCooldown;
        if (Date.now() - this.lastAttackTime < cooldown * 1000) return bullets;

        this.lastAttackTime = Date.now();
        this.burstTimer = 0.75;

        const hpPct = this.health / this.maxHealth;
        let pattern = this.pattern;
        this.pattern = (this.pattern + 1) % 4;

        if (pattern === 0) {
            const n = Math.floor((this.burstCount || BOSS_CONFIG.burstCount) * 1.2);
            for (let i = 0; i < n; i++) {
                const angle = (Math.PI * 2 / n) * i + Math.random() * 0.12;
                bullets.push(new EnemyBullet(this.x, this.y, angle));
            }
            const angleToPlayer = Math.atan2(this.player.y - this.y, this.player.x - this.x);
            bullets.push(new EnemyBullet(this.x, this.y, angleToPlayer));
            bullets.push(new EnemyBullet(this.x, this.y, angleToPlayer + 0.1));
            bullets.push(new EnemyBullet(this.x, this.y, angleToPlayer - 0.1));
        } else if (pattern === 1) {
            const n = Math.floor((this.burstCount || BOSS_CONFIG.burstCount) * 1.5);
            for (let i = 0; i < n; i++) {
                const angle = (Math.PI * 2 / n) * i + Math.random() * 0.2;
                bullets.push(new EnemyBullet(this.x, this.y, angle));
            }
            const angleToPlayer = Math.atan2(this.player.y - this.y, this.player.x - this.x);
            for (let s = -2; s <= 2; s++) {
                bullets.push(new EnemyBullet(this.x, this.y, angleToPlayer + s * 0.08));
            }
        } else if (pattern === 2) {
            const n = Math.floor((this.burstCount || BOSS_CONFIG.burstCount) * 1.8);
            const base = Date.now() / 400;
            for (let i = 0; i < n; i++) {
                const angle = (Math.PI * 2 / n) * i + base % (Math.PI * 2);
                bullets.push(new EnemyBullet(this.x, this.y, angle));
            }
        } else {
            const angleToPlayer = Math.atan2(this.player.y - this.y, this.player.x - this.x);
            for (let s = -3; s <= 3; s++) {
                bullets.push(new EnemyBullet(this.x, this.y, angleToPlayer + s * 0.1));
            }
            const n = Math.floor((this.burstCount || BOSS_CONFIG.burstCount) * 1.1);
            for (let i = 0; i < n; i++) {
                const angle = (Math.PI * 2 / n) * i + Math.random() * 0.18;
                bullets.push(new EnemyBullet(this.x, this.y, angle));
            }
        }

        if (hpPct < 0.4) {
            this.burstTimer = 1.0;
        }

        return bullets;
    }

    draw(ctx) {
        ctx.lineWidth = 5;
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = '#2e2e2e';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.55, 0, Math.PI * 2);
        ctx.fill();

        const eyeX = this.x + Math.cos(this.angle) * 10;
        const eyeY = this.y + Math.sin(this.angle) * 10;
        ctx.fillStyle = '#ffdd00';
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}

class EnemyBullet extends Entity {
    constructor(x, y, angle) {
        super(x, y, BULLET_CONFIG.size);
        this.angle = angle;
        this.speed = BOSS_CONFIG.bulletSpeed;
        this.damage = BOSS_CONFIG.bulletDamage;
        this.life = BULLET_CONFIG.lifetime * 1.5;
        this.dead = false;
    }

    update(dt) {
        this.x += Math.cos(this.angle) * this.speed * dt;
        this.y += Math.sin(this.angle) * this.speed * dt;
        this.life -= dt;
        if (this.life <= 0) this.dead = true;
        const worldW = (window.game && window.game.secretRunActive) ? window.game.secretRunLength : GAME_WIDTH;
        if (this.x < -10 || this.x > worldW + 10 || this.y < -10 || this.y > GAME_HEIGHT + 10) {
            this.dead = true;
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#5f3706';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Game Class
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.scaleX = 1;
        this.scaleY = 1;
        this.player = new Player(GAME_WIDTH / 2, GAME_HEIGHT / 2);
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.boss = null;
        this.gameState = new GameState();
        this.keys = {};
        this.mouseX = GAME_WIDTH / 2;
        this.mouseY = GAME_HEIGHT / 2;
        this.lastFrameTime = Date.now();
        this.waveTextAlpha = 0;
        this.waveTextTime = 0;
        this.trapZones = [];
        this.healZone = null;
        this.secretScene = null;
        this.secretObstacles = [];
        this.secretFinalDoor = null;
        this.easterDoor = null;
        this.secretEndingText = '';
        this.secretEndingSubtitle = '';

        window.game = this;
        this.setupEventListeners();
        this.updateCanvasSize();
        this.spawnEnemies();
        this.gameLoop();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.gameState.gameOver) {
                this.gameState.paused = !this.gameState.paused;
                return;
            }
            // Toggle fullscreen with F11
            if (e.key === 'F11') {
                e.preventDefault();
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().then(() => this.updateCanvasSize());
                } else {
                    document.exitFullscreen().then(() => this.updateCanvasSize());
                }
                return;
            }
            this.keys[e.key] = true;
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        document.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            // Map mouse to game coordinates considering canvas scale
            this.mouseX = (e.clientX - rect.left) / this.scaleX;
            this.mouseY = (e.clientY - rect.top) / this.scaleY;
        });

        document.addEventListener('mousedown', (e) => {
            if (this.gameState.gameOver) {
                this.restart();
                return;
            }
            if (!this.gameState.paused && e.button === 0) {
                const rect = this.canvas.getBoundingClientRect();
                const clickX = (e.clientX - rect.left) / this.scaleX;
                const clickY = (e.clientY - rect.top) / this.scaleY;
                const shopClicked = this.handleShopClick(clickX, clickY);
                if (!shopClicked && !this.gameState.shopOpen) {
                    this.shootBullet();
                }
            }
        });

        this.canvas.addEventListener('click', (e) => {
            if (this.gameState.gameOver) {
                this.restart();
            }
        });

        // When fullscreen changes, update canvas size
        document.addEventListener('fullscreenchange', () => this.updateCanvasSize());
    }

    updateCanvasSize() {
        if (document.fullscreenElement) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        } else {
            this.canvas.width = GAME_WIDTH;
            this.canvas.height = GAME_HEIGHT;
        }
        this.scaleX = this.canvas.width / GAME_WIDTH;
        this.scaleY = this.canvas.height / GAME_HEIGHT;
    }

    spawnEnemies() {
        this.enemies = [];
        this.enemyBullets = [];
        this.bullets = [];
        this.trapZones = [];
        this.healZone = null;
        this.gameState.roomCleared = false;
        this.gameState.healUsed = false;
        this.gameState.roomType = this.gameState.inShopRoom ? 'shop' : ROOM_TYPES[this.gameState.room - 1];

        if (this.gameState.roomType === 'boss') {
            this.spawnBoss();
        } else if (this.gameState.roomType === 'shop') {
            this.boss = null;
            this.gameState.roomCleared = true;
            this.gameState.shopOpen = true;
            this.gameState.shopBoughtThisRoom = false;
            this.gameState.coinAwardedThisRoom = false;
            this.gameState.shopMessage = 'Compra mejoras o regresa a pelear';
            this.shopButtonBounds = null;
            this.gameState.secretAvailable = this.gameState.room === 9 && !this.gameState.secretPurchased;
        } else {
            this.boss = null;
            this.gameState.roomCleared = false;
            this.gameState.coinAwardedThisRoom = false;
            this.gameState.shopOpen = false;
            this.gameState.shopBoughtThisRoom = false;
            this.gameState.shopMessage = '';
            this.shopButtonBounds = null;
            this.gameState.secretAvailable = false;
            const count = Math.min(4 + this.gameState.room * 2, 16);
            for (let i = 0; i < count; i++) {
                let validSpawn = false;
                let enemyX, enemyY;

                while (!validSpawn) {
                    enemyX = Math.random() * (GAME_WIDTH - 160) + 60;
                    enemyY = Math.random() * (GAME_HEIGHT - 160) + 60;

                    const dist = Math.hypot(enemyX - this.player.x, enemyY - this.player.y);
                    const nearDoor = enemyX + ENEMY_CONFIG.size > DOOR_X - 30;
                    if (dist > 150 && !nearDoor) validSpawn = true;
                }

                const en = new Enemy(enemyX, enemyY, this.player);
                const roomMul = 1 + (this.gameState.room - 1) * 0.18;
                const dmgMul = 1 + (this.gameState.room - 1) * 0.14;
                en.maxHealth = Math.max(8, Math.round(ENEMY_CONFIG.maxHealth * roomMul));
                en.health = en.maxHealth;
                en.speed = ENEMY_CONFIG.speed * (1 + (this.gameState.room - 1) * 0.04);
                en.attackDamage = Math.max(2, Math.round(ENEMY_CONFIG.attackDamage * dmgMul));
                this.enemies.push(en);
            }

            if (this.gameState.roomType === 'trap') {
                this.createTrapZones();
            }

            if (this.gameState.roomType === 'heal') {
                this.createHealZone();
            }
        }

        this.waveTextAlpha = 1;
        this.waveTextTime = 1.5;
    }

    spawnBoss() {
        this.boss = new Boss(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, this.player);
        // Name and scale up boss for final fight
        this.boss.name = 'Luis Lara';
        const bossMul = 3.0;
        this.boss.maxHealth = Math.round(this.boss.maxHealth * bossMul);
        this.boss.health = this.boss.maxHealth;
        this.boss.burstCount = Math.max(BOSS_CONFIG.burstCount, Math.floor(BOSS_CONFIG.burstCount * 2.2));
        this.boss.attackCooldown = Math.max(1.0, BOSS_CONFIG.attackCooldown * 1.1);
        this.boss.pattern = 0;
        this.enemies = [];
    }

    createTrapZones() {
        this.trapZones = [
            { x: 120, y: 140, width: 180, height: 80 },
            { x: 420, y: 340, width: 180, height: 80 },
        ];
    }

    createHealZone() {
        this.healZone = { x: 320, y: 240, width: 160, height: 120 };
    }

    handleSecretObstacles(dt) {
        if (this.secretScene !== 'street') return;
        for (const obs of this.secretObstacles) {
            if (this.checkRectCollision(this.player, obs)) {
                this.player.x -= this.player.velX * dt;
                this.player.y -= this.player.velY * dt;
                this.player.velX = 0;
                this.player.velY = 0;
                break;
            }
        }
    }

    checkRectCollision(entity, rect) {
        const closestX = Math.max(rect.x, Math.min(entity.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(entity.y, rect.y + rect.height));
        const dx = entity.x - closestX;
        const dy = entity.y - closestY;
        return dx * dx + dy * dy < entity.size * entity.size;
    }

    drawSecretStreet() {
        // street sky and road
        this.ctx.fillStyle = '#262626';
        this.ctx.fillRect(0, 0, this.secretRunLength, GAME_HEIGHT);
        this.ctx.fillStyle = '#3f3f3f';
        this.ctx.fillRect(0, 140, this.secretRunLength, 320);
        this.ctx.fillStyle = '#e9e9e9';
        for (let x = 0; x < this.secretRunLength; x += 120) {
            this.ctx.fillRect(x, GAME_HEIGHT / 2 - 6, 60, 8);
        }

        // obstacles
        this.ctx.fillStyle = '#444444';
        for (const obs of this.secretObstacles) {
            this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        }

        // final house door
        if (this.secretFinalDoor) {
            const d = this.secretFinalDoor;
            this.ctx.fillStyle = '#2d2f4e';
            this.ctx.fillRect(d.x, d.y, d.width, d.height);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '18px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(d.label, d.x + d.width / 2, d.y + d.height / 2 + 6);
        }
    }

    drawEasterDanceRoom() {
        this.ctx.fillStyle = '#5c0000';
        this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        for (let i = 0; i < 12; i++) {
            const px = 80 + (i % 6) * 120;
            const py = 120 + Math.floor(i / 6) * 220;
            this.ctx.fillStyle = '#ff4d4d';
            this.ctx.beginPath();
            this.ctx.arc(px, py, 24, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#330000';
            this.ctx.fillRect(px - 12, py + 28, 24, 42);
        }
        if (this.easterDoor) {
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(this.easterDoor.x, this.easterDoor.y, this.easterDoor.width, this.easterDoor.height);
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(this.easterDoor.x, this.easterDoor.y, this.easterDoor.width, this.easterDoor.height);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.easterDoor.label, this.easterDoor.x + this.easterDoor.width / 2, this.easterDoor.y + this.easterDoor.height / 2 - 8);
            this.ctx.font = '12px Arial';
            this.ctx.fillText(this.easterDoor.subtitle, this.easterDoor.x + this.easterDoor.width / 2, this.easterDoor.y + this.easterDoor.height / 2 + 16);
        }
    }

    finishSecretStreet() {
        this.secretRunActive = false;
        this.gameState.secretEnding = true;
        this.secretEndingText = 'Final Secreto';
        this.secretEndingSubtitle = 'Los pacos';
        this.gameState.gameOver = true;
    }

    finishEasterEgg() {
        this.secretRunActive = false;
        this.gameState.secretEnding = true;
        this.secretEndingText = 'Easter Egg';
        this.secretEndingSubtitle = 'Mi tio y su pandilla';
        this.gameState.gameOver = true;
    }

    checkHealZone() {
        if (this.gameState.healUsed) return;
        if (this.player.x > this.healZone.x && this.player.x < this.healZone.x + this.healZone.width &&
            this.player.y > this.healZone.y && this.player.y < this.healZone.y + this.healZone.height) {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + HEAL_AMOUNT);
            this.gameState.healUsed = true;
        }
    }

    applyTrapDamage(dt) {
        for (const trap of this.trapZones) {
            if (this.player.x > trap.x && this.player.x < trap.x + trap.width &&
                this.player.y > trap.y && this.player.y < trap.y + trap.height) {
                const damage = TRAP_DAMAGE_PER_SECOND * dt;
                if (this.player.takeDamage(damage)) {
                    this.gameState.gameOver = true;
                }
            }
        }
    }

    drawTrapZones() {
        for (const trap of this.trapZones) {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.25)';
            this.ctx.fillRect(trap.x, trap.y, trap.width, trap.height);
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(trap.x, trap.y, trap.width, trap.height);
        }
    }

    drawHealZone() {
        if (!this.healZone) return;
        this.ctx.fillStyle = 'rgba(0, 255, 100, 0.25)';
        this.ctx.fillRect(this.healZone.x, this.healZone.y, this.healZone.width, this.healZone.height);
        this.ctx.strokeStyle = '#00ff66';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.healZone.x, this.healZone.y, this.healZone.width, this.healZone.height);
    }

    gameOver(victory = false) {
        this.gameState.gameOver = true;
        this.gameState.victory = victory;
    }

    update(dt) {
        if (this.gameState.gameOver || this.gameState.paused) return;

        // Update player
        this.player.handleInput(this.keys, this.mouseX, this.mouseY);
        this.player.update(dt);

        // Update bullets
        for (const bullet of this.bullets) {
            bullet.update(dt);
        }

        // Player attack handled by click shooting

        // Update enemies
        for (const enemy of this.enemies) {
            enemy.update(dt);

            // Enemy collision with player
            const dist = Math.hypot(enemy.x - this.player.x, enemy.y - this.player.y);
            if (dist < this.player.size + enemy.size && enemy.canAttack()) {
                const ed = enemy.attackDamage || ENEMY_CONFIG.attackDamage;
                if (this.player.takeDamage(ed)) {
                    this.gameState.gameOver = true;
                }
                enemy.performAttack();
            }
        }

        // Bullet collision with enemies
        for (const bullet of this.bullets) {
            if (bullet.dead) continue;
            for (const enemy of this.enemies) {
                const dist = Math.hypot(enemy.x - bullet.x, enemy.y - bullet.y);
                if (dist < enemy.size + bullet.size) {
                    bullet.dead = true;
                    if (enemy.takeDamage(bullet.damage)) {
                        this.gameState.enemiesKilled++;
                    }
                    break;
                }
            }
            if (!bullet.dead && this.boss) {
                const distBoss = Math.hypot(this.boss.x - bullet.x, this.boss.y - bullet.y);
                if (distBoss < this.boss.size + bullet.size) {
                    bullet.dead = true;
                    this.boss.health = Math.max(0, this.boss.health - bullet.damage);
                }
            }
        }

        this.bullets = this.bullets.filter(bullet => !bullet.dead);
        this.enemies = this.enemies.filter(e => e.health > 0);

        for (const bullet of this.enemyBullets) {
            bullet.update(dt);
        }

        for (const bullet of this.enemyBullets) {
            if (bullet.dead) continue;
            const dist = Math.hypot(bullet.x - this.player.x, bullet.y - this.player.y);
            if (dist < this.player.size + bullet.size) {
                bullet.dead = true;
                if (this.player.takeDamage(bullet.damage)) {
                    this.gameState.gameOver = true;
                }
            }
        }

        this.enemyBullets = this.enemyBullets.filter(bullet => !bullet.dead);

        if (this.boss) {
            this.boss.update(dt);
            const bossBullets = this.boss.tryShoot();
            if (bossBullets.length > 0) {
                this.enemyBullets.push(...bossBullets);
            }
            if (this.boss.health <= 0) {
                this.boss = null;
                this.gameState.roomCleared = true;
                this.waveTextAlpha = 1;
                this.waveTextTime = 1.5;
            }
        }

        if (this.gameState.roomType !== 'boss' && this.gameState.roomType !== 'shop' && this.enemies.length === 0 && !this.gameState.roomCleared) {
            this.gameState.roomCleared = true;
            this.waveTextAlpha = 1;
            this.waveTextTime = 1.5;
            if (!this.gameState.coinAwardedThisRoom) {
                this.gameState.coins += 8 + this.gameState.room * 2;
                this.gameState.coinAwardedThisRoom = true;
            }
        }

        if (this.gameState.roomCleared) {
            const inDoor = this.player.x + this.player.size > DOOR_X &&
                this.player.y > DOOR_Y &&
                this.player.y < DOOR_Y + DOOR_HEIGHT;
            const inShopDoor = this.player.x > SHOP_DOOR_X &&
                this.player.x < SHOP_DOOR_X + SHOP_DOOR_WIDTH &&
                this.player.y < SHOP_DOOR_Y + SHOP_DOOR_HEIGHT;

            if (inShopDoor && this.isShopDoorVisible()) {
                this.enterNextRoom(true);
            } else if (inDoor) {
                this.enterNextRoom(false);
            }
        }

        // Check secret door entry
        if (this.secretDoor && !this.secretRunActive) {
            const sd = this.secretDoor;
            if (this.player.x > sd.x && this.player.x < sd.x + sd.width && this.player.y > sd.y && this.player.y < sd.y + sd.height) {
                this.startSecretRun();
            }
        }

        if (this.secretRunActive && this.secretScene === 'street') {
            this.handleSecretObstacles(dt);
        }

        // Secret run camera follow and end condition
        if (this.secretRunActive) {
            this.secretCameraX = Math.max(0, Math.min(this.player.x - GAME_WIDTH / 2, this.secretRunLength - GAME_WIDTH));
            if (this.secretScene === 'street' && this.secretFinalDoor) {
                if (this.checkRectCollision(this.player, this.secretFinalDoor)) {
                    this.finishSecretStreet();
                }
            }
            if (this.secretScene === 'easterDance' && this.easterDoor) {
                if (this.checkRectCollision(this.player, this.easterDoor)) {
                    this.finishEasterEgg();
                }
            }
        }

        if (this.gameState.roomType === 'trap') {
            this.applyTrapDamage(dt);
        }

        if (this.gameState.roomType === 'heal' && this.healZone) {
            this.checkHealZone();
        }

        // Update wave text
        if (this.waveTextTime > 0) {
            this.waveTextTime -= dt;
            this.waveTextAlpha = Math.max(0, this.waveTextTime / 1.5);
        }

        // Secret run camera follow and end condition
        if (this.secretRunActive) {
            this.secretCameraX = Math.max(0, Math.min(this.player.x - GAME_WIDTH / 2, this.secretRunLength - GAME_WIDTH));
            if (this.player.x >= this.secretRunLength - 80) {
                // reached end
                this.gameState.secretEnding = true;
                this.secretRunActive = false;
                this.gameState.gameOver = true;
            }
        }
    }

    shootBullet() {
        if (!this.player.canAttack()) return;
        const offsetX = Math.cos(this.player.angle) * (this.player.size + BULLET_CONFIG.size + 2);
        const offsetY = Math.sin(this.player.angle) * (this.player.size + BULLET_CONFIG.size + 2);
        const bulletX = this.player.x + offsetX;
        const bulletY = this.player.y + offsetY;
        const damage = BULLET_CONFIG.damage + this.player.weaponLevel * 1;
        this.bullets.push(new Bullet(bulletX, bulletY, this.player.angle, damage));
        this.player.performAttack();
    }

    startSecretRun() {
        this.secretRunActive = true;
        this.secretCameraX = 0;
        this.gameState.secretUsed = true;
        this.gameState.secretEnding = false;
        this.secretEndingText = '';
        this.secretEndingSubtitle = '';
        this.secretObstacles = [];
        this.secretFinalDoor = null;
        this.easterDoor = null;

        this.secretScene = 'street';
        this.secretRunLength = 3400;
        this.player.x = 100;
        this.player.y = GAME_HEIGHT / 2;
        this.player.velX = 0;
        this.player.velY = 0;
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];

            const obstaclePositions = [
                { x: 700, y: 180, width: 100, height: 220 },
                { x: 1100, y: 60, width: 120, height: 160 },
                { x: 1500, y: 320, width: 140, height: 180 },
                { x: 1900, y: 180, width: 100, height: 220 },
                { x: 2300, y: 80, width: 120, height: 160 },
                { x: 2700, y: 300, width: 140, height: 180 },
            ];
            this.secretObstacles = obstaclePositions;
            this.secretFinalDoor = {
                x: this.secretRunLength - 180,
                y: GAME_HEIGHT / 2 - 80,
                width: 160,
                height: 160,
                label: 'SALIDA',
            };

            for (let i = 0; i < 4; i++) {
                const ex = -300 - i * 180;
                const ey = GAME_HEIGHT / 2 + (i - 1.5) * 60;
                const en = new Enemy(ex, ey, this.player);
                en.color = '#0f8c24';
                en.maxHealth = 9999;
                en.health = en.maxHealth;
                en.speed = 170 + i * 10;
                en.attackDamage = 18 + i * 6;
                en.attackCooldown = 0.8;
                en.invincible = true;
                en.lastAttackTime = -1;
                this.enemies.push(en);
            }
    }

    drawAttackEffect(angle) {
        const duration = 0.1;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed > duration) return;

            const alpha = 1 - elapsed / duration;
            const endX = this.player.x + Math.cos(angle) * 50;
            const endY = this.player.y + Math.sin(angle) * 50;

            this.ctx.globalAlpha = alpha * 0.8;
            this.ctx.strokeStyle = COLORS.ui;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(this.player.x, this.player.y);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        };

        animate();
    }

    draw() {
        // Clear canvas
        // Use transform to scale drawing to current canvas size
        this.ctx.save();
        this.ctx.setTransform(this.scaleX, 0, 0, this.scaleY, 0, 0);
        this.ctx.fillStyle = COLORS.background;
        this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // If secret run active, draw special background and translate world by camera when needed
        if (this.secretRunActive) {
            if (this.secretScene === 'street') {
                this.ctx.save();
                this.ctx.translate(-this.secretCameraX, 0);
                this.drawSecretStreet();
            } else if (this.secretScene === 'easterDance') {
                this.drawEasterDanceRoom();
            }
        }

        // Draw game objects
        this.player.draw(this.ctx);
        for (const enemy of this.enemies) {
            enemy.draw(this.ctx);
        }
        for (const bullet of this.bullets) {
            bullet.draw(this.ctx);
        }
        for (const bullet of this.enemyBullets) {
            bullet.draw(this.ctx);
        }

        if (this.gameState.roomType === 'trap') {
            this.drawTrapZones();
        }
        if (this.gameState.roomType === 'heal' && this.healZone) {
            this.drawHealZone();
        }

        if (this.boss) {
            this.boss.draw(this.ctx);
            this.drawBossHealthBar();
        }

        // Draw visible walls and door only when not in special secret mode
        if (!this.secretRunActive) {
            this.drawWalls();
            this.drawDoor();
        }

        if (this.secretRunActive && this.secretScene === 'street') {
            this.ctx.restore();
        }

        // Draw wave text
        if (this.waveTextAlpha > 0) {
            this.ctx.globalAlpha = this.waveTextAlpha;
            this.ctx.fillStyle = COLORS.ui;
            this.ctx.font = 'bold 60px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`Wave ${this.gameState.wave}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);
            this.ctx.globalAlpha = 1;
        }

        // Game over screen
        if (this.gameState.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            this.ctx.fillStyle = COLORS.ui;
            this.ctx.font = 'bold 50px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            const title = this.gameState.victory ? 'YOU WIN!' : 'GAME OVER';
            this.ctx.fillText(title, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);

            this.ctx.fillStyle = COLORS.health;
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`Rooms: ${this.gameState.wave - 1}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
            this.ctx.fillText(`Enemies killed: ${this.gameState.enemiesKilled}`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);

            this.ctx.fillStyle = COLORS.health;
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Click to restart', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100);
        }

        // UI
        // Draw shop and UI overlays (not translated by secret camera)
        this.drawShopPanel();
        this.updateUI();

        // Secret ending overlay
        if (this.gameState.secretEnding) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
            this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 54px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.secretEndingText || 'Final Secreto', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
            this.ctx.font = '22px Arial';
            this.ctx.fillText(this.secretEndingSubtitle || 'Los pacos', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10);
        }

        if (this.gameState.paused) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            this.ctx.fillStyle = COLORS.ui;
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Press Escape to continue', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);
        }
        this.ctx.restore();
    }

    drawWalls() {
        const t = 14; // wall thickness
        this.ctx.fillStyle = '#11151f';
        // Top
        this.ctx.fillRect(0, 0, GAME_WIDTH, t);
        // Left
        this.ctx.fillRect(0, 0, t, GAME_HEIGHT);
        // Bottom
        this.ctx.fillRect(0, GAME_HEIGHT - t, GAME_WIDTH, t);
        // Right - split around door
        // Upper part
        this.ctx.fillRect(GAME_WIDTH - t, 0, t, DOOR_Y);
        // Lower part
        this.ctx.fillRect(GAME_WIDTH - t, DOOR_Y + DOOR_HEIGHT, t, GAME_HEIGHT - (DOOR_Y + DOOR_HEIGHT));
        // Draw inner border for contrast
        this.ctx.strokeStyle = '#2b2f3a';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(t/2, t/2, GAME_WIDTH - t, GAME_HEIGHT - t);

        // Draw shop door at top if available
        if (this.isShopDoorVisible()) {
            this.ctx.fillStyle = '#4488ff';
            this.ctx.fillRect(SHOP_DOOR_X, SHOP_DOOR_Y, SHOP_DOOR_WIDTH, SHOP_DOOR_HEIGHT);
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(SHOP_DOOR_X, SHOP_DOOR_Y, SHOP_DOOR_WIDTH, SHOP_DOOR_HEIGHT);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('TIENDA', SHOP_DOOR_X + SHOP_DOOR_WIDTH / 2, SHOP_DOOR_Y + SHOP_DOOR_HEIGHT / 2 + 4);

            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#a8d6ff';
            this.ctx.fillText('Arriba está la tienda', SHOP_DOOR_X + SHOP_DOOR_WIDTH / 2, SHOP_DOOR_Y + SHOP_DOOR_HEIGHT + 18);
        }
    }

    isShopDoorVisible() {
        return this.gameState.roomCleared && this.gameState.roomType !== 'shop' && this.gameState.roomType !== 'boss' && !this.gameState.inShopRoom;
    }

    drawDoor() {
        this.ctx.fillStyle = this.gameState.roomCleared ? '#6bcf5d' : '#8f2d2d';
        this.ctx.fillRect(DOOR_X, DOOR_Y, DOOR_WIDTH, DOOR_HEIGHT);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(DOOR_X, DOOR_Y, DOOR_WIDTH, DOOR_HEIGHT);

        if (!this.gameState.roomCleared) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('LOCKED', DOOR_X + DOOR_WIDTH / 2, DOOR_Y + DOOR_HEIGHT / 2);

            const infoY = DOOR_Y + DOOR_HEIGHT + 22;
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#a8d6ff';
            if (this.gameState.roomType === 'shop') {
                this.ctx.fillText('Libera la sala para salir de la tienda', DOOR_X - 120, infoY);
            } else {
                this.ctx.fillText('Libera la sala para abrir la puerta a la tienda', DOOR_X - 120, infoY);
            }
        } else {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            const doorLabel = this.gameState.roomType === 'shop' ? 'SALIR' : this.gameState.roomType === 'boss' ? 'JUEGO' : 'SIGUIENTE';
            this.ctx.fillText(doorLabel, DOOR_X + DOOR_WIDTH / 2, DOOR_Y + DOOR_HEIGHT / 2);

            const infoY = DOOR_Y + DOOR_HEIGHT + 22;
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#a8d6ff';
            if (this.gameState.roomType === 'shop') {
                this.ctx.fillText('Derecha para el siguiente nivel', DOOR_X - 120, infoY);
            } else if (this.gameState.roomType === 'boss') {
                this.ctx.fillText('Derecha para pelear con el jefe', DOOR_X - 120, infoY);
            } else {
                this.ctx.fillText('Derecha para el siguiente nivel; arriba para la tienda', DOOR_X - 120, infoY);
            }
        }

        // Secret door at bottom when purchased
        if (this.gameState.secretPurchased && !this.gameState.secretUsed) {
            const sdW = 60;
            const sdH = 40;
            const sdX = GAME_WIDTH / 2 - sdW / 2;
            const sdY = GAME_HEIGHT - sdH;
            this.ctx.fillStyle = '#114411';
            this.ctx.fillRect(sdX, sdY, sdW, sdH);
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.strokeRect(sdX, sdY, sdW, sdH);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('SECRETO', sdX + sdW / 2, sdY + sdH / 2 + 4);
            this.secretDoor = { x: sdX, y: sdY, width: sdW, height: sdH };
        } else {
            this.secretDoor = null;
        }
    }

    updateUI() {
        document.getElementById('health').textContent = `HP: ${Math.ceil(this.player.health)}/${this.player.maxHealth}`;

        const waveDiv = document.querySelector('#wave-info div:nth-child(1)');
        const enemiesDiv = document.querySelector('#wave-info div:nth-child(2)');

        if (waveDiv) waveDiv.textContent = `Room: ${this.gameState.room} (${this.gameState.roomType})`;
        if (enemiesDiv) {
            const count = this.boss ? 1 : this.enemies.length;
            enemiesDiv.textContent = `Enemies: ${count} | Coins: ${this.gameState.coins}`;
        }
    }

    drawShopPanel() {
        if (!this.gameState.shopOpen) return;

        const panelHeight = 90;
        const margin = 14;
        const buttonWidth = 220;
        const buttonHeight = 32;
        const buttonY = margin + 40;
        const healthButtonX = margin + 10;
        const damageButtonX = healthButtonX + buttonWidth + 16;

        this.ctx.fillStyle = 'rgba(20, 20, 30, 0.95)';
        this.ctx.fillRect(0, 0, GAME_WIDTH, panelHeight);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(0, 0, GAME_WIDTH, panelHeight);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('TIENDA', margin + 8, margin + 22);
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#c0c0c0';
        this.ctx.fillText(this.gameState.shopMessage, margin + 8, margin + 42);

        const drawButton = (x, label, cost, enabled) => {
            this.ctx.fillStyle = enabled ? '#33394a' : '#2a2f38';
            this.ctx.fillRect(x, buttonY, buttonWidth, buttonHeight);
            this.ctx.strokeStyle = enabled ? '#a8d6ff' : '#555b68';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, buttonY, buttonWidth, buttonHeight);
            this.ctx.fillStyle = enabled ? '#ffffff' : '#7d7f89';
            this.ctx.font = '14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${label} (${cost} monedas)`, x + buttonWidth / 2, buttonY + buttonHeight / 2 + 5);
        };

        const canBuyHealth = !this.gameState.shopBoughtThisRoom && this.gameState.coins >= SHOP_HEALTH_COST;
        const canBuyDamage = !this.gameState.shopBoughtThisRoom && this.gameState.coins >= SHOP_DAMAGE_COST;
        const canBuySecret = this.gameState.secretAvailable && !this.gameState.secretPurchased && this.gameState.coins >= SECRET_COST;
        drawButton(healthButtonX, `+${HEALTH_UPGRADE_AMOUNT} Salud`, SHOP_HEALTH_COST, canBuyHealth);
        drawButton(damageButtonX, `+1 Daño`, SHOP_DAMAGE_COST, canBuyDamage);

        const buttonBounds = {
            health: { x: healthButtonX, y: buttonY, width: buttonWidth, height: buttonHeight },
            damage: { x: damageButtonX, y: buttonY, width: buttonWidth, height: buttonHeight },
        };

        if (this.gameState.secretAvailable) {
            const secretX = damageButtonX + buttonWidth + 16;
            const secretLabel = 'Final Secreto';
            drawButton(secretX, `${secretLabel}`, SECRET_COST, canBuySecret);
            buttonBounds.secret = { x: secretX, y: buttonY, width: buttonWidth, height: buttonHeight };
        }

        this.shopButtonBounds = buttonBounds;
    }

    handleShopClick(x, y) {
        if (!this.gameState.shopOpen || this.gameState.shopBoughtThisRoom) return false;
        if (!this.shopButtonBounds) return false;

        const inside = (rect) => x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
        const healthButton = this.shopButtonBounds.health;
        const damageButton = this.shopButtonBounds.damage;

        if (inside(healthButton) && this.gameState.coins >= SHOP_HEALTH_COST) {
            this.gameState.coins -= SHOP_HEALTH_COST;
            this.player.maxHealth = Math.min(MAX_PLAYER_HEALTH, this.player.maxHealth + HEALTH_UPGRADE_AMOUNT);
            this.player.health = Math.min(this.player.health + HEALTH_UPGRADE_AMOUNT, this.player.maxHealth);
            this.gameState.shopBoughtThisRoom = true;
            this.gameState.everBought = true;
            this.gameState.shopMessage = 'Salud mejorada. Ve a la puerta o continúa.';
            return true;
        }

        if (inside(damageButton) && this.gameState.coins >= SHOP_DAMAGE_COST) {
            this.gameState.coins -= SHOP_DAMAGE_COST;
            this.player.weaponLevel = Math.min(this.player.weaponLevel + 1, 5);
            this.gameState.shopBoughtThisRoom = true;
            this.gameState.everBought = true;
            this.gameState.shopMessage = 'Arma mejorada. Ve a la puerta o continúa.';
            return true;
        }

        // Secret purchase
        const secretButton = this.shopButtonBounds.secret;
        if (secretButton && inside(secretButton) && this.gameState.coins >= SECRET_COST) {
            this.gameState.coins -= SECRET_COST;
            this.gameState.secretPurchased = true;
            this.gameState.shopBoughtThisRoom = true;
            this.gameState.everBought = true;
            this.gameState.shopMessage = 'Final secreto comprado. Busca la puerta abajo.';
            return true;
        }

        return false;
    }

    restart() {
        this.player = new Player(GAME_WIDTH / 2, GAME_HEIGHT / 2);
        this.enemies = [];
        this.bullets = [];
        this.enemyBullets = [];
        this.boss = null;
        this.trapZones = [];
        this.healZone = null;
        this.gameState = new GameState();
        this.spawnEnemies();
    }

    enterNextRoom(useShopDoor = false) {
        if (this.gameState.roomType === 'shop') {
            this.gameState.inShopRoom = false;
            this.gameState.room++;
            this.gameState.wave++;
            if (this.gameState.room > ROOM_TYPES.length) {
                this.gameOver(true);
                return;
            }
            this.gameState.roomType = ROOM_TYPES[this.gameState.room - 1];
        } else if (useShopDoor && this.isShopDoorVisible()) {
            this.gameState.inShopRoom = true;
            this.gameState.roomType = 'shop';
        } else if (this.gameState.roomType === 'boss') {
            this.gameOver(true);
            return;
        } else {
            this.gameState.room++;
            this.gameState.wave++;
            if (this.gameState.room > ROOM_TYPES.length) {
                this.gameOver(true);
                return;
            }
            this.gameState.roomType = ROOM_TYPES[this.gameState.room - 1];
        }

        this.player.x = 100;
        this.player.y = GAME_HEIGHT / 2;
        this.player.velX = 0;
        this.player.velY = 0;
        this.bullets = [];
        this.enemyBullets = [];
        this.spawnEnemies();
    }

    drawBossHealthBar() {
        if (!this.boss) return;
        const barWidth = 360;
        const barHeight = 18;
        const x = (GAME_WIDTH - barWidth) / 2;
        const y = 20;

        this.ctx.fillStyle = '#222222';
        this.ctx.fillRect(x, y, barWidth, barHeight);
        this.ctx.fillStyle = '#cc0000';
        this.ctx.fillRect(x, y, barWidth * (this.boss.health / this.boss.maxHealth), barHeight);
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, barWidth, barHeight);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        const bossName = this.boss.name || 'BOSS';
        this.ctx.fillText(`${bossName} HP: ${Math.ceil(this.boss.health)}/${this.boss.maxHealth}`, GAME_WIDTH / 2, y + 14);
    }

    gameLoop = () => {
        const now = Date.now();
        const dt = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;

        this.update(Math.min(dt, 0.016)); // Cap at 60 FPS
        this.draw();
        requestAnimationFrame(this.gameLoop);
    };
}

// Start game will be invoked from the menu
window.startGame = () => {
    const nameInput = document.getElementById('player-name');
    const chosen = document.querySelector('input[name=color]:checked');
    const name = nameInput ? (nameInput.value || 'Player') : 'Player';
    const color = chosen ? chosen.value : COLORS.player;
    COLORS.player = color;
    const g = new Game();
    g.gameState.playerName = name;
    if (name === 'Bastian.M') {
        g.startEasterEggRoom();
    }
    const menu = document.getElementById('menu');
    if (menu) menu.style.display = 'none';
    return g;
};

Game.prototype.startEasterEggRoom = function() {
    this.secretRunActive = true;
    this.secretCameraX = 0;
    this.gameState.secretUsed = true;
    this.gameState.secretEnding = false;
    this.secretScene = 'easterDance';
    this.secretRunLength = GAME_WIDTH;
    this.player.x = GAME_WIDTH / 2;
    this.player.y = GAME_HEIGHT / 2;
    this.player.velX = 0;
    this.player.velY = 0;
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.easterDoor = {
        x: GAME_WIDTH - 90,
        y: GAME_HEIGHT / 2 - 60,
        width: 80,
        height: 120,
        label: 'easter egg',
        subtitle: 'Mi tio y su pandilla',
    };
};
