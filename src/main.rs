use macroquad::prelude::*;

mod player;
mod enemy;
mod game_state;

use player::Player;
use enemy::Enemy;
use game_state::{GameState, GamePhase};

const GAME_WIDTH: f32 = 800.0;
const GAME_HEIGHT: f32 = 600.0;
const PLAYER_COLOR: Color = Color::new(1.0, 0.42, 0.61, 1.0); // #FF6B9D
const ENEMY_COLOR: Color = Color::new(1.0, 0.0, 0.43, 1.0);    // #FF006E
const BACKGROUND_COLOR: Color = Color::new(0.04, 0.055, 0.153, 1.0); // #0A0E27
const UI_COLOR: Color = Color::new(0.992, 0.337, 0.027, 1.0);  // #FB5607
const HEALTH_COLOR: Color = Color::new(0.024, 1.0, 0.647, 1.0); // #06FFA5

#[macroquad::main("Hotline Miami")]
async fn main() {
    set_pc_assets_folder("assets");

    let mut game_state = GameState::new();
    let mut player = Player::new(GAME_WIDTH / 2.0, GAME_HEIGHT / 2.0);
    let mut enemies: Vec<Enemy> = Vec::new();
    let mut spawn_enemies = true;
    let mut wave_text_time = 0.0;

    loop {
        clear_background(BACKGROUND_COLOR);

        // Update player
        player.update();

        // Update and spawn enemies
        if spawn_enemies && enemies.is_empty() {
            let enemy_count = (3 + game_state.wave as usize).min(8);
            for _ in 0..enemy_count {
                let mut valid_spawn = false;
                let mut enemy_x = 0.0;
                let mut enemy_y = 0.0;

                while !valid_spawn {
                    enemy_x = rand::gen_range(50.0, GAME_WIDTH - 50.0);
                    enemy_y = rand::gen_range(50.0, GAME_HEIGHT - 50.0);

                    let dist = ((enemy_x - player.x).powi(2) + (enemy_y - player.y).powi(2)).sqrt();
                    if dist > 150.0 {
                        valid_spawn = true;
                    }
                }

                enemies.push(Enemy::new(enemy_x, enemy_y));
            }
            spawn_enemies = false;
            wave_text_time = 1.5;
        }

        // Update enemies
        let mouse_x = mouse_position().0;
        let mouse_y = mouse_position().1;

        for enemy in &mut enemies {
            enemy.update(&player);
            enemy.draw();

            // Check collision with player
            let dist = ((enemy.x - player.x).powi(2) + (enemy.y - player.y).powi(2)).sqrt();
            if dist < 25.0 && enemy.can_attack() {
                player.damage(enemy.attack_damage);
                enemy.perform_attack();

                if player.health <= 0.0 {
                    game_state.phase = GamePhase::GameOver;
                }
            }
        }

        // Player attack
        if is_mouse_button_pressed(MouseButton::Left) && player.can_attack() {
            let attack_range = 50.0;

            enemies.retain(|enemy| {
                let dist = ((enemy.x - player.x).powi(2) + (enemy.y - player.y).powi(2)).sqrt();
                if dist < attack_range {
                    game_state.enemies_killed += 1;
                    false // Remove enemy
                } else {
                    true
                }
            });

            player.perform_attack();

            // Draw attack effect
            let angle = ((mouse_y - player.y).atan2(mouse_x - player.x)) as f32;
            draw_attack_effect(&player, angle);
        }

        // Draw player
        player.draw();

        // Draw UI
        draw_ui(&player, &game_state);

        if wave_text_time > 0.0 {
            let alpha = ((wave_text_time as f32 / 1.5).min(1.0)) as f32;
            draw_text_centered(
                &format!("Wave {}", game_state.wave),
                GAME_WIDTH / 2.0,
                GAME_HEIGHT / 2.0 - 50.0,
                60.0,
                Color::new(UI_COLOR.r, UI_COLOR.g, UI_COLOR.b, alpha),
            );
            wave_text_time -= get_frame_time();
        }

        // Check wave completion
        if !enemies.is_empty() {
            enemies.retain(|e| e.health > 0.0);
        }

        if enemies.is_empty() && !spawn_enemies {
            game_state.wave += 1;
            spawn_enemies = true;
        }

        // Game Over
        if game_state.phase == GamePhase::GameOver {
            draw_text_centered(
                &format!(
                    "GAME OVER\nWaves: {}\nEnemies: {}",
                    game_state.wave - 1,
                    game_state.enemies_killed
                ),
                GAME_WIDTH / 2.0,
                GAME_HEIGHT / 2.0,
                40.0,
                UI_COLOR,
            );
            draw_text_centered(
                "Click to restart",
                GAME_WIDTH / 2.0,
                GAME_HEIGHT / 2.0 + 80.0,
                20.0,
                HEALTH_COLOR,
            );

            if is_mouse_button_pressed(MouseButton::Left) {
                game_state = GameState::new();
                player = Player::new(GAME_WIDTH / 2.0, GAME_HEIGHT / 2.0);
                enemies.clear();
                spawn_enemies = true;
            }
        }

        next_frame().await
    }
}

fn draw_ui(player: &Player, game_state: &GameState) {
    let health_text = format!("HP: {:.0}/{:.0}", player.health, player.max_health);
    draw_text(&health_text, 16.0, 32.0, 24.0, HEALTH_COLOR);

    let wave_text = format!("Wave: {}\nEnemies: 0", game_state.wave);
    draw_text(&wave_text, GAME_WIDTH - 150.0, 32.0, 20.0, UI_COLOR);
}

fn draw_attack_effect(player: &Player, angle: f32) {
    let end_x = player.x + angle.cos() * 50.0;
    let end_y = player.y + angle.sin() * 50.0;
    draw_line(player.x, player.y, end_x, end_y, 3.0, UI_COLOR);
}

fn draw_text_centered(text: &str, x: f32, y: f32, size: f32, color: Color) {
    let text_width = text.len() as f32 * size * 0.5;
    draw_text(text, x - text_width / 2.0, y, size, color);
}
