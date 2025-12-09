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

// Launcher elements
const launcherItems = [
  document.getElementById('launcher-xbox'),
  document.getElementById('launcher-steam'),
  document.getElementById('launcher-epic'),
  document.getElementById('launcher-battlenet'),
  document.getElementById('launcher-ea'),
  document.getElementById('launcher-riot')
]

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

// Launcher navigation state
let currentLauncherIndex = 0

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
// LAUNCHER NAVIGATION
// ============================================================================
function updateLauncherFocus() {
  launcherItems.forEach((item, index) => {
    if (item) {
      if (index === currentLauncherIndex) {
        item.classList.add('focused')
      } else {
        item.classList.remove('focused')
      }
    }
  })
}

function navigateLaunchers(direction) {
  if (direction === 'left' && currentLauncherIndex > 0) {
    currentLauncherIndex--
    updateLauncherFocus()
  } else if (direction === 'right' && currentLauncherIndex < launcherItems.length - 1) {
    currentLauncherIndex++
    updateLauncherFocus()
  }
}

// ============================================================================
// GAME LOOP
// ============================================================================
let stickCooldown = 0
const STICK_COOLDOWN_TIME = 200 // ms between stick navigation

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
        // Clear any pending keyboard inputs from lock screen
        input.keyboard.justPressed('LEFT')
        input.keyboard.justPressed('RIGHT')
        input.keyboard.justPressed('UP')
        input.keyboard.justPressed('DOWN')
      }
    } else {
      if (isHoldingA) {
        isHoldingA = false
        updateProgressRing(0)
      }
    }
  }
  
  // Handle launcher navigation when unlocked
  else if (currentUIState === UI_STATES.UNLOCKED) {
    // D-pad and arrow key navigation
    const gamepadLeftPressed = input.gamepad.justPressed('LEFT')
    const gamepadRightPressed = input.gamepad.justPressed('RIGHT')
    const keyboardLeftPressed = input.keyboard.justPressed('LEFT')
    const keyboardRightPressed = input.keyboard.justPressed('RIGHT')
    
    if (gamepadLeftPressed || keyboardLeftPressed) {
      navigateLaunchers('left')
    }
    if (gamepadRightPressed || keyboardRightPressed) {
      navigateLaunchers('right')
    }
    
    // Left stick navigation with cooldown
    const leftStick = input.getStick('LEFT')
    const currentTime = Date.now()
    
    if (stickCooldown <= currentTime) {
      if (leftStick.x < -0.5) {
        navigateLaunchers('left')
        stickCooldown = currentTime + STICK_COOLDOWN_TIME
      } else if (leftStick.x > 0.5) {
        navigateLaunchers('right')
        stickCooldown = currentTime + STICK_COOLDOWN_TIME
      }
    }
  }
  
  requestAnimationFrame(gameLoop)
}

// Start the game loop
requestAnimationFrame(gameLoop)

console.log('Controller prototype initialized')
console.log('Press and hold A (controller) or W (keyboard) to unlock')

