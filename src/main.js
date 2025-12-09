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

// Shell nav elements
const shellNavItems = [
  document.getElementById('shell-runningapp'),
  document.getElementById('shell-power'),
  document.getElementById('shell-search'),
  document.getElementById('shell-overlay'),
  document.getElementById('shell-settings'),
  document.getElementById('shell-notifications')
]

// Launcher elements
const launcherItems = [
  document.getElementById('launcher-xbox'),
  document.getElementById('launcher-steam'),
  document.getElementById('launcher-epic'),
  document.getElementById('launcher-battlenet'),
  document.getElementById('launcher-ea'),
  document.getElementById('launcher-riot')
]

// My Games elements
const gameItems = [
  document.getElementById('game-1'),
  document.getElementById('game-2'),
  document.getElementById('game-3'),
  document.getElementById('game-4'),
  document.getElementById('game-5'),
  document.getElementById('game-6')
]

// My Apps elements
const appItems = [
  document.getElementById('app-1'),
  document.getElementById('app-2'),
  document.getElementById('app-3'),
  document.getElementById('app-4'),
  document.getElementById('app-5'),
  document.getElementById('app-6')
]

// All navigation items in 2D grid
const navigationGrid = [
  shellNavItems,  // Row 0
  launcherItems,  // Row 1
  gameItems,      // Row 2
  appItems        // Row 3
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

// Navigation state (2D grid)
let currentRow = 1  // Start on launchers
let currentCol = 0
let scrollOffset = 0

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
// NAVIGATION
// ============================================================================
function updateScroll() {
  const SHELL_NAV_HEIGHT = 80
  const CONTAINER_HEIGHT = 212
  const CONTAINER_GAP = 44
  const BOTTOM_MARGIN = 120
  const VIEWPORT_HEIGHT = 720
  
  // Calculate the y position of the current row
  // Row 0 is shell-nav (no scrolling needed)
  // Rows 1+ are the content containers
  let rowYPosition, rowBottomPosition
  
  if (currentRow === 0) {
    // Shell nav is always at the top, no scroll needed
    scrollOffset = 0
  } else {
    // Content rows start after shell-nav
    const contentRow = currentRow - 1
    rowYPosition = SHELL_NAV_HEIGHT + (contentRow * (CONTAINER_HEIGHT + CONTAINER_GAP))
    rowBottomPosition = rowYPosition + CONTAINER_HEIGHT
    
    // Calculate how much we need to scroll to keep the row visible with bottom margin
    const maxVisibleBottom = VIEWPORT_HEIGHT - BOTTOM_MARGIN
    
    if (rowBottomPosition > maxVisibleBottom) {
      scrollOffset = -(rowBottomPosition - maxVisibleBottom)
    } else if (rowYPosition < SHELL_NAV_HEIGHT) {
      scrollOffset = -(rowYPosition - SHELL_NAV_HEIGHT)
    } else if (currentRow === 1) {
      scrollOffset = 0
    }
  }
  
  // Apply scroll to all containers
  const launchers = document.getElementById('launchers')
  const myGames = document.getElementById('my-games')
  const myApps = document.getElementById('my-apps')
  
  if (launchers) launchers.style.transform = `translate(-50%, ${scrollOffset}px)`
  if (myGames) myGames.style.transform = `translate(-50%, ${scrollOffset}px)`
  if (myApps) myApps.style.transform = `translate(-50%, ${scrollOffset}px)`
}

function updateFocus() {
  // Remove focus from all items
  navigationGrid.forEach(row => {
    row.forEach(item => {
      if (item) item.classList.remove('focused')
    })
  })
  
  // Add focus to current item
  const currentItem = navigationGrid[currentRow]?.[currentCol]
  if (currentItem) {
    currentItem.classList.add('focused')
  }
  
  // Update scroll position
  updateScroll()
}

function navigate(direction) {
  switch(direction) {
    case 'left':
      if (currentCol > 0) {
        currentCol--
        updateFocus()
      }
      break
    case 'right':
      if (currentCol < navigationGrid[currentRow].length - 1) {
        currentCol++
        updateFocus()
      }
      break
    case 'up':
      if (currentRow > 0) {
        currentRow--
        // Keep same column, or clamp to available columns in new row
        currentCol = Math.min(currentCol, navigationGrid[currentRow].length - 1)
        updateFocus()
      }
      break
    case 'down':
      if (currentRow < navigationGrid.length - 1) {
        currentRow++
        // Keep same column, or clamp to available columns in new row
        currentCol = Math.min(currentCol, navigationGrid[currentRow].length - 1)
        updateFocus()
      }
      break
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
        // Clear pending keyboard inputs from lock screen
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
  
  // Handle navigation when unlocked
  else if (currentUIState === UI_STATES.UNLOCKED) {
    // D-pad and arrow key navigation
    if (input.gamepad.justPressed('LEFT') || input.keyboard.justPressed('LEFT')) {
      navigate('left')
    }
    if (input.gamepad.justPressed('RIGHT') || input.keyboard.justPressed('RIGHT')) {
      navigate('right')
    }
    if (input.gamepad.justPressed('UP') || input.keyboard.justPressed('UP')) {
      navigate('up')
    }
    if (input.gamepad.justPressed('DOWN') || input.keyboard.justPressed('DOWN')) {
      navigate('down')
    }
    
    // Bumpers for shell-nav navigation
    if (currentRow === 0) {
      if (input.gamepad.justPressed('LB')) {
        navigate('left')
      }
      if (input.gamepad.justPressed('RB')) {
        navigate('right')
      }
    }
    
    // Left stick navigation with cooldown
    const leftStick = input.getStick('LEFT')
    const currentTime = Date.now()
    
    if (stickCooldown <= currentTime) {
      if (leftStick.x < -0.5) {
        navigate('left')
        stickCooldown = currentTime + STICK_COOLDOWN_TIME
      } else if (leftStick.x > 0.5) {
        navigate('right')
        stickCooldown = currentTime + STICK_COOLDOWN_TIME
      } else if (leftStick.y > 0.5) {
        navigate('up')
        stickCooldown = currentTime + STICK_COOLDOWN_TIME
      } else if (leftStick.y < -0.5) {
        navigate('down')
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

