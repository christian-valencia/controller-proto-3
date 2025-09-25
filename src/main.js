import { InputManager } from './input/InputManager'
import { createHud } from './ui/Hud'

// DOM ELEMENT SELECTION ONLY - No DOM creation here
const windowsShell = document.getElementById('windows-shell')
const lockScreen = document.getElementById('lock-screen')
const systemTray = document.getElementById('system-tray')
const switcher = document.getElementById('switcher')
const clock = document.getElementById('clock')
const clock2 = document.getElementById('clock2')
const auth = document.getElementById('auth')
const authTextLeft = document.getElementById('auth-text-left')
const authTextRight = document.getElementById('auth-text-right')
const progressRing = document.getElementById('progress-ring')
const progressCircle = document.getElementById('progress-circle')
const hudContainer = document.getElementById('hud-container')
const statusContainer = document.getElementById('status-container')
const debugContainer = document.getElementById('debug-container')

// App containers
const greenApp = document.getElementById('green')
const blueApp = document.getElementById('blue')
const orangeApp = document.getElementById('orange')
const appContainers = [greenApp, blueApp, orangeApp]
const appNames = ['green', 'blue', 'orange']

// Initialize input and HUD systems
const input = new InputManager()
const hud = createHud()

// UI State Management
const UI_STATES = {
  LOCKED: 'locked',
  SHELL: 'shell',
  MENU: 'menu',
  APP: 'app'
}

let currentUIState = UI_STATES.LOCKED

// App Navigation State
let selectedAppIndex = 0 // 0=green, 1=blue, 2=orange
let lastStickNavTime = 0
const STICK_NAV_DELAY = 300 // 300ms delay between stick navigation

// Press and hold state
let isHolding = false
let holdStartTime = 0
const HOLD_DURATION = 700 // 0.7 seconds in milliseconds

// Lock screen state (legacy - will be replaced by UI_STATES)
let isLockScreenUnlocked = false

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
  console.log(`handleInputActions called - currentUIState: ${currentUIState}`)
  
  // State-based input routing
  switch (currentUIState) {
    case UI_STATES.LOCKED:
      console.log('Handling LOCKED state inputs')
      // Lock screen is active - handle press and hold for unlock
      handlePressAndHold()
      break
      
    case UI_STATES.SHELL:
      console.log('Handling SHELL state inputs')
      // Shell/desktop interactions
      handleShellInputs()
      break
      
    case UI_STATES.MENU:
      console.log('Handling MENU state inputs')
      // Menu system interactions
      handleMenuInputs()
      break
      
    case UI_STATES.APP:
      console.log('Handling APP state inputs')
      // App-specific interactions
      handleAppInputs()
      break
      
    default:
      console.warn('Unknown UI state:', currentUIState)
      break
  }
  
  // Global inputs (always available)
  if (input.justPressed('VIEW')) {
    console.log('View button pressed - global action')
    toggleFullscreen()
  }
  
  // Menu button handled per-state, but fallback for fullscreen
  if (input.justPressed('MENU') && currentUIState === UI_STATES.LOCKED) {
    toggleFullscreen()
  }
}

function handlePressAndHold() {
  // Only handle press and hold if lock screen is still locked
  if (currentUIState !== UI_STATES.LOCKED) return
  
  const isAPressed = input.isDown('A')
  
  if (isAPressed && !isHolding) {
    // Start holding
    isHolding = true
    holdStartTime = Date.now()
    if (progressCircle) {
      progressCircle.style.transition = 'none' // Remove CSS transition for manual control
      progressCircle.style.strokeDashoffset = '100.53' // Reset to full circle
    }
  } else if (isAPressed && isHolding) {
    // Continue holding - update progress
    const elapsed = Date.now() - holdStartTime
    const progress = Math.min(elapsed / HOLD_DURATION, 1)
    
    if (progressCircle) {
      // Calculate the dash offset (circumference = 2πr = 2π(16) ≈ 100.53)
      const circumference = 100.53
      const dashOffset = circumference * (1 - progress)
      progressCircle.style.strokeDashoffset = dashOffset.toString()
    }
    
    // Check if hold is complete
    if (progress >= 1) {
      onHoldComplete()
    }
  } else if (!isAPressed && isHolding) {
    // Released before completion
    resetHold()
  }
}

function onHoldComplete() {
  console.log('Hold complete! Authentication action triggered.')
  
  // Change to shell state
  changeUIState(UI_STATES.SHELL)
  
  // Fade out the auth container
  if (auth) {
    auth.classList.add('fade-out')
  }
  
  resetHold()
  
  // Success rumble feedback
  RumbleFeedback.confirmation()
  
  console.log('Lock screen unlocked! Shell interactions now active.')
}

function resetHold() {
  // Only reset if we're still on the lock screen
  if (currentUIState !== UI_STATES.LOCKED) return
  
  isHolding = false
  holdStartTime = 0
  if (progressCircle) {
    progressCircle.style.transition = 'stroke-dashoffset 0.2s ease' // Smooth reset
    progressCircle.style.strokeDashoffset = '100.53'
  }
}

function updateVisualFeedback() {
  // Update clock with current time (12-hour format, no AM/PM, no seconds)
  updateClock()
  
  // Update system tray state
  updateSystemTrayState()
  
  // Visual feedback can be added here if needed
  // Currently just HUD-based feedback
}

function updateSystemTrayState() {
  const isUnlocked = (currentUIState !== UI_STATES.LOCKED)
  
  // Update system tray state
  if (systemTray) {
    systemTray.className = isUnlocked ? 'unlocked' : 'locked'
  }
  
  // Update switcher state
  if (switcher) {
    switcher.className = isUnlocked ? 'unlocked' : 'locked'
  }
  
  // Hide/show main clock based on lock state
  if (clock) {
    if (isUnlocked) {
      clock.classList.add('hidden')
    } else {
      clock.classList.remove('hidden')
    }
  }
}

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
  
  // Update main lock screen clock
  if (clock) {
    clock.textContent = timeString
  }
  
  // Update system tray clock2
  if (clock2) {
    clock2.textContent = timeString
  }
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

// Enhanced Rumble Patterns
const RumbleFeedback = {
  // Light tap for navigation/selection
  lightTap: () => rumble(0.2, 50),
  
  // Confirmation for successful actions
  confirmation: () => rumble(0.8, 200),
  
  // Subtle navigation feedback
  navigation: () => rumble(0.1, 30),
  
  // Error/rejection feedback
  error: () => rumble(0.6, 100),
  
  // Menu open/close
  menuToggle: () => rumble(0.4, 150),
  
  // Selection change
  selectionChange: () => rumble(0.15, 25)
}

// State Management Functions
function changeUIState(newState) {
  console.log(`UI State: ${currentUIState} → ${newState}`)
  currentUIState = newState
  
  // Update legacy flag for compatibility
  isLockScreenUnlocked = (newState !== UI_STATES.LOCKED)
  
  // Trigger visual updates
  updateSystemTrayState()
  updateAppStates()
}

// App Navigation Functions
function navigateApps(direction) {
  console.log(`navigateApps called with direction: ${direction}`)
  console.log(`Current state: ${currentUIState}, selectedAppIndex: ${selectedAppIndex}`)
  
  const previousApp = selectedAppIndex
  
  if (direction === 'right') {
    selectedAppIndex = (selectedAppIndex + 1) % appContainers.length
  } else if (direction === 'left') {
    selectedAppIndex = (selectedAppIndex - 1 + appContainers.length) % appContainers.length
  }
  
  console.log(`App Navigation: ${appNames[previousApp]} → ${appNames[selectedAppIndex]}`)
  updateAppStates()
  RumbleFeedback.selectionChange()
}

function updateAppStates() {
  console.log(`updateAppStates called - currentUIState: ${currentUIState}, selectedAppIndex: ${selectedAppIndex}`)
  
  // Only update app states when in shell mode and unlocked
  if (currentUIState !== UI_STATES.SHELL) {
    console.log('Not updating app states - not in SHELL state')
    return
  }
  
  appContainers.forEach((container, index) => {
    if (container) {
      if (index === selectedAppIndex) {
        console.log(`Setting ${appNames[index]} to active`)
        container.classList.add('app-active')
        container.classList.remove('app-rest')
      } else {
        console.log(`Setting ${appNames[index]} to rest`)
        container.classList.add('app-rest')
        container.classList.remove('app-active')
      }
    }
  })
}

// Interaction Handler Functions
function handleShellInputs() {
  console.log('Shell inputs active - ready for desktop interactions!')
  
  const now = Date.now()
  
  // Simple test for all possible navigation inputs
  const testInputs = {
    LEFT: input.isDown('LEFT'),
    RIGHT: input.isDown('RIGHT'),
    LB: input.isDown('LB'),
    RB: input.isDown('RB'),
    leftJust: input.justPressed('LEFT'),
    rightJust: input.justPressed('RIGHT'),
    lbJust: input.justPressed('LB'),
    rbJust: input.justPressed('RB')
  }
  
  // Log if any input is detected
  const anyInput = Object.values(testInputs).some(val => val)
  if (anyInput) {
    console.log('Input detected:', testInputs)
  }
  
  // Debug: Check input state
  const leftPressed = input.justPressed('LEFT')
  const rightPressed = input.justPressed('RIGHT')
  const lbPressed = input.justPressed('LB')
  const rbPressed = input.justPressed('RB')
  
  if (leftPressed || rightPressed || lbPressed || rbPressed) {
    console.log('Navigation input detected:', { leftPressed, rightPressed, lbPressed, rbPressed })
  }
  
  // App Navigation - D-pad horizontal (check both justPressed and isDown)
  if (input.justPressed('LEFT') || (input.isDown('LEFT') && now - lastStickNavTime > STICK_NAV_DELAY)) {
    console.log('LEFT input detected - navigating left')
    navigateApps('left')
    lastStickNavTime = now
  }
  if (input.justPressed('RIGHT') || (input.isDown('RIGHT') && now - lastStickNavTime > STICK_NAV_DELAY)) {
    console.log('RIGHT input detected - navigating right')
    navigateApps('right')
    lastStickNavTime = now
  }
  
  // App Navigation - Shoulder buttons (check both justPressed and isDown)
  if (input.justPressed('LB') || (input.isDown('LB') && now - lastStickNavTime > STICK_NAV_DELAY)) {
    console.log('LB input detected - navigating left')
    navigateApps('left')
    lastStickNavTime = now
  }
  if (input.justPressed('RB') || (input.isDown('RB') && now - lastStickNavTime > STICK_NAV_DELAY)) {
    console.log('RB input detected - navigating right')
    navigateApps('right')
    lastStickNavTime = now
  }
  
  // App Navigation - Left stick horizontal
  const leftStick = input.getStick('LEFT')
  const currentTime = Date.now()
  if (leftStick.magnitude > 0.6 && currentTime - lastStickNavTime > STICK_NAV_DELAY) {
    if (leftStick.x > 0.6) {
      navigateApps('right')
      lastStickNavTime = currentTime
    } else if (leftStick.x < -0.6) {
      navigateApps('left')
      lastStickNavTime = currentTime
    }
  }
  
  // D-pad vertical navigation (for future use)
  if (input.justPressed('UP')) {
    console.log('Navigate UP - future functionality')
    RumbleFeedback.navigation()
  }
  if (input.justPressed('DOWN')) {
    console.log('Navigate DOWN - future functionality') 
    RumbleFeedback.navigation()
  }
  
  // Face buttons for actions
  if (input.justPressed('A')) {
    console.log(`Shell: A button - Launch ${appNames[selectedAppIndex]} app`)
    RumbleFeedback.confirmation()
  }
  if (input.justPressed('B')) {
    console.log('Shell: B button - Back/Cancel')
    RumbleFeedback.lightTap()
  }
  if (input.justPressed('X')) {
    console.log('Shell: X button - Context action')
    RumbleFeedback.lightTap()
  }
  if (input.justPressed('Y')) {
    console.log('Shell: Y button - Alternative action')
    RumbleFeedback.lightTap()
  }
  
  // Triggers for app switching or other actions
  if (input.justPressed('LT')) {
    console.log('Shell: LT - Previous app')
    RumbleFeedback.menuToggle()
  }
  if (input.justPressed('RT')) {
    console.log('Shell: RT - Next app')
    RumbleFeedback.menuToggle()
  }
  
  // Right stick for scrolling (future use)
  const rightStick = input.getStick('RIGHT')
  if (rightStick.magnitude > 0.3) {
    console.log(`Shell: Right stick scrolling - x:${rightStick.x.toFixed(2)}, y:${rightStick.y.toFixed(2)}`)
    // Smooth scrolling without rumble
  }
  
  // Stick clicks
  if (input.justPressed('LS')) {
    console.log('Shell: Left stick click - Quick action')
    RumbleFeedback.lightTap()
  }
  if (input.justPressed('RS')) {
    console.log('Shell: Right stick click - Context menu')
    RumbleFeedback.lightTap()
  }
  
  // Menu system access
  if (input.justPressed('MENU')) {
    console.log('Shell: Opening main menu')
    changeUIState(UI_STATES.MENU)
    RumbleFeedback.menuToggle()
  }
}

function handleMenuInputs() {
  console.log('Menu inputs active - navigating menu system!')
  
  // Menu navigation
  if (input.justPressed('UP')) {
    console.log('Menu: Navigate up')
    RumbleFeedback.selectionChange()
  }
  if (input.justPressed('DOWN')) {
    console.log('Menu: Navigate down')
    RumbleFeedback.selectionChange()
  }
  
  // Menu actions
  if (input.justPressed('A')) {
    console.log('Menu: Select item')
    RumbleFeedback.confirmation()
  }
  if (input.justPressed('B')) {
    console.log('Menu: Back to shell')
    changeUIState(UI_STATES.SHELL)
    RumbleFeedback.menuToggle()
  }
  
  // Close menu
  if (input.justPressed('MENU')) {
    console.log('Menu: Closing menu')
    changeUIState(UI_STATES.SHELL)
    RumbleFeedback.menuToggle()
  }
}

function handleAppInputs() {
  console.log('App inputs active - app-specific controls!')
  
  // App-specific controls would go here
  if (input.justPressed('B')) {
    console.log('App: Back to shell')
    changeUIState(UI_STATES.SHELL)
    RumbleFeedback.lightTap()
  }
  
  // Pass through other inputs to app
  // This is where you'd delegate to specific app input handlers
}

// Start the application
requestAnimationFrame(loop)