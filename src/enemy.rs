use macroquad::prelude::*;
use crate::player::Player;

const ENEMY_COLOR: Color = Color::new(1.0, 0.0, 0.43, 1.0);
const GAME_WIDTH: f32 = 800.0;
const GAME_HEIGHT: f32 = 600.0;

pub struct Enemy {
    pub x: f32,
    pub y: f32,
    pub health: f32,
    pub max_health: f32,
    pub speed: f32,
    pub size: f32,
    pub attack_damage: f32,
    pub attack_cooldown: f32,
    pub detection_range: f32,
    last_attack_time: f32,
    target_x: f32,
    target_y: f32,
}

impl Enemy {
    pub fn new(x: f32, y: f32) -> Self {
        Self {
            x,
            y,
            health: 30.0,
            max_health: 30.0,
            speed: 80.0,
            size: 16.0,
            attack_damage: 5.0,
            attack_cooldown: 1.0,
            detection_range: 200.0,
            last_attack_time: -1.0,
            target_x: x,
            target_y: y,
        }
    }

    pub fn update(&mut self, player: &Player) {
        let dt = get_frame_time();
        let dist_to_player = ((self.x - player.x).powi(2) + (self.y - player.y).powi(2)).sqrt();

        if dist_to_player < self.detection_range {
            // Chase player
            let angle = ((player.y - self.y).atan2(player.x - self.x)) as f32;
            self.x += angle.cos() * self.speed * dt;
            self.y += angle.sin() * self.speed * dt;
        } else {
            // Patrol randomly
            let dist_to_target = ((self.x - self.target_x).powi(2) + (self.y - self.target_y).powi(2)).sqrt();

            if dist_to_target < 10.0 {
                self.target_x = self.x + rand::gen_range(-150.0, 150.0);
                self.target_y = self.y + rand::gen_range(-150.0, 150.0);
                self.target_x = self.target_x.max(self.size).min(GAME_WIDTH - self.size);
                self.target_y = self.target_y.max(self.size).min(GAME_HEIGHT - self.size);
            } else {
                let angle = ((self.target_y - self.y).atan2(self.target_x - self.x)) as f32;
                self.x += angle.cos() * self.speed * 0.5 * dt;
                self.y += angle.sin() * self.speed * 0.5 * dt;
            }
        }

        self.x = self.x.max(self.size).min(GAME_WIDTH - self.size);
        self.y = self.y.max(self.size).min(GAME_HEIGHT - self.size);
    }

    pub fn draw(&self) {
        draw_circle(self.x, self.y, self.size, ENEMY_COLOR);

        // Health bar
        let bar_width = self.size * 2.0;
        let bar_height = 3.0;
        let health_percent = self.health / self.max_health;

        draw_rectangle(
            self.x - bar_width / 2.0,
            self.y - self.size - 8.0,
            bar_width,
            bar_height,
            BLACK,
        );
        draw_rectangle(
            self.x - bar_width / 2.0,
            self.y - self.size - 8.0,
            bar_width * health_percent,
            bar_height,
            RED,
        );
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
