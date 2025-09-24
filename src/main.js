import { InputManager } from './input/InputManager'
import { createHud } from './ui/Hud'

// DOM ELEMENT SELECTION ONLY - No DOM creation here
const windowsShell = document.getElementById('windows-shell')
const hudContainer = document.getElementById('hud-container')
const statusContainer = document.getElementById('status-container')
const debugContainer = document.getElementById('debug-container')

// Initialize input and HUD systems
const input = new InputManager()
const hud = createHud()

// Fullscreen toggle via keyboard or View/Menu buttons
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'f') {
    toggleFullscreen()
  }
})

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(console.error)
  } else {
    document.exitFullscreen().catch(console.error)
  }
}

// Main game loop
function loop() {
  input.update()

  // Handle input actions
  handleInputActions()
  
  // Update visual feedback
  updateVisualFeedback()
  
  // Render HUD
  hud.render(input)
  
  requestAnimationFrame(loop)
}

function handleInputActions() {
  // Rumble on A button or J key
  if (input.justPressed('A')) {
    rumble(0.8, 120)
  }
  
  // Fullscreen toggle on View/Menu buttons
  if (input.justPressed('VIEW') || input.justPressed('MENU')) {
    toggleFullscreen()
  }
}

function updateVisualFeedback() {
  // Visual feedback can be added here if needed
  // Currently just HUD-based feedback
}

async function rumble(intensity = 1, durationMs = 200) {
  const gamepad = input.firstGamepad()
  if (!gamepad) return
  
  const vibrationActuator = gamepad.vibrationActuator
  if (vibrationActuator) {
    try {
      await vibrationActuator.playEffect('dual-rumble', {
        duration: durationMs,
        strongMagnitude: intensity,
        weakMagnitude: intensity
      })
    } catch (error) {
      console.warn('Rumble not supported:', error)
    }
  }
}

// Start the application
requestAnimationFrame(loop)