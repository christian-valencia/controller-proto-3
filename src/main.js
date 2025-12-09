import { InputManager } from './input/InputManager'

// ============================================================================
// INPUT SYSTEM
// ============================================================================
const input = new InputManager()

// ============================================================================
// DOM ELEMENTS
// ============================================================================
const lockScreen = document.getElementById('lock-screen')
const home = document.getElementById('home')
const clock = document.getElementById('clock')
const progressRing = document.getElementById('progress-ring')
const progressCircle = document.getElementById('progress-circle')

// ============================================================================
// STATE MANAGEMENT
// ============================================================================
const UI_STATES = {
  LOCKED: 'locked',
  UNLOCKED: 'unlocked'
}

let currentUIState = UI_STATES.LOCKED
let isHoldingA = false
let holdStartTime = 0
const HOLD_DURATION = 600 // 0.6 seconds

// ============================================================================
// CLOCK UPDATE
// ============================================================================
function updateClock() {
  const now = new Date()
  let hours = now.getHours()
  const minutes = now.getMinutes()
  
  // Convert to 12-hour format
  if (hours === 0) {
    hours = 12
  } else if (hours > 12) {
    hours = hours - 12
  }
  
  // Format time as HH:MM
  const timeString = `${hours}:${minutes.toString().padStart(2, '0')}`
  
  if (clock) {
    clock.textContent = timeString
  }
}

// Update clock immediately and every second
updateClock()
setInterval(updateClock, 1000)

// ============================================================================
// UNLOCK FUNCTIONALITY
// ============================================================================
function unlockScreen() {
  currentUIState = UI_STATES.UNLOCKED
  
  // Move lock screen upward off screen
  if (lockScreen) {
    lockScreen.style.transform = 'translateY(-720px)'
    lockScreen.style.transition = 'transform 0.4s ease'
    
    setTimeout(() => {
      lockScreen.style.zIndex = '1' // Move to bottom layer
      if (home) {
        home.style.zIndex = '10' // Move home to top layer
      }
    }, 400)
  }
  console.log('Screen unlocked!')
}

function updateProgressRing(progress) {
  if (progressCircle) {
    const circumference = 100.53
    const offset = circumference - (progress / 100) * circumference
    progressCircle.style.strokeDashoffset = offset
  }
}

// ============================================================================
// GAME LOOP
// ============================================================================
function gameLoop() {
  input.update()
  
  // Handle A button hold for unlock
  if (currentUIState === UI_STATES.LOCKED) {
    if (input.isDown('A')) {
      if (!isHoldingA) {
        isHoldingA = true
        holdStartTime = Date.now()
      }
      
      const holdTime = Date.now() - holdStartTime
      const progress = Math.min((holdTime / HOLD_DURATION) * 100, 100)
      updateProgressRing(progress)
      
      if (holdTime >= HOLD_DURATION) {
        unlockScreen()
        isHoldingA = false
      }
    } else {
      if (isHoldingA) {
        isHoldingA = false
        updateProgressRing(0)
      }
    }
  }
  
  requestAnimationFrame(gameLoop)
}

// Start the game loop
requestAnimationFrame(gameLoop)

console.log('Controller prototype initialized')
console.log('Press and hold A (controller) or W (keyboard) to unlock')



