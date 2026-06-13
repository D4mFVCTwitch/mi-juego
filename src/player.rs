use macroquad::prelude::*;

const PLAYER_COLOR: Color = Color::new(1.0, 0.42, 0.61, 1.0);
const GAME_WIDTH: f32 = 800.0;
const GAME_HEIGHT: f32 = 600.0;

pub struct Player {
    pub x: f32,
    pub y: f32,
    pub health: f32,
    pub max_health: f32,
    pub speed: f32,
    pub size: f32,
    pub attack_damage: f32,
    pub attack_cooldown: f32,
    last_attack_time: f32,
}

impl Player {
    pub fn new(x: f32, y: f32) -> Self {
        Self {
            x,
            y,
            health: 100.0,
            max_health: 100.0,
            speed: 200.0,
            size: 20.0,
            attack_damage: 10.0,
            attack_cooldown: 0.3,
            last_attack_time: -1.0,
        }
    }

    pub fn update(&mut self) {
        let mut dx = 0.0;
        let mut dy = 0.0;

        // Movement
        if is_key_down(KeyCode::W) || is_key_down(KeyCode::Up) {
            dy -= self.speed;
        }
        if is_key_down(KeyCode::S) || is_key_down(KeyCode::Down) {
            dy += self.speed;
        }
        if is_key_down(KeyCode::A) || is_key_down(KeyCode::Left) {
            dx -= self.speed;
        }
        if is_key_down(KeyCode::D) || is_key_down(KeyCode::Right) {
            dx += self.speed;
        }

        // Normalize diagonal movement
        let magnitude = (dx * dx + dy * dy).sqrt();
        if magnitude > 0.0 {
            dx = (dx / magnitude) * self.speed;
            dy = (dy / magnitude) * self.speed;
        }

        let dt = get_frame_time();
        self.x = (self.x + dx * dt).max(self.size).min(GAME_WIDTH - self.size);
        self.y = (self.y + dy * dt).max(self.size).min(GAME_HEIGHT - self.size);
    }

    pub fn draw(&self) {
        let mouse_x = mouse_position().0;
        let mouse_y = mouse_position().1;
        let angle = ((mouse_y - self.y).atan2(mouse_x - self.x)) as f32;

        draw_circle(self.x, self.y, self.size, PLAYER_COLOR);

        // Draw rotation indicator
        let indicator_x = self.x + angle.cos() * (self.size + 5.0);
        let indicator_y = self.y + angle.sin() * (self.size + 5.0);
        draw_circle(indicator_x, indicator_y, 3.0, WHITE);
    }

    pub fn damage(&mut self, amount: f32) {
        self.health = (self.health - amount).max(0.0);
    }

    pub fn can_attack(&self) -> bool {
        get_time() - self.last_attack_time as f64 > self.attack_cooldown as f64
    }

    pub fn perform_attack(&mut self) {
        self.last_attack_time = get_time() as f32;
    }
}
