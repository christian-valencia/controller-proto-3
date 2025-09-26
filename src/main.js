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
// const hud = createHud() // Hidden for clean UI experience

// Direct B button handler for shell library (backup for InputManager)
let lastBKeyPress = 0
window.addEventListener('keydown', (e) => {
  if ((e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'l') && 
      currentUIState === UI_STATES.SHELL) {
    const now = Date.now()
    if (now - lastBKeyPress > 200) { // 200ms debounce
      const shellLibrary = document.getElementById('shell-library')
      const shellSettings = document.getElementById('shell-settings')
      const shellNotifications = document.getElementById('shell-notifications')
      const shellGallery = document.getElementById('shell-gallery')
      
      if (shellLibrary && shellLibrary.classList.contains('visible')) {
        console.log('Direct B button handler - closing library')
        hideShellLibrary()
        lastBKeyPress = now
      } else if (shellSettings && shellSettings.classList.contains('visible')) {
        console.log('Direct B button handler - closing settings')
        hideShellSettings()
        lastBKeyPress = now
      } else if (shellNotifications && shellNotifications.classList.contains('visible')) {
        console.log('Direct B button handler - closing notifications')
        hideShellNotifications()
        lastBKeyPress = now
      } else if (shellGallery && shellGallery.classList.contains('visible')) {
        console.log('Direct B button handler - closing gallery')
        hideShellGallery()
        lastBKeyPress = now
      }
    }
  }
})

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

// Preview Scaling State
let isPreviewScaled = false
let lastAButtonPress = 0
const A_BUTTON_DEBOUNCE = 300 // 300ms debounce for A button

// Focus Navigation State  
let focusArea = 'preview' // 'preview', 'shell-nav', or 'shell-surface'
let selectedNavIndex = 0 // 0=library, 1=settings, 2=notifications, 3=gallery
let previousFocusState = { area: 'preview', navIndex: 0, appIndex: 0 } // Store previous focus state
let currentShellSurface = null // Track which shell surface is currently open
const navItems = ['library', 'settings', 'notifications', 'gallery']// Press and hold state
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
  // hud.render(input) // Hidden for clean UI experience
  // Clear any existing HUD content
  // if (hudContainer) hudContainer.innerHTML = ''
  
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
  
  const isYPressed = input.isDown('Y')
  
  if (isYPressed && !isHolding) {
    // Start holding
    isHolding = true
    holdStartTime = Date.now()
    if (progressCircle) {
      progressCircle.style.transition = 'none' // Remove CSS transition for manual control
      progressCircle.style.strokeDashoffset = '100.53' // Reset to full circle
    }
  } else if (isYPressed && isHolding) {
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
  } else if (!isYPressed && isHolding) {
    // Released before completion
    resetHold()
  }
}

function onHoldComplete() {
  console.log('Hold complete! Authentication action triggered.')
  
  // Reset preview scaling state
  isPreviewScaled = false
  
  // Change to shell state
  changeUIState(UI_STATES.SHELL)
  
  // Ensure preview containers are positioned correctly
  updateAppStates()
  
  // Show shell navigation with slide-up animation
  const shellNav = document.getElementById('shell-nav')
  if (shellNav) {
    shellNav.classList.add('visible')
  }
  
  // Show focus container with active preview highlighting
  const focusContainer = document.getElementById('focus')
  if (focusContainer) {
    focusContainer.classList.add('visible')
    // Update position after a brief delay to ensure previews are positioned
    setTimeout(() => {
      updateFocusPosition()
    }, 100)
  }
  
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

function navigateShellNav(direction) {
  console.log(`navigateShellNav called with direction: ${direction}`)
  console.log(`Current selectedNavIndex: ${selectedNavIndex} (${navItems[selectedNavIndex]})`)
  
  const previousNav = selectedNavIndex
  
  if (direction === 'right') {
    selectedNavIndex = (selectedNavIndex + 1) % navItems.length
  } else if (direction === 'left') {
    selectedNavIndex = (selectedNavIndex - 1 + navItems.length) % navItems.length
  }
  
  console.log(`Shell Nav Navigation: ${navItems[previousNav]} → ${navItems[selectedNavIndex]}`)
  updateFocusPosition()
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
  
  // Update preview container positions based on active app
  updatePreviewPositions()
}

function updatePreviewPositions() {
  console.log(`updatePreviewPositions called - selectedAppIndex: ${selectedAppIndex}`)
  
  const previewContainers = [
    document.getElementById('green-preview'),
    document.getElementById('blue-preview'),
    document.getElementById('orange-preview')
  ]
  
  // Remove all positioning classes and scaling first
  previewContainers.forEach(container => {
    if (container) {
      container.classList.remove('preview-center', 'preview-left', 'preview-right', 'preview-far-left', 'preview-far-right', 'preview-scaled')
    }
  })
  
  // Reset scaling state when switching apps
  isPreviewScaled = false
  
  // Add positioning classes based on selected app
  switch (selectedAppIndex) {
    case 0: // Green active
      previewContainers[0]?.classList.add('preview-center')  // Green in center
      previewContainers[1]?.classList.add('preview-right')   // Blue to the right
      previewContainers[2]?.classList.add('preview-far-right') // Orange far right
      break
    case 1: // Blue active  
      previewContainers[0]?.classList.add('preview-left')    // Green to the left
      previewContainers[1]?.classList.add('preview-center')  // Blue in center
      previewContainers[2]?.classList.add('preview-right')   // Orange to the right
      break
    case 2: // Orange active
      previewContainers[0]?.classList.add('preview-far-left') // Green far left
      previewContainers[1]?.classList.add('preview-left')    // Blue to the left
      previewContainers[2]?.classList.add('preview-center')  // Orange in center
      break
  }
  
  // Update focus container position
  updateFocusPosition()
}

function togglePreviewScaling() {
  const previewContainers = [
    document.getElementById('green-preview'),
    document.getElementById('blue-preview'),
    document.getElementById('orange-preview')
  ]
  
  const activePreview = previewContainers[selectedAppIndex]
  if (!activePreview) return
  
  if (isPreviewScaled) {
    // Scale back down to 50%
    activePreview.classList.remove('preview-scaled')
    isPreviewScaled = false
  } else {
    // Scale up to 100%
    activePreview.classList.add('preview-scaled')
    isPreviewScaled = true
  }
  
  // Update focus container to match new size
  updateFocusPosition()
  
  RumbleFeedback.confirmation()
}

function updateFocusPosition() {
  const focusContainer = document.getElementById('focus')
  if (!focusContainer) return
  
  if (focusArea === 'preview') {
    // Focus on preview area
    focusContainer.classList.remove('focus-nav')
    focusContainer.classList.add('focus-preview')
    
    const previewContainers = [
      document.getElementById('green-preview'),
      document.getElementById('blue-preview'),
      document.getElementById('orange-preview')
    ]
    
    const activePreview = previewContainers[selectedAppIndex]
    if (!activePreview) return
    
    // Check if the active preview is scaled
    const isScaled = activePreview.classList.contains('preview-scaled')
    
    // Match the size of the active preview and center it
    if (isScaled) {
      // When preview is scaled to 100%
      focusContainer.style.width = '100vw'
      focusContainer.style.height = '100vh'
    } else {
      // Normal size - match the centered preview (50vw x 50vh)
      focusContainer.style.width = '50vw'
      focusContainer.style.height = '50vh'
    }
    
    // Center position
    focusContainer.style.top = '50%'
    focusContainer.style.left = '50%'
    focusContainer.style.transform = 'translate(-50%, -50%)'
    
  } else if (focusArea === 'shell-nav') {
    // Focus on shell navigation area
    focusContainer.classList.remove('focus-preview')
    focusContainer.classList.add('focus-nav')
    
    const navItemElement = document.getElementById(navItems[selectedNavIndex])
    if (!navItemElement) return
    
    // Get the position of the nav item
    const rect = navItemElement.getBoundingClientRect()
    const shellRect = document.getElementById('windows-shell').getBoundingClientRect()
    
    // Position focus over the nav item (64x64px)
    focusContainer.style.width = '64px'
    focusContainer.style.height = '64px'
    focusContainer.style.top = `${rect.top - shellRect.top + rect.height/2}px`
    focusContainer.style.left = `${rect.left - shellRect.left + rect.width/2}px`
    focusContainer.style.transform = 'translate(-50%, -50%)'
  }
}

function positionFocusUnderHeader() {
  const focusContainer = document.getElementById('focus')
  if (!focusContainer) return
  
  // Position focus container under the h1 header (48px from left, 92px from top)
  focusContainer.classList.remove('focus-preview', 'focus-nav')
  focusContainer.classList.add('focus-shell-surface')
  focusContainer.style.width = '200px'
  focusContainer.style.height = '32px'
  focusContainer.style.top = '92px' // 36px (h1 top) + 36px (h1 height) + 20px margin
  focusContainer.style.left = '48px' // Same as h1 left position (corrected from 36px)
  focusContainer.style.transform = 'none'
}

function restorePreviousFocus() {
  // Restore previous focus state
  focusArea = previousFocusState.area
  selectedAppIndex = previousFocusState.appIndex
  selectedNavIndex = previousFocusState.navIndex
  updateFocusPosition()
}

// Shell Library Functions
function showShellLibrary() {
  // Store current focus state before opening
  previousFocusState = {
    area: focusArea,
    navIndex: selectedNavIndex,
    appIndex: selectedAppIndex
  }
  
  const shellLibrary = document.getElementById('shell-library')
  if (shellLibrary) {
    shellLibrary.classList.add('visible')
    console.log('Shell Library sliding in from left')
    // Set focus area to shell surface and track which surface is open
    focusArea = 'shell-surface'
    currentShellSurface = 'library'
    // Position focus under header
    positionFocusUnderHeader()
  }
}

function hideShellLibrary() {
  const shellLibrary = document.getElementById('shell-library')
  
  if (shellLibrary) {
    shellLibrary.classList.remove('visible')
    console.log('Shell Library sliding out to left')
    // Clear shell surface state
    currentShellSurface = null
    // Restore previous focus position
    restorePreviousFocus()
  }
}

function showShellSettings() {
  // Store current focus state before opening
  previousFocusState = {
    area: focusArea,
    navIndex: selectedNavIndex,
    appIndex: selectedAppIndex
  }
  
  const shellSettings = document.getElementById('shell-settings')
  if (shellSettings) {
    shellSettings.classList.add('visible')
    console.log('Shell Settings sliding in from left')
    // Set focus area to shell surface and track which surface is open
    focusArea = 'shell-surface'
    currentShellSurface = 'settings'
    // Position focus under header
    positionFocusUnderHeader()
  }
}

function hideShellSettings() {
  const shellSettings = document.getElementById('shell-settings')
  
  if (shellSettings) {
    shellSettings.classList.remove('visible')
    console.log('Shell Settings sliding out to left')
    // Clear shell surface state
    currentShellSurface = null
    // Restore previous focus position
    restorePreviousFocus()
  }
}

function showShellNotifications() {
  // Store current focus state before opening
  previousFocusState = {
    area: focusArea,
    navIndex: selectedNavIndex,
    appIndex: selectedAppIndex
  }
  
  const shellNotifications = document.getElementById('shell-notifications')
  if (shellNotifications) {
    shellNotifications.classList.add('visible')
    console.log('Shell Notifications sliding in from left')
    // Set focus area to shell surface and track which surface is open
    focusArea = 'shell-surface'
    currentShellSurface = 'notifications'
    // Position focus under header
    positionFocusUnderHeader()
  }
}

function hideShellNotifications() {
  const shellNotifications = document.getElementById('shell-notifications')
  
  if (shellNotifications) {
    shellNotifications.classList.remove('visible')
    console.log('Shell Notifications sliding out to left')
    // Clear shell surface state
    currentShellSurface = null
    // Restore previous focus position
    restorePreviousFocus()
  }
}

function showShellGallery() {
  // Store current focus state before opening
  previousFocusState = {
    area: focusArea,
    navIndex: selectedNavIndex,
    appIndex: selectedAppIndex
  }
  
  const shellGallery = document.getElementById('shell-gallery')
  if (shellGallery) {
    shellGallery.classList.add('visible')
    console.log('Shell Gallery sliding in from left')
    // Set focus area to shell surface and track which surface is open
    focusArea = 'shell-surface'
    currentShellSurface = 'gallery'
    // Position focus under header
    positionFocusUnderHeader()
  }
}

function hideShellGallery() {
  const shellGallery = document.getElementById('shell-gallery')
  
  if (shellGallery) {
    shellGallery.classList.remove('visible')
    console.log('Shell Gallery sliding out to left')
    // Clear shell surface state
    currentShellSurface = null
    // Restore previous focus position
    restorePreviousFocus()
  }
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
  
  // Horizontal Navigation - D-pad left/right (check both justPressed and isDown)
  if (input.justPressed('LEFT') || (input.isDown('LEFT') && now - lastStickNavTime > STICK_NAV_DELAY)) {
    console.log('LEFT input detected')
    // Only allow navigation if not in a shell surface
    if (focusArea !== 'shell-surface') {
      if (focusArea === 'preview') {
        console.log('Navigating apps left')
        navigateApps('left')
      } else if (focusArea === 'shell-nav') {
        console.log('Navigating shell-nav left')
        navigateShellNav('left')
      }
      lastStickNavTime = now
    } else {
      console.log('LEFT navigation blocked - currently in shell surface:', currentShellSurface)
      // Future: Handle shell surface internal navigation
    }
  }
  if (input.justPressed('RIGHT') || (input.isDown('RIGHT') && now - lastStickNavTime > STICK_NAV_DELAY)) {
    console.log('RIGHT input detected')
    // Only allow navigation if not in a shell surface
    if (focusArea !== 'shell-surface') {
      if (focusArea === 'preview') {
        console.log('Navigating apps right')
        navigateApps('right')
      } else if (focusArea === 'shell-nav') {
        console.log('Navigating shell-nav right')
        navigateShellNav('right')
      }
      lastStickNavTime = now
    } else {
      console.log('RIGHT navigation blocked - currently in shell surface:', currentShellSurface)
      // Future: Handle shell surface internal navigation
    }
  }
  
  // Horizontal Navigation - Shoulder buttons (check both justPressed and isDown)
  if (input.justPressed('LB') || (input.isDown('LB') && now - lastStickNavTime > STICK_NAV_DELAY)) {
    console.log('LB input detected')
    // Only allow navigation if not in a shell surface
    if (focusArea !== 'shell-surface') {
      if (focusArea === 'preview') {
        console.log('Navigating apps left')
        navigateApps('left')
      } else if (focusArea === 'shell-nav') {
        console.log('Navigating shell-nav left')
        navigateShellNav('left')
      }
      lastStickNavTime = now
    } else {
      console.log('LB navigation blocked - currently in shell surface:', currentShellSurface)
    }
  }
  if (input.justPressed('RB') || (input.isDown('RB') && now - lastStickNavTime > STICK_NAV_DELAY)) {
    console.log('RB input detected')
    // Only allow navigation if not in a shell surface
    if (focusArea !== 'shell-surface') {
      if (focusArea === 'preview') {
        console.log('Navigating apps right')
        navigateApps('right')
      } else if (focusArea === 'shell-nav') {
        console.log('Navigating shell-nav right')
        navigateShellNav('right')
      }
      lastStickNavTime = now
    } else {
      console.log('RB navigation blocked - currently in shell surface:', currentShellSurface)
    }
  }
  
  // Horizontal Navigation - Left stick horizontal
  const leftStick = input.getStick('LEFT')
  const currentTime = Date.now()
  if (leftStick.magnitude > 0.6 && currentTime - lastStickNavTime > STICK_NAV_DELAY) {
    // Only allow navigation if not in a shell surface
    if (focusArea !== 'shell-surface') {
      if (leftStick.x > 0.6) {
        if (focusArea === 'preview') {
          navigateApps('right')
        } else if (focusArea === 'shell-nav') {
          navigateShellNav('right')
        }
        lastStickNavTime = currentTime
      } else if (leftStick.x < -0.6) {
        if (focusArea === 'preview') {
          navigateApps('left')
        } else if (focusArea === 'shell-nav') {
          navigateShellNav('left')
        }
        lastStickNavTime = currentTime
      }
    } else {
      console.log('Stick navigation blocked - currently in shell surface:', currentShellSurface)
    }
  }
  
  // Vertical Navigation - Left stick vertical (UP/DOWN focus area switching)
  if (leftStick.magnitude > 0.6 && currentTime - lastStickNavTime > STICK_NAV_DELAY) {
    // Only allow focus area switching if not in a shell surface
    if (focusArea !== 'shell-surface') {
      if (leftStick.y > 0.6) { // Stick pushed UP
        console.log('Analog stick UP detected - moving focus back to preview')
        if (focusArea === 'shell-nav') {
          focusArea = 'preview'
          updateFocusPosition()
          lastStickNavTime = currentTime
        }
      } else if (leftStick.y < -0.6) { // Stick pushed DOWN
        console.log('Analog stick DOWN detected - moving focus to shell-nav')
        if (focusArea === 'preview') {
          focusArea = 'shell-nav'
          selectedNavIndex = 0 // Start at library
          updateFocusPosition()
          lastStickNavTime = currentTime
        }
      }
    } else {
      console.log('Analog stick vertical navigation blocked - currently in shell surface:', currentShellSurface)
    }
  }
  
  // Focus area navigation - DOWN moves from preview to shell-nav, UP moves back
  if (input.justPressed('DOWN') || (input.isDown('DOWN') && now - lastStickNavTime > STICK_NAV_DELAY)) {
    // Only allow focus area switching if not in a shell surface
    if (focusArea !== 'shell-surface') {
      console.log('DOWN input detected - moving focus to shell-nav')
      if (focusArea === 'preview') {
        focusArea = 'shell-nav'
        selectedNavIndex = 0 // Start at library
        updateFocusPosition()
        lastStickNavTime = now
      }
    } else {
      console.log('DOWN input blocked - currently in shell surface:', currentShellSurface)
    }
  }
  if (input.justPressed('UP') || (input.isDown('UP') && now - lastStickNavTime > STICK_NAV_DELAY)) {
    // Only allow focus area switching if not in a shell surface
    if (focusArea !== 'shell-surface') {
      console.log('UP input detected - moving focus back to preview')
      if (focusArea === 'shell-nav') {
        focusArea = 'preview'
        updateFocusPosition()
        lastStickNavTime = now
      }
    } else {
      console.log('UP input blocked - currently in shell surface:', currentShellSurface)
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
  const buttonTime = Date.now()
  
  if (input.isDown('A') && (buttonTime - lastAButtonPress) > A_BUTTON_DEBOUNCE) {
    lastAButtonPress = buttonTime
    if (focusArea === 'preview') {
      // A button only scales previews when focus is on preview area
      togglePreviewScaling()
    } else if (focusArea === 'shell-nav') {
      // A button actions based on selected nav item
      if (selectedNavIndex === 0) { // Library selected
        console.log('Opening Library...')
        showShellLibrary()
        RumbleFeedback.confirmation()
      } else if (selectedNavIndex === 1) { // Settings selected
        console.log('Opening Settings...')
        showShellSettings()
        RumbleFeedback.confirmation()
      } else if (selectedNavIndex === 2) { // Notifications selected
        console.log('Opening Notifications...')
        showShellNotifications()
        RumbleFeedback.confirmation()
      } else if (selectedNavIndex === 3) { // Gallery selected
        console.log('Opening Gallery...')
        showShellGallery()
        RumbleFeedback.confirmation()
      }
    } else if (focusArea === 'shell-surface') {
      // A button actions within shell surface (future functionality)
      console.log('A button pressed in shell surface:', currentShellSurface)
      // Future: Handle shell surface internal actions
      RumbleFeedback.lightTap()
    }
  }
  // B button handling with InputManager fallback
  if (input.justPressed('B')) {
    const shellLibrary = document.getElementById('shell-library')
    const shellSettings = document.getElementById('shell-settings')
    const shellNotifications = document.getElementById('shell-notifications')
    const shellGallery = document.getElementById('shell-gallery')
    
    console.log('B button pressed via InputManager')
    
    if (shellLibrary && shellLibrary.classList.contains('visible')) {
      // Hide shell library if it's visible
      console.log('Shell: B button - Closing Library')
      hideShellLibrary()
      RumbleFeedback.lightTap()
    } else if (shellSettings && shellSettings.classList.contains('visible')) {
      // Hide shell settings if it's visible
      console.log('Shell: B button - Closing Settings')
      hideShellSettings()
      RumbleFeedback.lightTap()
    } else if (shellNotifications && shellNotifications.classList.contains('visible')) {
      // Hide shell notifications if it's visible
      console.log('Shell: B button - Closing Notifications')
      hideShellNotifications()
      RumbleFeedback.lightTap()
    } else if (shellGallery && shellGallery.classList.contains('visible')) {
      // Hide shell gallery if it's visible
      console.log('Shell: B button - Closing Gallery')
      hideShellGallery()
      RumbleFeedback.lightTap()
    } else {
      // Default B button behavior
      console.log('Shell: B button - Back/Cancel')
      RumbleFeedback.lightTap()
    }
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