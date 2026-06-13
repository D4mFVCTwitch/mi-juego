# Hotline Miami - Vanilla JavaScript Edition

Un juego 2D en tiempo real estilo **Hotline Miami** hecho con **HTML5 Canvas + JavaScript vanilla** - Zero dependencies, 100% optimizado.

## 🚀 Características

- ⚡ **Ultra-rápido**: JavaScript puro, sin frameworks
- 🎮 **Gameplay dinámico**: Movimiento fluido, combate responsivo
- 🌊 **Sistema de oleadas**: Dificultad progresiva
- 🎨 **Estética retro**: Pixel art minimalista con paleta Hotline Miami
- 🤖 **IA de enemigos**: Persecución inteligente y patrulla aleatoria
- 📊 **UI en vivo**: Salud, oleadas, contador de enemigos
- 🎯 **Detección de colisiones**: Física arcade simple y eficiente

## 🎮 Controles

| Acción | Tecla |
|--------|-------|
| **Arriba** | `W` / `↑` |
| **Abajo** | `S` / `↓` |
| **Izquierda** | `A` / `←` |
| **Derecha** | `D` / `→` |
| **Atacar** | `Click izquierdo` |
| **Apuntar** | `Movimiento del mouse` |

## 🏃 Cómo jugar

1. **Muévete** con WASD o flechas
2. **Apunta** moviendo el mouse (el blanco blanco indica dirección)
3. **Ataca** con click izquierdo a enemigos cercanos
4. **Sobrevive** a cada oleada para avanzar
5. Cada oleada tiene **más enemigos** y es más difícil

### Objetivos
- ✅ Derrota todos los enemigos en cada oleada
- ✅ Maximiza tu racha de elimaciones
- ✅ Llega lo más lejos posible

## 🛠️ Instalación y ejecución

### Opción 1: Ejecutar servidor PowerShell (Recomendado)

```powershell
cd C:\Users\D4mFV\Documents\Proyects\Games
powershell -ExecutionPolicy Bypass -File .\server.ps1
```

Luego abre: **http://localhost:8000**

### Opción 2: Abrir directamente (sin servidor)

Simplemente abre `index.html` en tu navegador (algunos navegadores pueden tener restricciones CORS).

## 📁 Estructura del proyecto

```
.
├── index.html           # Página HTML principal
├── game.js              # Lógica del juego (único archivo JavaScript)
├── server.ps1           # Servidor HTTP local
├── README.md            # Este archivo
└── Cargo.toml           # Config Rust (opcional, no usado en esta versión)
```

## 🎨 Paleta de colores

| Elemento | Color | Hex |
|----------|-------|-----|
| Fondo | Azul oscuro | `#0a0e27` |
| Jugador | Rosa | `#ff6b9d` |
| Enemigos | Rojo neón | `#ff006e` |
| UI | Naranja | `#fb5607` |
| Salud | Verde cian | `#06ffa5` |

## ⚙️ Personalización

### Cambiar dificultad

Edita `game.js` y modifica:

```javascript
// Velocidad del jugador
speed: 250,  // Aumenta para más velocidad

// Velocidad de enemigos
speed: 100,  // Aumenta para más difícil

// Vida inicial
maxHealth: 100,  // Aumenta para más tanque

// Daño del ataque
attackDamage: 15,  // Aumenta para eliminar rápido
```

### Cambiar cantidad de enemigos

```javascript
const count = Math.min(3 + this.gameState.wave, 10);  // Máximo 10 enemigos por ola
```

### Cambiar resolución del juego

En `index.html`:
```html
<canvas id="gameCanvas" width="800" height="600"></canvas>
```

O en `game.js`:
```javascript
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
```

## 🎓 Conceptos técnicos

### Arquitectura

- **Entity System**: Clases `Entity`, `Player`, `Enemy`
- **Game Loop**: 60 FPS usando `requestAnimationFrame`
- **Delta Time**: Movimiento independiente de FPS
- **Canvas Rendering**: Renderizado 2D directo

### Performance

- **Sin garbage collection**: Objetos reutilizados
- **Culling simple**: Solo dibuja si está activo
- **FPS capped**: 60 FPS máximo
- **Tamaño**: ~20KB minificado

## 🚀 Mejoras futuras

- [ ] Animaciones sprite
- [ ] Múltiples tipos de armas
- [ ] Efectos de sonido y música
- [ ] Powerups (salud, velocidad, daño)
- [ ] Mapas con obstáculos
- [ ] Leaderboard persistente
- [ ] Modos de juego (supervivencia, timed, etc.)
- [ ] Versión multijugador local

## 🐛 Troubleshooting

### El juego no carga
- Asegúrate de que el servidor esté corriendo: `powershell -ExecutionPolicy Bypass -File .\server.ps1`
- Abre http://localhost:8000 en tu navegador

### Lag o bajo FPS
- Reduce la cantidad de enemigos en `spawnEnemies()`
- Cierra otras aplicaciones pesadas

### El ataque no funciona
- Asegúrate de hacer click con el botón izquierdo
- Los enemigos deben estar cerca (dentro del rango de ataque)

## 📝 Licencia

MIT - Libre para usar, modificar y distribuir

## 🎬 Créditos

Inspirado en **Hotline Miami** - Dennis Wedin & Jonatan Söderström

---

**¿Quieres personalizar algo?** ¡Dímelo y lo cambio al instante!

