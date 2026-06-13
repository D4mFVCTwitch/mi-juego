#[derive(Clone, Copy, PartialEq, Eq)]
pub enum GamePhase {
    Playing,
    GameOver,
}

pub struct GameState {
    pub phase: GamePhase,
    pub wave: u32,
    pub enemies_killed: u32,
}

impl GameState {
    pub fn new() -> Self {
        Self {
            phase: GamePhase::Playing,
            wave: 1,
            enemies_killed: 0,
        }
    }
}
