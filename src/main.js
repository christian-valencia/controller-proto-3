import { InputManager } from './input/InputManager'

// ============================================================================
// DEBUG MODE - Set to false for production to remove console logs
// ============================================================================
const DEBUG = true

// DOM ELEMENT SELECTION ONLY - No DOM creation here
const windowsShell = document.getElementById('windows-shell')
const lockScreen = document.getElementById('lock-screen')
const switcher = document.getElementById('switcher')
const clock = document.getElementById('clock')
const clock2 = document.getElementById('clock2')
const auth = document.getElementById('auth')
const progressRing = document.getElementById('progress-ring')
const progressCircle = document.getElementById('progress-circle')

// App containers
const greenApp = document.getElementById('green')
const blueApp = document.getElementById('blue')
const orangeApp = document.getElementById('orange')
let appContainers = [greenApp, blueApp, orangeApp]
let appNames = ['green', 'blue', 'orange']

// Function to get visible (non-hidden) apps
function getVisibleApps() {
  return appNames.filter(name => {
    const container = document.getElementById(name)
    return container && !container.classList.contains('hidden-app')
  })
}

// Initialize input system
const input = new InputManager()

// Debug: Add gamepad connection event listeners
if (DEBUG) {
  // Check gamepad API availability immediately
  console.log('🎮 Gamepad API available:', 'getGamepads' in navigator)
  console.log('🎮 User agent:', navigator.userAgent)
  console.log('🎮 Is secure context (HTTPS):', window.isSecureContext)
  
  window.addEventListener('gamepadconnected', (e) => {
    console.log('🎮 BROWSER EVENT: Gamepad connected:', e.gamepad.id)
    console.log('🎮 Gamepad index:', e.gamepad.index)
    console.log('🎮 Gamepad buttons:', e.gamepad.buttons.length)
    console.log('🎮 Gamepad axes:', e.gamepad.axes.length)
  })
  
  window.addEventListener('gamepaddisconnected', (e) => {
    console.log('🎮 BROWSER EVENT: Gamepad disconnected:', e.gamepad.id)
  })
  
  // Try to force gamepad detection on any user interaction
  document.addEventListener('click', () => {
    console.log('🎮 Click detected - checking for gamepads...')
    const gamepads = navigator.getGamepads()
    console.log('🎮 Post-click gamepad check:', gamepads)
  }, { once: true })
  
  // Also try on any key press
  document.addEventListener('keydown', () => {
    console.log('🎮 Keydown detected - checking for gamepads...')
    const gamepads = navigator.getGamepads()
    console.log('🎮 Post-keydown gamepad check:', gamepads)
  }, { once: true })
}

// Direct B button handler for closing shell containers (backup for InputManager)
let lastBKeyPress = 0
window.addEventListener('keydown', (e) => {
  if ((e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'l') && 
      currentUIState === UI_STATES.SHELL && currentShellSurface) {
    const now = Date.now()
    if (now - lastBKeyPress > B_BUTTON_DEBOUNCE) {
      hideShellContainer(currentShellSurface)
      lastBKeyPress = now
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
let selectedAppIndex = 0 // 0=green (Silksong), 1=blue (Xbox), 2=orange (Discord)
let lastStickNavTime = 0

// Preview Scaling State
let isPreviewScaled = false
let lastAButtonPress = 0

// Overlay State
let isOverlayVisible = false

// Focus Navigation State
let focusArea = 'preview' // 'preview', 'shell-nav', 'shell-surface', 'library-launchers', 'settings-nav', 'gallery-nav', 'gallery-media', 'notifications-nav', 'notifications-content'
let selectedNavIndex = 0 // 0=library, 1=settings, 2=gallery, 3=notifications
let previousFocusState = { area: 'preview', navIndex: 0, appIndex: 0 } // Store previous focus state
let currentShellSurface = null // Track which shell surface is currently open
const navItems = ['library', 'settings', 'gallery', 'notifications']

// Steam reveal animation state
let isSteamRevealing = false // Flag to disable input during Steam reveal animation
let hasSteamBeenLaunched = false // Flag to prevent Steam from being launched again

// Library Launchers Navigation State
let selectedLauncherIndex = 0 // Index of currently selected launcher app
let selectedLauncherRow = -1 // Index of currently selected row (-1=search box, 0-2=launcher rows)
const LAUNCHER_ROWS = 3
const LAUNCHER_COUNTS_PER_ROW = [5, 8, 6] // Number of items in each row: Launchers(5), All games(8), All apps(6)

// Settings Navigation State
let selectedSettingsNavIndex = 0 // Index of currently selected settings nav item (0-10)
const SETTINGS_NAV_ITEMS = 11 // Total number of nav items

// Gallery Navigation State
let selectedGalleryNavIndex = 0 // Index of currently selected gallery nav item (0-3)
const GALLERY_NAV_ITEMS = 4 // Total number of nav items (All, Photos, Videos, Files)

// Notifications Navigation State
let selectedNotificationsNavIndex = 0 // Index of currently selected notifications nav item (0-4)
const NOTIFICATIONS_NAV_ITEMS = 5 // Total number of nav items (All, Social, Game updates, App updates, System updates)

// Notifications Content State
let selectedNotificationIndex = 0 // Index of currently selected notification item (0-7 for 8 notifications)
const NOTIFICATION_ITEMS = 8 // Total number of notification containers

// Gallery Media Navigation State
let selectedMediaRow = 0 // Index of currently selected media row (0-3 for 4 rows of 2 items)
let selectedMediaIndex = 0 // Index within the row (0-1 for 2 items per row)
const MEDIA_ITEMS_PER_ROW = 2
const MEDIA_ROWS = 4 // 8 items total, 2 per row = 4 rows

// Settings Display Controls State
let selectedDisplayControlIndex = 0 // Index of currently selected display control (0-8: 3 controls per section × 3 sections)
const DISPLAY_CONTROLS = 9 // Total number of display controls (3 sections × 3 controls each)

// Individual slider values for each slider control (indices 0, 3, 6)
let sliderValues = [50, 50, 50] // Three independent slider values (0-100)

// Individual cycle selector states for each cycle control (indices 1, 2, 4, 5, 7, 8)
let cycleValues = ['Value 1', 'Value 2', 'Value 3']
let cycleSelectedIndices = [0, 0, 0, 0, 0, 0] // Six independent cycle selector indices
let lastCycleTime = 0

// Press and hold state (for lock screen)
let isHolding = false
let holdStartTime = 0

// VIEW button press and hold state (for scaling down preview)
let isXHolding = false
let xHoldStartTime = 0

// ============================================================================
// CONSTANTS
// ============================================================================
const STICK_NAV_DELAY = 300
const A_BUTTON_DEBOUNCE = 300
const CYCLE_DELAY = 300
const HOLD_DURATION = 700
const X_HOLD_DURATION = 700
const B_BUTTON_DEBOUNCE = 200
const STICK_THRESHOLD = 0.6
const SLIDER_STICK_THRESHOLD = 0.3

// Fullscreen toggle via keyboard or View/Menu buttons
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'f') {
    toggleFullscreen()
  }
})

// X button overlay toggle is handled by handleXButtonHold() via InputManager
// D key maps to X button, K key also maps to X button

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(console.error)
  } else {
    document.exitFullscreen().catch(console.error)
  }
}

// Main game loop  
let debugCounter = 0
function loop() {
  input.update()
  
  // Debug Y button specifically when it's being pressed
  if (input.isDown('Y') || input.justPressed('Y')) {
    console.log('🔍 Y BUTTON ACTIVE - isDown:', input.isDown('Y'), 'justPressed:', input.justPressed('Y'), 'UIState:', currentUIState)
  }

  // Debug: Log current state every 300 frames (about 5 seconds)
  if (DEBUG && debugCounter % 300 === 0) {
    console.log(`🎮 Current UI State: ${currentUIState}`)
    const gamepad = input.firstGamepad()
    console.log(`🎮 Gamepad detected: ${gamepad ? gamepad.id : 'None'}`)
    
    // Check raw gamepad API
    try {
      const gamepads = navigator.getGamepads()
      console.log(`🎮 Raw navigator.getGamepads():`, gamepads)
      console.log(`🎮 Number of gamepads found: ${gamepads.filter(gp => gp !== null).length}`)
      
      // Log each connected gamepad
      gamepads.forEach((gp, index) => {
        if (gp) {
          console.log(`🎮 Gamepad ${index}: ${gp.id} (${gp.buttons.length} buttons, ${gp.axes.length} axes)`)
          console.log(`🎮 Gamepad ${index} connected: ${gp.connected}`)
          console.log(`🎮 Gamepad ${index} timestamp: ${gp.timestamp}`)
        }
      })
      
      // Additional browser checks
      console.log(`🎮 Document has focus: ${document.hasFocus()}`)
      console.log(`🎮 Page visibility: ${document.visibilityState}`)
      console.log(`🎮 Window location: ${window.location.href}`)
      
    } catch (error) {
      console.error('🎮 ERROR accessing gamepad API:', error)
    }
  }
  debugCounter++

  // Handle input actions
  handleInputActions()
  
  // Update visual feedback
  updateVisualFeedback()
}

// Gamepad activation system - browsers require controller button press to detect gamepads
function ensureGamepadActivation() {
  const gamepads = navigator.getGamepads()
  const hasGamepads = Array.from(gamepads).some(gp => gp !== null)
  
  if (!hasGamepads && !document.getElementById('gamepad-prompt')) {
    console.log('🎮 No gamepads detected - showing activation prompt')
    
    // Create a gamepad activation prompt
    const gamepadPrompt = document.createElement('div')
    gamepadPrompt.id = 'gamepad-prompt'
    gamepadPrompt.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 150, 255, 0.95);
        color: white;
        padding: 25px;
        border-radius: 12px;
        text-align: center;
        font-size: 20px;
        font-weight: bold;
        z-index: 10000;
        border: 3px solid #4CAF50;
        box-shadow: 0 0 25px rgba(0, 150, 255, 0.6);
        max-width: 400px;
      ">
        🎮 CONTROLLER ACTIVATION<br><br>
        <div style="font-size: 16px; margin: 15px 0;">
          Press ANY button on your controller<br>
          to activate gamepad detection
        </div>
        <div style="font-size: 14px; opacity: 0.8; margin-top: 10px;">
          Browser requires controller interaction first
        </div>
        <div style="font-size: 12px; opacity: 0.7; margin-top: 15px;">
          Make sure your controller is connected and in pairing mode
        </div>
      </div>
    `
    document.body.appendChild(gamepadPrompt)
    
    // Add gamepad event listeners for activation
    const checkForGamepadActivation = () => {
      const updatedGamepads = navigator.getGamepads()
      const activatedGamepads = Array.from(updatedGamepads).filter(gp => gp !== null)
      
      if (activatedGamepads.length > 0) {
        console.log('🎯 GAMEPAD ACTIVATED! Found:', activatedGamepads.length, 'controller(s)')
        if (document.getElementById('gamepad-prompt')) {
          document.body.removeChild(gamepadPrompt)
        }
        
        // Log detected controllers
        activatedGamepads.forEach((gp, index) => {
          console.log(`✅ Controller ${index}: ${gp.id}`)
        })
        
        // CRITICAL: Refresh InputManager to recognize newly activated gamepad
        console.log('🔄 Refreshing InputManager to recognize activated gamepad...')
        input.update() // Force InputManager to refresh its gamepad state
        
        // Test Y button immediately after activation
        setTimeout(() => {
          console.log('🧪 Testing Y button detection after gamepad activation...')
          const isYDown = input.isDown('Y')
          const gamepadState = input.inputManager ? input.inputManager.gamepadManager : 'unknown'
          console.log('Y button state:', isYDown, 'GamepadManager state:', gamepadState)
        }, 100)
        
        // Remove the activation check
        window.removeEventListener('gamepadconnected', checkForGamepadActivation)
        
        return true
      }
      return false
    }
    
    // Listen for gamepad connection events
    window.addEventListener('gamepadconnected', (event) => {
      console.log('🎮 Gamepad connected event:', event.gamepad.id)
      checkForGamepadActivation()
    })
    
    // Also poll for gamepad detection periodically
    const pollForGamepads = () => {
      if (!checkForGamepadActivation()) {
        setTimeout(pollForGamepads, 500)
      }
    }
    setTimeout(pollForGamepads, 500)
    
    return false // Gamepads not ready
  }
  
  return hasGamepads // Return true if gamepads are available
}

// Focus detection and gamepad activation system
function ensureDocumentFocus() {
  if (!document.hasFocus()) {
    console.log('🔥 CRITICAL: Document does not have focus - this prevents gamepad detection!')
    
    // Create a prominent focus prompt
    const focusPrompt = document.createElement('div')
    focusPrompt.id = 'focus-prompt'
    focusPrompt.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 50, 50, 0.95);
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        font-size: 18px;
        font-weight: bold;
        z-index: 10000;
        border: 3px solid #ff6666;
        box-shadow: 0 0 20px rgba(255, 50, 50, 0.5);
      ">
        🎮 CONTROLLER SETUP REQUIRED<br><br>
        Tap anywhere on screen to enable gamepad detection<br>
        <small style="font-size: 14px; opacity: 0.8;">Browser security requires user interaction</small>
      </div>
    `
    document.body.appendChild(focusPrompt)
    
    // Focus activation handler
    const activateFocus = () => {
      console.log('🎯 User interaction detected - activating focus and gamepad API')
      if (document.getElementById('focus-prompt')) {
        document.body.removeChild(focusPrompt)
      }
      
      // Force focus
      window.focus()
      document.body.focus()
      
      // Check for gamepad activation after focus
      setTimeout(() => {
        console.log('🔄 Checking for gamepad activation after focus...')
        ensureGamepadActivation()
      }, 100)
    }
    
    // Multiple activation triggers
    document.addEventListener('click', activateFocus, { once: true })
    document.addEventListener('touchstart', activateFocus, { once: true })
    document.addEventListener('keydown', activateFocus, { once: true })
    
    return false // Focus not ready
  }
  
  // Focus is ready, check gamepad activation
  return ensureGamepadActivation()
}

// Initialize focus monitoring
function initializeFocusMonitoring() {
  // Check focus on initial load
  window.addEventListener('load', () => {
    setTimeout(() => {
      ensureDocumentFocus()
    }, 500)
  })
  
  // Re-check focus when visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      setTimeout(() => {
        ensureDocumentFocus()
      }, 100)
    }
  })
  
  // Re-check focus when window gains focus
  window.addEventListener('focus', () => {
    console.log('🎯 Window focus gained - checking gamepad availability')
    setTimeout(() => {
      ensureGamepadActivation()
      debugGamepadState()
    }, 100)
  })
}

// Initialize focus monitoring immediately
initializeFocusMonitoring()

requestAnimationFrame(loop)

function handleInputActions() {
  // Debug: Check if any inputs are being detected
  if (DEBUG) {
    // Test all basic buttons
    const testButtons = ['A', 'B', 'X', 'Y', 'UP', 'DOWN', 'LEFT', 'RIGHT']
    testButtons.forEach(button => {
      if (input.justPressed(button)) {
        console.log(`🎮 INPUT DETECTED: ${button} button pressed`)
      }
    })
    
    // Also check if InputManager is detecting any activity at all
    if (debugCounter % 300 === 0) {
      console.log(`🎮 InputManager status check:`)
      console.log(`  - Gamepad manager first gamepad:`, input.gamepad.first())
      console.log(`  - Active input method:`, input.getActiveInputMethod())
      
      // Test raw gamepad button states
      const rawGamepad = navigator.getGamepads()[0]
      if (rawGamepad) {
        const pressedButtons = rawGamepad.buttons.map((btn, i) => btn.pressed ? i : null).filter(i => i !== null)
        if (pressedButtons.length > 0) {
          console.log(`🎮 RAW GAMEPAD: Buttons currently pressed:`, pressedButtons)
        }
      }
    }
  }
  
  // State-based input routing
  switch (currentUIState) {
    case UI_STATES.LOCKED:
      // Lock screen is active - handle press and hold for unlock
      handlePressAndHold()
      break
      
    case UI_STATES.SHELL:
      // Shell/desktop interactions
      handleShellInputs()
      // Handle X button press and hold for preview scaling
      handleXButtonHold()
      break
      
    case UI_STATES.MENU:
      // Menu system interactions
      handleMenuInputs()
      break
      
    case UI_STATES.APP:
      // App-specific interactions
      handleAppInputs()
      break
      
    default:
      console.warn('Unknown UI state:', currentUIState)
      break
  }
  
  // Global inputs (always available)
  if (input.justPressed('VIEW')) {

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
  
  // Debug Y button detection
  if (isYPressed) {
    console.log('🔥 Y BUTTON DETECTED - isHolding:', isHolding, 'holdStartTime:', holdStartTime)
  }
  
  // Also debug raw InputManager state for Y button
  if (input.justPressed('Y')) {
    console.log('🎮 Y BUTTON JUST PRESSED - InputManager detected press')
  }
  if (input.isDown('Y')) {
    console.log('🎮 Y BUTTON IS DOWN - InputManager detected hold')
  }
  
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
  
  // Stop the lock screen video
  const lockVideo = document.getElementById('lock-video')
  if (lockVideo) {
    lockVideo.pause()
  }
  
  // Change to shell state
  changeUIState(UI_STATES.SHELL)
  
  // Ensure preview containers are positioned correctly
  updateAppStates()
  
  // Show focus container and auto-scale green preview (Silksong)
  selectedAppIndex = 0 // Ensure green preview (Silksong) is selected
  focusArea = 'preview' // Ensure focus is in preview mode
  
  const focusContainer = document.getElementById('focus')
  const greenPreview = document.getElementById('green-preview')
  
  if (greenPreview) {
    greenPreview.classList.add('preview-scaled') // Scale Silksong preview first
    isPreviewScaled = true
    
    // Play Silksong video when going fullscreen
    const silksongVideo = document.getElementById('silksong-video')
    if (silksongVideo) {
      silksongVideo.muted = false // Unmute audio for fullscreen
      silksongVideo.play().catch(err => {
        if (DEBUG) console.log('Video playback failed:', err)
      })
    }
  }
  
  if (focusContainer) {
    focusContainer.classList.add('visible')
    // Update focus to match the scaled preview
    updateFocusPosition()
  }
  
  // Slide out the auth container
  if (auth) {
    auth.classList.add('slide-out')
  }
  
  // Dismiss quick-resume container
  const quickResume = document.getElementById('quick-resume')
  if (quickResume) {
    quickResume.classList.add('dismiss')
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

function handleXButtonHold() {
  // Only handle X hold when in shell state and a preview is scaled
  if (currentUIState !== UI_STATES.SHELL || !isPreviewScaled || focusArea !== 'preview') return
  
  const isXPressed = input.isDown('X')
  
  if (isXPressed && !isXHolding) {
    // Start holding X button
    isXHolding = true
    xHoldStartTime = Date.now()
    console.log('X button hold started - will scale down preview in', X_HOLD_DURATION + 'ms')
  } else if (isXPressed && isXHolding) {
    // Continue holding - check if hold is complete
    const elapsed = Date.now() - xHoldStartTime
    
    if (elapsed >= X_HOLD_DURATION) {
      // Hold complete - scale down the preview
      onXHoldComplete()
    }
  } else if (!isXPressed && isXHolding) {
    // Button released - check if it was a quick tap or a hold
    const elapsed = Date.now() - xHoldStartTime
    
    if (elapsed < X_HOLD_DURATION) {
      // Quick tap - toggle overlay
      console.log('X button quick tap detected - toggling overlay')
      toggleOverlay()
    }
    // Released before completion of hold
    resetXHold()
  }
}

function onXHoldComplete() {
  console.log('X button hold complete! Scaling down preview and reordering to leftmost position.')
  
  // Get preview containers based on current app order
  const previewContainers = appNames.map(name => 
    document.getElementById(`${name}-preview`)
  )
  
  const activePreview = previewContainers[selectedAppIndex]
  if (activePreview && activePreview.classList.contains('preview-scaled')) {
    activePreview.classList.remove('preview-scaled')
    isPreviewScaled = false
    
    // Pause Silksong video when scaling down
    const silksongVideo = document.getElementById('silksong-video')
    if (silksongVideo && activePreview.id === 'green-preview') {
      silksongVideo.muted = true // Mute audio when scaling down
      silksongVideo.pause()
    }
    
    // Close overlay if it's open
    if (isOverlayVisible) {
      const overlay = document.getElementById('overlay')
      if (overlay) {
        overlay.classList.remove('visible')
        isOverlayVisible = false
        console.log('Overlay closed (preview scaled down)')
      }
    }
    
    // Animate running apps back down from top
    const runningApps = document.getElementById('running-apps')
    if (runningApps) {
      runningApps.classList.add('visible')
    }
    
    // Animate shell-nav back up from bottom
    const shellNav = document.getElementById('shell-nav')
    if (shellNav) {
      shellNav.classList.add('visible')
    }
    
    // If the selected app is not already at index 0, reorder the arrays
    if (selectedAppIndex !== 0) {
      if (DEBUG) console.log(`Reordering: Moving ${appNames[selectedAppIndex]} to leftmost position`)
      
      // Store the selected app info
      const selectedAppContainer = appContainers[selectedAppIndex]
      const selectedAppName = appNames[selectedAppIndex]
      
      // Remove from current position
      appContainers.splice(selectedAppIndex, 1)
      appNames.splice(selectedAppIndex, 1)
      
      // Insert at the beginning (leftmost)
      appContainers.unshift(selectedAppContainer)
      appNames.unshift(selectedAppName)
      
      // Update the DOM order to match the new array order
      const runningApps = document.getElementById('running-apps')
      if (runningApps) {
        // Clear and rebuild in new order
        runningApps.innerHTML = ''
        appContainers.forEach(container => {
          if (container) runningApps.appendChild(container)
        })
      }
      
      // Set selectedAppIndex to 0 since we moved it to the front
      selectedAppIndex = 0
      
      if (DEBUG) console.log('New app order:', appNames)
    }
    
    // Update preview positions and app states
    updatePreviewPositions()
    updateAppStates()
    
    // Update focus to match the smaller preview
    updateFocusPosition()
    
    // Success feedback
    RumbleFeedback.confirmation()
  }
  
  resetXHold()
}

function resetXHold() {
  isXHolding = false
  xHoldStartTime = 0
}

function toggleOverlay() {
  // Only allow toggling overlay when a preview is fullscreen
  if (!isPreviewScaled || focusArea !== 'preview') {
    console.log('Overlay can only be toggled when an app preview is fullscreen')
    return
  }
  
  const overlay = document.getElementById('overlay')
  if (!overlay) return
  
  isOverlayVisible = !isOverlayVisible
  
  if (isOverlayVisible) {
    // Determine which overlay interface to show based on active app
    const currentAppName = appNames[selectedAppIndex]
    
    overlay.classList.add('visible')
    
    // Remove any existing overlay mode classes
    overlay.classList.remove('show-gb', 'show-steam')
    
    if (currentAppName === 'green' || currentAppName === 'blue') {
      // Silksong (green) or Xbox (blue) - show GB nav widgets
      overlay.classList.add('show-gb')
      console.log(`Overlay opened: GB interface for ${currentAppName} app`)
    } else if (currentAppName === 'orange') {
      // Steam/Discord (orange) - show Steam interface
      overlay.classList.add('show-steam')
      console.log(`Overlay opened: Steam interface for ${currentAppName} app`)
    }
    
    RumbleFeedback.lightTap()
  } else {
    overlay.classList.remove('visible', 'show-gb', 'show-steam')
    console.log('Overlay closed')
    RumbleFeedback.lightTap()
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
  
  // Update switcher state
  if (switcher) {
    switcher.className = isUnlocked ? 'unlocked' : 'locked'
  }
  
  // Hide/show main clock based on lock state
  if (clock) {
    if (isUnlocked) {
      clock.classList.add('slide-out')
    } else {
      clock.classList.remove('slide-out')
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
  if (DEBUG) console.log(`UI State: ${currentUIState} → ${newState}`)
  currentUIState = newState
  
  // Show/hide blur container based on unlock state
  const blurContainer = document.getElementById('blur-container')
  if (blurContainer) {
    if (newState !== UI_STATES.LOCKED) {
      // System is unlocked - show blur
      blurContainer.classList.add('visible')
    } else {
      // System is locked - hide blur
      blurContainer.classList.remove('visible')
    }
  }
  
  // Trigger visual updates
  updateSystemTrayState()
  updateAppStates()
}

// App Navigation Functions
function navigateApps(direction) {
  const previousApp = selectedAppIndex
  const visibleAppNames = getVisibleApps()
  
  // If we have no visible apps, do nothing
  if (visibleAppNames.length === 0) return
  
  // Find current app in visible list
  const currentAppName = appNames[selectedAppIndex]
  const currentVisibleIndex = visibleAppNames.indexOf(currentAppName)
  
  // Navigate within visible apps only
  let newVisibleIndex
  if (direction === 'right') {
    newVisibleIndex = (currentVisibleIndex + 1) % visibleAppNames.length
  } else if (direction === 'left') {
    newVisibleIndex = (currentVisibleIndex - 1 + visibleAppNames.length) % visibleAppNames.length
  }
  
  // Find the new app in the main appNames array
  const newAppName = visibleAppNames[newVisibleIndex]
  selectedAppIndex = appNames.indexOf(newAppName)
  
  if (DEBUG) console.log(`App Navigation: ${appNames[previousApp]} → ${appNames[selectedAppIndex]} (visible apps: ${visibleAppNames.join(', ')})`)
  updateAppStates()
  RumbleFeedback.selectionChange()
}

function navigateShellNav(direction) {
  const previousNav = selectedNavIndex
  
  if (direction === 'right') {
    selectedNavIndex = (selectedNavIndex + 1) % navItems.length
  } else if (direction === 'left') {
    selectedNavIndex = (selectedNavIndex - 1 + navItems.length) % navItems.length
  }
  
  if (DEBUG) console.log(`Shell Nav Navigation: ${navItems[previousNav]} → ${navItems[selectedNavIndex]}`)
  updateFocusPosition()
  RumbleFeedback.selectionChange()
}

function updateAppStates() {
  // Only update app states when in shell mode and unlocked
  if (currentUIState !== UI_STATES.SHELL) {
    return
  }
  
  appContainers.forEach((container, index) => {
    if (container) {
      if (index === selectedAppIndex) {
        container.classList.add('app-active')
        container.classList.remove('app-rest')
      } else {
        container.classList.add('app-rest')
        container.classList.remove('app-active')
      }
    }
  })
  
  // Update preview container positions based on active app
  updatePreviewPositions()
}

function updatePreviewPositions() {
  // Get only visible apps
  const visibleAppNames = getVisibleApps()
  
  // Get preview containers based on visible app order
  const previewContainers = visibleAppNames.map(name => 
    document.getElementById(`${name}-preview`)
  )
  
  // Remove all positioning classes and scaling first (from ALL previews, not just visible)
  appNames.forEach(name => {
    const container = document.getElementById(`${name}-preview`)
    if (container) {
      container.classList.remove('preview-center', 'preview-left', 'preview-right', 'preview-far-left', 'preview-far-right', 'preview-scaled')
    }
  })
  
  // Reset scaling state when switching apps
  isPreviewScaled = false
  
  // Only position visible apps
  const visibleCount = visibleAppNames.length
  
  // Find the selected app's index within visible apps
  const currentAppName = appNames[selectedAppIndex]
  const visibleSelectedIndex = visibleAppNames.indexOf(currentAppName)
  
  if (visibleCount === 2) {
    // With 2 apps: show center and one adjacent
    switch (visibleSelectedIndex) {
      case 0: // First visible app
        previewContainers[0]?.classList.add('preview-center')  // First app in center
        previewContainers[1]?.classList.add('preview-right')   // Second app to the right
        break
      case 1: // Second visible app
        previewContainers[0]?.classList.add('preview-left')    // First app to the left
        previewContainers[1]?.classList.add('preview-center')  // Second app in center
        break
    }
  } else if (visibleCount === 3) {
    // With 3 apps: use original logic
    switch (visibleSelectedIndex) {
      case 0: // First visible app in array (leftmost)
        previewContainers[0]?.classList.add('preview-center')  // First app in center
        previewContainers[1]?.classList.add('preview-right')   // Second app to the right
        previewContainers[2]?.classList.add('preview-far-right') // Third app far right
        break
      case 1: // Second visible app in array
        previewContainers[0]?.classList.add('preview-left')    // First app to the left
        previewContainers[1]?.classList.add('preview-center')  // Second app in center
        previewContainers[2]?.classList.add('preview-right')   // Third app to the right
        break
      case 2: // Third visible app in array (rightmost)
        previewContainers[0]?.classList.add('preview-far-left') // First app far left
        previewContainers[1]?.classList.add('preview-left')    // Second app to the left
        previewContainers[2]?.classList.add('preview-center')  // Third app in center
        break
    }
  }
  
  // Update focus container position
  updateFocusPosition()
}

function scaleUpPreview() {
  // Get preview containers based on current app order
  const previewContainers = appNames.map(name => 
    document.getElementById(`${name}-preview`)
  )
  
  const activePreview = previewContainers[selectedAppIndex]
  if (!activePreview) return
  
  // Only scale up if not already scaled
  if (!isPreviewScaled) {
    // Scale up to 100%
    activePreview.classList.add('preview-scaled')
    isPreviewScaled = true
    
    // Play Silksong video when going fullscreen
    if (activePreview.id === 'green-preview') {
      const silksongVideo = document.getElementById('silksong-video')
      if (silksongVideo) {
        silksongVideo.muted = false // Unmute audio for fullscreen
        silksongVideo.play().catch(err => {
          if (DEBUG) console.log('Video playback failed:', err)
        })
      }
    }
    
    // Hide running apps when going fullscreen
    const runningApps = document.getElementById('running-apps')
    if (runningApps) {
      runningApps.classList.remove('visible')
    }
    
    // Hide shell-nav when going fullscreen
    const shellNav = document.getElementById('shell-nav')
    if (shellNav) {
      shellNav.classList.remove('visible')
    }
    
    // Update focus container to match new size
    updateFocusPosition()
    
    RumbleFeedback.confirmation()
  } else {
    // Already scaled - do nothing (scaling down is handled by VIEW button hold)
    console.log('Preview already scaled up. Use VIEW button hold to scale down.')
  }
}

function updateFocusPosition() {
  const focusContainer = document.getElementById('focus')
  if (!focusContainer) return
  
  // Clean up ALL focus-related classes first
  focusContainer.classList.remove(
    'focus-preview', 
    'focus-nav', 
    'focus-shell-surface',
    'focus-shell-library',
    'focus-shell-settings'
  )
  
  if (focusArea === 'preview') {
    // Focus on preview area - hide all nav labels
    updateNavLabels()
    
    // Get preview containers based on current app order
    const previewContainers = appNames.map(name => 
      document.getElementById(`${name}-preview`)
    )
    
    const activePreview = previewContainers[selectedAppIndex]
    if (!activePreview) return
    
    // Check if the active preview is scaled
    const isScaled = activePreview.classList.contains('preview-scaled')
    
    // Match the size of the active preview and center it
    if (isScaled) {
      // When preview is scaled to full shell size
      focusContainer.style.width = '1280px'
      focusContainer.style.height = '720px'
    } else {
      // Normal size - 8px larger than center preview (648px x 432px)
      focusContainer.style.width = '648px'
      focusContainer.style.height = '432px'
    }
    
    // Center position
    focusContainer.style.top = '50%'
    focusContainer.style.left = '50%'
    focusContainer.style.transform = 'translate(-50%, -50%)'
    focusContainer.classList.add('focus-preview')
    
  } else if (focusArea === 'shell-nav') {
    // Focus on shell navigation area - update nav labels
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
    
    // Update nav labels to show active one
    updateNavLabels(navItems[selectedNavIndex])
  } else if (focusArea === 'shell-surface') {
    // Focus in shell surface - hide all nav labels
    updateNavLabels()
    
    // Focus stays hidden with opacity 0 when in shell surface
    // No positioning needed
  }
}

function updateNavLabels(activeNavItem = null) {
  const labels = {
    'library': document.getElementById('label-library'),
    'settings': document.getElementById('label-settings'),
    'notifications': document.getElementById('label-notifications'),
    'gallery': document.getElementById('label-gallery')
  }
  
  const shellNav = document.getElementById('shell-nav')
  
  // If no active nav item, hide all labels
  if (!activeNavItem || !shellNav) {
    Object.values(labels).forEach(label => {
      if (label) {
        label.classList.remove('active', 'faded')
      }
    })
    return
  }
  
  // Get the actual nav item element position (relative to shell-nav now)
  const navItemElement = document.getElementById(activeNavItem)
  if (!navItemElement) return
  
  const navItemRect = navItemElement.getBoundingClientRect()
  const shellNavRect = shellNav.getBoundingClientRect()
  
  // Calculate position relative to shell-nav
  const navItemTop = navItemRect.top - shellNavRect.top
  const navItemLeft = navItemRect.left - shellNavRect.left
  const navItemWidth = navItemRect.width
  
  // Update each label
  Object.entries(labels).forEach(([navId, label]) => {
    if (!label) return
    
    if (navId === activeNavItem) {
      // Active label - position above the specific nav item with more spacing
      label.classList.add('active')
      label.classList.remove('faded')
      
      // Position label centered above this specific nav item (relative to shell-nav)
      const labelTop = navItemTop - 16 - 20 // 16px gap + approximate label height (2px higher)
      const labelLeft = navItemLeft + (navItemWidth / 2)
      
      label.style.top = `${labelTop}px`
      label.style.left = `${labelLeft}px`
      label.style.transform = 'translateX(-50%)'
    } else {
      // Other labels - fade them out
      label.classList.remove('active')
      label.classList.add('faded')
    }
  })
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
  
  // Reset any existing inline styles that might interfere
  focusContainer.style.maxWidth = 'none'
  focusContainer.style.maxHeight = 'none'
  focusContainer.style.minWidth = 'none'
  focusContainer.style.minHeight = 'none'
}

function restorePreviousFocus() {
  // Restore previous focus state
  focusArea = previousFocusState.area
  selectedAppIndex = previousFocusState.appIndex
  selectedNavIndex = previousFocusState.navIndex
  
  // Always restore focus and shell-nav opacity when closing any shell container
  const focusContainer = document.getElementById('focus')
  const shellNav = document.getElementById('shell-nav')
  if (focusContainer) {
    focusContainer.style.opacity = '1'
  }
  if (shellNav) {
    shellNav.style.opacity = '1'
  }
  
  updateFocusPosition()
}

// Library Launchers Navigation Functions
function updateLauncherFocus() {
  const focusContainer = document.getElementById('focus')
  const searchBox = document.querySelector('.library-search-box')
  const launcherRowContainers = document.querySelectorAll('.launcher-row-container')
  const libraryContent = document.querySelector('.library-content')
  
  if (!focusContainer) return
  
  // Hide focus border when in library
  focusContainer.style.opacity = '0'
  
  // Remove focus from all elements
  document.querySelectorAll('.launcher-app').forEach(app => app.classList.remove('focused'))
  if (searchBox) {
    searchBox.classList.remove('focused')
  }
  
  // Handle search box focus (row -1)
  if (selectedLauncherRow === -1) {
    if (searchBox) {
      searchBox.classList.add('focused')
    }
    // Reset scroll for search box
    launcherRowContainers.forEach((container) => {
      container.style.transition = 'transform 0.3s ease'
      container.style.transform = 'translateY(0)'
    })
    return
  }
  
  // Get the selected row container
  const selectedRowContainer = launcherRowContainers[selectedLauncherRow]
  if (selectedRowContainer) {
    const selectedRow = selectedRowContainer.querySelector('.launchers')
    const launcherApps = selectedRow.querySelectorAll('.launcher-app')
    const selectedLauncher = launcherApps[selectedLauncherIndex]
    
    if (selectedLauncher) {
      selectedLauncher.classList.add('focused')
    }
    
    // Handle horizontal scrolling for rows with more than 5 items
    const itemsInRow = LAUNCHER_COUNTS_PER_ROW[selectedLauncherRow]
    if (itemsInRow > 5) {
      // Calculate how many items can fit on screen (approx 5 items visible)
      const visibleItems = 5
      let scrollOffset = 0
      
      // Start scrolling when we're past the 3rd item (index 2)
      if (selectedLauncherIndex >= 3) {
        // Calculate how much to scroll left
        // Each item is 174px wide + 20px gap = 194px
        const itemWidth = 174 + 20
        // Scroll to keep focused item centered (around 3rd position)
        scrollOffset = -(selectedLauncherIndex - 2) * itemWidth
        
        // Don't scroll past the last set of visible items
        const maxScroll = -(itemsInRow - visibleItems) * itemWidth
        scrollOffset = Math.max(scrollOffset, maxScroll)
      }
      
      // Apply horizontal scroll to the entire row container
      selectedRowContainer.style.transition = 'transform 0.3s ease'
      selectedRowContainer.style.transform = `translateX(${scrollOffset}px) translateY(${selectedLauncherRow >= 2 ? -(234 + 30) * (selectedLauncherRow - 1) : 0}px)`
    } else {
      // Reset horizontal scroll for rows with 5 or fewer items
      selectedRowContainer.style.transition = 'transform 0.3s ease'
      selectedRowContainer.style.transform = `translateX(0) translateY(${selectedLauncherRow >= 2 ? -(234 + 30) * (selectedLauncherRow - 1) : 0}px)`
    }
  }
  
  // Vertical scrolling to keep focused row visible
  if (libraryContent) {
    let scrollOffset = 0
    
    if (selectedLauncherRow >= 2) {
      scrollOffset = -(234 + 30) * (selectedLauncherRow - 1) // Updated height: 234px (32 title + 12 margin + 174 launchers + 16 padding) + 30px gap
    }
    
    // Apply smooth transform to move all launcher row containers vertically (except the selected row which is handled above)
    launcherRowContainers.forEach((container, index) => {
      if (index !== selectedLauncherRow) {
        container.style.transition = 'transform 0.3s ease'
        container.style.transform = `translateY(${scrollOffset}px)`
      }
    })
    
    // Move the search box
    if (searchBox) {
      searchBox.style.transition = 'transform 0.3s ease'
      searchBox.style.transform = `translateY(${scrollOffset}px)`
    }
  }
}

function navigateLaunchers(direction) {
  // Handle search box row (-1)
  if (selectedLauncherRow === -1) {
    if (direction === 'down') {
      selectedLauncherRow = 0
      selectedLauncherIndex = 0
      updateLauncherFocus()
    }
    // No left/right/up navigation from search box
    return
  }
  
  const currentRowItemCount = LAUNCHER_COUNTS_PER_ROW[selectedLauncherRow]
  
  if (direction === 'left' && selectedLauncherIndex > 0) {
    selectedLauncherIndex--
    updateLauncherFocus()
  } else if (direction === 'right' && selectedLauncherIndex < currentRowItemCount - 1) {
    selectedLauncherIndex++
    updateLauncherFocus()
  } else if (direction === 'up') {
    if (selectedLauncherRow > 0) {
      selectedLauncherRow--
      // Clamp index to new row's item count
      selectedLauncherIndex = Math.min(selectedLauncherIndex, LAUNCHER_COUNTS_PER_ROW[selectedLauncherRow] - 1)
      updateLauncherFocus()
    } else if (selectedLauncherRow === 0) {
      // Go back to search box
      selectedLauncherRow = -1
      selectedLauncherIndex = 0
      updateLauncherFocus()
    }
  } else if (direction === 'down' && selectedLauncherRow < LAUNCHER_ROWS - 1) {
    selectedLauncherRow++
    // Clamp index to new row's item count
    selectedLauncherIndex = Math.min(selectedLauncherIndex, LAUNCHER_COUNTS_PER_ROW[selectedLauncherRow] - 1)
    updateLauncherFocus()
  }
}

// Settings Navigation Functions
function updateSettingsNavFocus() {
  const navItems = document.querySelectorAll('.nav-page-item')
  
  if (!navItems || navItems.length === 0) return
  
  // Remove focused class from all items
  navItems.forEach(item => item.classList.remove('focused'))
  
  // Add focused class to selected item
  if (navItems[selectedSettingsNavIndex]) {
    navItems[selectedSettingsNavIndex].classList.add('focused')
    
    // Handle scrolling based on selected nav index
    const navPagesContainer = document.querySelector('.settings-nav-pages')
    
    if (navPagesContainer) {
      if (selectedSettingsNavIndex >= 2) {
        // 3rd row or later (indices 2+): Scroll up to show 3rd and 4th rows
        const thirdItem = navItems[2]
        if (thirdItem) {
          const itemTop = thirdItem.offsetTop
          navPagesContainer.scrollTo({ top: itemTop, behavior: 'smooth' })
        }
      } else {
        // 1st or 2nd row (indices 0-1): Scroll back to initial position
        navPagesContainer.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }
}

function navigateSettingsNav(direction) {
  if (DEBUG) console.log('navigateSettingsNav called with direction:', direction, 'current index:', selectedSettingsNavIndex, 'focusArea:', focusArea)
  if (direction === 'up' && selectedSettingsNavIndex > 0) {
    selectedSettingsNavIndex--
    updateSettingsNavFocus()
  } else if (direction === 'down' && selectedSettingsNavIndex < SETTINGS_NAV_ITEMS - 1) {
    selectedSettingsNavIndex++
    updateSettingsNavFocus()
  } else if (direction === 'right') {
    // Clear focus from nav items before switching
    const navItems = document.querySelectorAll('.nav-page-item')
    navItems.forEach(item => item.classList.remove('focused'))
    
    // Switch to display controls
    focusArea = 'settings-display-controls'
    selectedDisplayControlIndex = 0
    updateDisplayControlFocus()
  } else if (direction === 'left') {
    if (DEBUG) console.log('Left navigation in settings nav - no action')
  }
}

// Settings Display Controls Navigation Functions
function updateDisplayControlFocus() {
  // Get all controls from all sections
  const sections = document.querySelectorAll('.section-settings')
  const allControls = []
  
  sections.forEach(section => {
    const sliderControl = section.querySelector('.slider-control')
    const cycleSelectors = section.querySelectorAll('.cycle-selector')
    
    if (sliderControl) allControls.push(sliderControl)
    cycleSelectors.forEach(control => allControls.push(control))
  })
  
  if (!allControls || allControls.length === 0) return
  
  // Remove focused class from all controls
  allControls.forEach(control => {
    if (control) control.classList.remove('focused')
  })
  
  // Add focused class to selected control
  if (allControls[selectedDisplayControlIndex]) {
    allControls[selectedDisplayControlIndex].classList.add('focused')
    
    // Handle scrolling based on which section we're in
    const contentContainer = document.querySelector('.settings-content-container')
    
    if (selectedDisplayControlIndex <= 2) {
      // First section (indices 0-2): Scroll to top (initial position showing section 1 & 2)
      if (contentContainer) {
        contentContainer.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } else if (selectedDisplayControlIndex >= 6) {
      // Third section (indices 6-8): Scroll to show section 2 & 3
      const thirdSection = sections[2] // Third section (index 2)
      if (thirdSection && contentContainer) {
        // Calculate the position of the third section relative to content container
        const sectionTop = thirdSection.offsetTop
        contentContainer.scrollTo({ top: sectionTop, behavior: 'smooth' })
      }
    }
    // Second section (indices 3-5): No scroll, stays at initial position showing section 1 & 2
  }
}

function navigateDisplayControls(direction) {
  if (direction === 'up' && selectedDisplayControlIndex > 0) {
    selectedDisplayControlIndex--
    updateDisplayControlFocus()
  } else if (direction === 'down' && selectedDisplayControlIndex < DISPLAY_CONTROLS - 1) {
    selectedDisplayControlIndex++
    updateDisplayControlFocus()
  } else if (direction === 'left') {
    // Clear focus from display controls before switching
    const sections = document.querySelectorAll('.section-settings')
    const allControls = []
    
    sections.forEach(section => {
      const sliderControl = section.querySelector('.slider-control')
      const cycleSelectors = section.querySelectorAll('.cycle-selector')
      
      if (sliderControl) allControls.push(sliderControl)
      cycleSelectors.forEach(control => allControls.push(control))
    })
    
    allControls.forEach(control => {
      if (control) control.classList.remove('focused')
    })
    
    // Switch back to settings nav (keep the previous position)
    focusArea = 'settings-nav'
    updateSettingsNavFocus()
  }
}

// Update slider position for a specific slider control
function updateSlider(controlIndex) {
  // Map control index to slider index (0->0, 3->1, 6->2)
  const sliderIndex = controlIndex === 0 ? 0 : controlIndex === 3 ? 1 : 2
  
  // Get all sections and find the specific slider control
  const sections = document.querySelectorAll('.section-settings')
  const section = sections[sliderIndex]
  if (!section) return
  
  const knob = section.querySelector('.slider-knob')
  const sliderValueEl = section.querySelector('.slider-value')
  const value = sliderValues[sliderIndex]
  
  if (knob) {
    knob.style.left = `${value}%`
  }
  
  if (sliderValueEl) {
    sliderValueEl.style.width = `${value}%`
  }
}

// Update cycle selector display for a specific cycle control
function updateCycleSelector(controlIndex) {
  // Map control index to cycle index (1->0, 2->1, 4->2, 5->3, 7->4, 8->5)
  const cycleMapping = { 1: 0, 2: 1, 4: 2, 5: 3, 7: 4, 8: 5 }
  const cycleIndex = cycleMapping[controlIndex]
  if (cycleIndex === undefined) return
  
  // Get all sections and find the specific cycle control
  const sections = document.querySelectorAll('.section-settings')
  const allCycleSelectors = []
  sections.forEach(section => {
    const cycleSelectors = section.querySelectorAll('.cycle-selector')
    cycleSelectors.forEach(selector => allCycleSelectors.push(selector))
  })
  
  const cycleControl = allCycleSelectors[cycleIndex]
  if (!cycleControl) return
  
  const cycleValueEl = cycleControl.querySelector('.cycle-value')
  if (cycleValueEl) {
    cycleValueEl.textContent = cycleValues[cycleSelectedIndices[cycleIndex]]
  }
}

// Gallery Navigation Functions
function updateGalleryNavFocus() {
  const navItems = document.querySelectorAll('.gallery-nav-pages .nav-page-item')
  
  if (!navItems || navItems.length === 0) return
  
  // Remove focused class from all items
  navItems.forEach(item => item.classList.remove('focused'))
  
  // Add focused class to selected item
  if (navItems[selectedGalleryNavIndex]) {
    navItems[selectedGalleryNavIndex].classList.add('focused')
  }
}

function navigateGalleryNav(direction) {
  if (DEBUG) console.log('navigateGalleryNav called with direction:', direction, 'current index:', selectedGalleryNavIndex, 'focusArea:', focusArea)
  if (direction === 'up' && selectedGalleryNavIndex > 0) {
    selectedGalleryNavIndex--
    updateGalleryNavFocus()
  } else if (direction === 'down' && selectedGalleryNavIndex < GALLERY_NAV_ITEMS - 1) {
    selectedGalleryNavIndex++
    updateGalleryNavFocus()
  } else if (direction === 'right') {
    // Clear focus from nav items before switching
    const navItems = document.querySelectorAll('.gallery-nav-pages .nav-page-item')
    navItems.forEach(item => item.classList.remove('focused'))
    
    // Switch to media items navigation
    focusArea = 'gallery-media'
    selectedMediaRow = 0
    selectedMediaIndex = 0
    updateMediaFocus()
  } else if (direction === 'left') {
    if (DEBUG) console.log('Left navigation in gallery nav - no action')
  }
}

// Gallery Media Navigation Functions
function updateMediaFocus() {
  const mediaItems = document.querySelectorAll('.gallery-media-item')
  
  if (!mediaItems || mediaItems.length === 0) return
  
  // Remove focused class from all items
  mediaItems.forEach(item => item.classList.remove('focused'))
  
  // Calculate the flat index from row and column
  const flatIndex = selectedMediaRow * MEDIA_ITEMS_PER_ROW + selectedMediaIndex
  
  // Add focused class to selected item
  if (mediaItems[flatIndex]) {
    mediaItems[flatIndex].classList.add('focused')
    
    // Simple scroll logic for media grid
    const mediaGrid = document.querySelector('.gallery-media-grid')
    if (mediaGrid && selectedMediaRow >= 2) {
      // Scroll to show 3rd and 4th rows
      const thirdRowItem = mediaItems[2 * MEDIA_ITEMS_PER_ROW]
      if (thirdRowItem) {
        const itemTop = thirdRowItem.offsetTop
        mediaGrid.scrollTo({ top: itemTop - 100, behavior: 'smooth' })
      }
    } else if (mediaGrid) {
      // Reset scroll for rows 0-1
      mediaGrid.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}

function navigateMediaItems(direction) {
  if (direction === 'left') {
    if (selectedMediaIndex > 0) {
      selectedMediaIndex--
      updateMediaFocus()
    } else {
      // Go back to gallery navigation
      focusArea = 'gallery-nav'
      updateGalleryNavFocus()
      // Remove focus from media items
      const mediaItems = document.querySelectorAll('.gallery-media-item')
      mediaItems.forEach(item => item.classList.remove('focused'))
    }
  } else if (direction === 'right' && selectedMediaIndex < MEDIA_ITEMS_PER_ROW - 1) {
    selectedMediaIndex++
    updateMediaFocus()
  } else if (direction === 'up' && selectedMediaRow > 0) {
    selectedMediaRow--
    updateMediaFocus()
  } else if (direction === 'down' && selectedMediaRow < MEDIA_ROWS - 1) {
    selectedMediaRow++
    updateMediaFocus()
  }
}

// Notifications Navigation Functions
function updateNotificationsNavFocus() {
  const navItems = document.querySelectorAll('#shell-notifications .nav-page-item')
  const notifications = document.querySelectorAll('#shell-notifications .notification')
  
  if (!navItems || navItems.length === 0) return
  
  // Remove focused class from all nav items
  navItems.forEach(item => item.classList.remove('focused'))
  
  // Remove focused class from all notifications (clear content focus when in nav)
  notifications.forEach(notification => notification.classList.remove('focused'))
  
  // Add focused class to selected nav item
  if (navItems[selectedNotificationsNavIndex]) {
    navItems[selectedNotificationsNavIndex].classList.add('focused')
  }
}

function navigateNotificationsNav(direction) {
  if (direction === 'up' && selectedNotificationsNavIndex > 0) {
    selectedNotificationsNavIndex--
    updateNotificationsNavFocus()
  } else if (direction === 'down' && selectedNotificationsNavIndex < NOTIFICATIONS_NAV_ITEMS - 1) {
    selectedNotificationsNavIndex++
    updateNotificationsNavFocus()
  }
}

// Notifications Content Functions
function updateNotificationFocus() {
  const notifications = document.querySelectorAll('#shell-notifications .notification')
  const navItems = document.querySelectorAll('#shell-notifications .nav-page-item')
  const contentContainer = document.querySelector('#shell-notifications .notifications-list')
  
  if (!notifications || notifications.length === 0) return
  
  // Remove focused class from all notifications
  notifications.forEach(notification => notification.classList.remove('focused'))
  
  // Remove focused class from all nav items (clear nav focus when in content)
  navItems.forEach(item => item.classList.remove('focused'))
  
  // Add focused class to selected notification
  if (notifications[selectedNotificationIndex]) {
    notifications[selectedNotificationIndex].classList.add('focused')
  }
  
  // Handle scrolling when reaching 5th notification (index 4) or beyond
  if (contentContainer && selectedNotificationIndex >= 4) {
    // Scroll to show the 5th notification with 72px margin
    const fifthNotification = notifications[4]
    if (fifthNotification) {
      const notificationTop = fifthNotification.offsetTop
      console.log(`Scrolling to notification ${selectedNotificationIndex + 1}, offsetTop: ${notificationTop}, scrollTo: ${notificationTop - 72}`)
      contentContainer.scrollTo({ top: notificationTop - 72, behavior: 'smooth' })
    }
  } else if (contentContainer && selectedNotificationIndex <= 3) {
    // Reset scroll position when navigating back to notifications 1-4
    console.log(`Resetting scroll to top for notification ${selectedNotificationIndex + 1}`)
    contentContainer.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function navigateNotifications(direction) {
  if (direction === 'up' && selectedNotificationIndex > 0) {
    selectedNotificationIndex--
    updateNotificationFocus()
  } else if (direction === 'down' && selectedNotificationIndex < NOTIFICATION_ITEMS - 1) {
    selectedNotificationIndex++
    updateNotificationFocus()
  }
}

// Shell Library Functions
// Consolidated Shell Container Functions
function showShellContainer(containerName) {
  // Store current focus state before opening
  previousFocusState = {
    area: focusArea,
    navIndex: selectedNavIndex,
    appIndex: selectedAppIndex
  }
  
  const container = document.getElementById(`shell-${containerName}`)
  const focusContainer = document.getElementById('focus')
  const runningApps = document.getElementById('running-apps')
  
  if (!container) return
  
  container.classList.add('visible')
  if (DEBUG) console.log(`Shell ${containerName.charAt(0).toUpperCase() + containerName.slice(1)} sliding in from bottom`)
  
  // Hide running apps when shell surface opens (keep shell-nav visible)
  if (runningApps) {
    runningApps.classList.remove('visible')
  }
  
  // Move preview containers off screen to the right
  const previewContainers = document.querySelectorAll('.preview-container')
  previewContainers.forEach(preview => {
    preview.classList.add('hide-right')
  })
  
  // Set focus area to shell surface and track which surface is open
  focusArea = 'shell-surface'
  currentShellSurface = containerName
  
  // Hide focus and shell-nav together for all shell containers
  const shellNav = document.getElementById('shell-nav')
  if (focusContainer) {
    focusContainer.style.opacity = '0'
  }
  if (shellNav) {
    shellNav.style.opacity = '0'
  }
  
  // If opening library, enter launcher navigation mode
  if (containerName === 'library') {
    focusArea = 'library-launchers'
    selectedLauncherIndex = 0
    selectedLauncherRow = -1 // Start at search box
    updateLauncherFocus()
  }
  
  // If opening settings, enter settings navigation mode
  if (containerName === 'settings') {
    focusArea = 'settings-display-controls'
    selectedDisplayControlIndex = 0
    updateDisplayControlFocus()
    
    // Initialize all sliders with their current values
    for (let i = 0; i < 3; i++) {
      updateSlider(i * 3) // Update sliders at indices 0, 3, 6
    }
    
    // Initialize all cycle selectors with their current values
    const cycleIndices = [1, 2, 4, 5, 7, 8]
    cycleIndices.forEach(index => {
      updateCycleSelector(index)
    })
    
    // Mark first item as selected (Home)
    const navItems = document.querySelectorAll('.settings-nav-pages .nav-page-item')
    if (navItems[0]) {
      navItems[0].classList.add('selected')
    }
  }
  
  // If opening gallery, enter gallery navigation mode
  if (containerName === 'gallery') {
    focusArea = 'gallery-media'
    selectedMediaRow = 0
    selectedMediaIndex = 0
    updateMediaFocus()
    
    // Mark first item as selected (All)
    const navItems = document.querySelectorAll('.gallery-nav-pages .nav-page-item')
    if (navItems[0]) {
      navItems[0].classList.add('selected')
    }
  }
  
  // If opening notifications, enter notifications content mode (focus on first notification)
  if (containerName === 'notifications') {
    focusArea = 'notifications-content'
    selectedNotificationIndex = 0
    updateNotificationFocus()
    
    // Mark first item as selected (All notifications)
    const navItems = document.querySelectorAll('#shell-notifications .nav-page-item')
    if (navItems[0]) {
      navItems[0].classList.add('selected')
    }
  }
  
  // Don't position focus since it's hidden with opacity 0
  // This prevents it from briefly appearing in the upper left
}

function hideShellContainer(containerName) {
  const container = document.getElementById(`shell-${containerName}`)
  const focusContainer = document.getElementById('focus')
  const runningApps = document.getElementById('running-apps')
  
  if (!container) return
  
  container.classList.remove('visible')
  if (DEBUG) console.log(`Shell ${containerName.charAt(0).toUpperCase() + containerName.slice(1)} sliding out to bottom`)
  
  // Restore running apps when shell surface closes (shell-nav stays visible)
  if (runningApps) {
    runningApps.classList.add('visible')
  }
  
  // Bring preview containers back from off screen
  const previewContainers = document.querySelectorAll('.preview-container')
  previewContainers.forEach(preview => {
    preview.classList.remove('hide-right')
  })
  
  // Clear shell surface state and library launcher focus
  currentShellSurface = null
  if (focusArea === 'library-launchers') {
    selectedLauncherIndex = 0
    selectedLauncherRow = 0
    // Remove focus from all launchers
    document.querySelectorAll('.launcher-app').forEach(app => {
      app.classList.remove('focused')
    })
    // Reset scroll position of launcher rows (both horizontal and vertical)
    document.querySelectorAll('.launchers').forEach(row => {
      row.style.transform = 'translateX(0) translateY(0)'
    })
  }
  
  // Clear settings navigation state
  if (focusArea === 'settings-nav' || focusArea === 'settings-display-controls') {
    selectedSettingsNavIndex = 0
    selectedDisplayControlIndex = 0
    // Remove focused and selected class from all nav items
    document.querySelectorAll('.nav-page-item').forEach(item => {
      item.classList.remove('focused')
      item.classList.remove('selected')
    })
    // Remove focused class from all display controls
    document.querySelectorAll('.slider-control, .cycle-selector').forEach(control => {
      control.classList.remove('focused')
    })
  }
  
  // Clear gallery navigation state
  if (focusArea === 'gallery-nav' || focusArea === 'gallery-media') {
    selectedGalleryNavIndex = 0
    selectedMediaRow = 0
    selectedMediaIndex = 0
    // Remove focused and selected class from gallery nav items
    document.querySelectorAll('.gallery-nav-pages .nav-page-item').forEach(item => {
      item.classList.remove('focused')
      item.classList.remove('selected')
    })
    // Remove focused class from gallery media items
    document.querySelectorAll('.gallery-media-item').forEach(item => {
      item.classList.remove('focused')
    })
  }
  
  // Clear notifications navigation state
  if (focusArea === 'notifications-nav' || focusArea === 'notifications-content') {
    selectedNotificationsNavIndex = 0
    selectedNotificationIndex = 0
    // Remove focused and selected class from notifications nav items
    document.querySelectorAll('#shell-notifications .nav-page-item').forEach(item => {
      item.classList.remove('focused')
      item.classList.remove('selected')
    })
    // Remove focused class from notification content items
    document.querySelectorAll('#shell-notifications .notification').forEach(item => {
      item.classList.remove('focused')
    })
  }
  
  // Restore previous focus position
  restorePreviousFocus()
}

// Wrapper functions for backwards compatibility
function showShellLibrary() { showShellContainer('library') }
function hideShellLibrary() { hideShellContainer('library') }
function showShellSettings() { showShellContainer('settings') }
function hideShellSettings() { hideShellContainer('settings') }
function showShellNotifications() { showShellContainer('notifications') }
function hideShellNotifications() { hideShellContainer('notifications') }
function showShellGallery() { showShellContainer('gallery') }
function hideShellGallery() { hideShellContainer('gallery') }

// Interaction Handler Functions
function handleShellInputs() {
  const now = Date.now()
  
  // Simple test for all possible navigation inputs
  // Horizontal Navigation - D-pad left/right (check both justPressed and isDown)
  if (input.justPressed('LEFT') || (input.isDown('LEFT') && now - lastStickNavTime > STICK_NAV_DELAY)) {
    if (DEBUG) console.log('LEFT detected - focusArea:', focusArea)
    // Check if we're in library launchers mode
    if (focusArea === 'library-launchers') {
      navigateLaunchers('left')
      lastStickNavTime = now
    }
    // Check if we're in settings nav mode
    else if (focusArea === 'settings-nav') {
      navigateSettingsNav('left')
      lastStickNavTime = now
    }
    // Check if we're in gallery nav mode
    else if (focusArea === 'gallery-nav') {
      navigateGalleryNav('left')
      lastStickNavTime = now
    }
    // Check if we're in gallery media mode
    else if (focusArea === 'gallery-media') {
      navigateMediaItems('left')
      lastStickNavTime = now
    }
    // Check if we're in settings display controls mode
    else if (focusArea === 'settings-display-controls') {
      navigateDisplayControls('left')
      lastStickNavTime = now
    }
    // Check if we're in notifications content mode - allow left to go back to nav
    else if (focusArea === 'notifications-content') {
      focusArea = 'notifications-nav'
      selectedNotificationsNavIndex = 0
      updateNotificationsNavFocus()
      lastStickNavTime = now
    }
    // Only allow navigation if not in a shell surface
    else if (focusArea !== 'shell-surface') {
      if (focusArea === 'preview' && !isPreviewScaled) {
        navigateApps('left')
      } else if (focusArea === 'shell-nav') {
        navigateShellNav('left')
      }
      lastStickNavTime = now
    }
  }
  if (input.justPressed('RIGHT') || (input.isDown('RIGHT') && now - lastStickNavTime > STICK_NAV_DELAY)) {
    if (DEBUG) console.log('RIGHT detected - focusArea:', focusArea)
    // Check if we're in library launchers mode
    if (focusArea === 'library-launchers') {
      navigateLaunchers('right')
      lastStickNavTime = now
    }
    // Check if we're in settings nav mode
    else if (focusArea === 'settings-nav') {
      navigateSettingsNav('right')
      lastStickNavTime = now
    }
    // Check if we're in gallery nav mode
    else if (focusArea === 'gallery-nav') {
      navigateGalleryNav('right')
      lastStickNavTime = now
    }
    // Check if we're in gallery media mode
    else if (focusArea === 'gallery-media') {
      navigateMediaItems('right')
      lastStickNavTime = now
    }
    // Check if we're in settings display controls mode
    else if (focusArea === 'settings-display-controls') {
      navigateDisplayControls('right')
      lastStickNavTime = now
    }
    // Check if we're in notifications nav mode - allow right to go to content
    else if (focusArea === 'notifications-nav') {
      focusArea = 'notifications-content'
      selectedNotificationIndex = 0
      updateNotificationFocus()
      lastStickNavTime = now
    }
    // Only allow navigation if not in a shell surface
    else if (focusArea !== 'shell-surface') {
      if (focusArea === 'preview' && !isPreviewScaled) {
        navigateApps('right')
      } else if (focusArea === 'shell-nav') {
        navigateShellNav('right')
      }
      lastStickNavTime = now
    }
  }
  
  // Horizontal Navigation - Shoulder buttons (check both justPressed and isDown)
  if (input.justPressed('LB') || (input.isDown('LB') && now - lastStickNavTime > STICK_NAV_DELAY)) {
    // Only allow navigation if not in a shell surface
    if (focusArea !== 'shell-surface') {
      if (focusArea === 'preview' && !isPreviewScaled) {
        navigateApps('left')
      } else if (focusArea === 'shell-nav') {
        navigateShellNav('left')
      }
      lastStickNavTime = now
    }
  }
  if (input.justPressed('RB') || (input.isDown('RB') && now - lastStickNavTime > STICK_NAV_DELAY)) {
    // Only allow navigation if not in a shell surface
    if (focusArea !== 'shell-surface') {
      if (focusArea === 'preview' && !isPreviewScaled) {
        navigateApps('right')
      } else if (focusArea === 'shell-nav') {
        navigateShellNav('right')
      }
      lastStickNavTime = now
    }
  }
  
  // Horizontal Navigation - Left stick horizontal
  const leftStick = input.getStick('LEFT')
  const currentTime = Date.now()
  if (leftStick.magnitude > STICK_THRESHOLD && currentTime - lastStickNavTime > STICK_NAV_DELAY) {
    // Check if we're in library launchers mode
    if (focusArea === 'library-launchers') {
      if (leftStick.x > STICK_THRESHOLD) {
        navigateLaunchers('right')
        lastStickNavTime = currentTime
      } else if (leftStick.x < -STICK_THRESHOLD) {
        navigateLaunchers('left')
        lastStickNavTime = currentTime
      }
    }
    // Check if we're in settings nav mode - allow right to go to display controls
    else if (focusArea === 'settings-nav') {
      if (leftStick.x > STICK_THRESHOLD) {
        navigateSettingsNav('right')
        lastStickNavTime = currentTime
      }
    }
    // Check if we're in gallery nav mode - allow right for future content navigation
    else if (focusArea === 'gallery-nav') {
      if (leftStick.x > STICK_THRESHOLD) {
        navigateGalleryNav('right')
        lastStickNavTime = currentTime
      }
    }
    // Check if we're in gallery media mode
    else if (focusArea === 'gallery-media') {
      if (leftStick.x > STICK_THRESHOLD) {
        navigateMediaItems('right')
        lastStickNavTime = currentTime
      } else if (leftStick.x < -STICK_THRESHOLD) {
        navigateMediaItems('left')
        lastStickNavTime = currentTime
      }
    }
    // Check if we're in settings display controls mode - allow left to go back to nav
    else if (focusArea === 'settings-display-controls') {
      if (leftStick.x < -STICK_THRESHOLD) {
        navigateDisplayControls('left')
        lastStickNavTime = currentTime
      }
    }
    // Check if we're in notifications nav mode - allow right to go to content
    else if (focusArea === 'notifications-nav') {
      if (leftStick.x > STICK_THRESHOLD) {
        focusArea = 'notifications-content'
        selectedNotificationIndex = 0
        updateNotificationFocus()
        lastStickNavTime = currentTime
      }
    }
    // Check if we're in notifications content mode - allow left to go back to nav
    else if (focusArea === 'notifications-content') {
      if (leftStick.x < -STICK_THRESHOLD) {
        focusArea = 'notifications-nav'
        selectedNotificationsNavIndex = 0
        updateNotificationsNavFocus()
        lastStickNavTime = currentTime
      }
    }
    // Only allow navigation if not in a shell surface
    else if (focusArea !== 'shell-surface') {
      if (leftStick.x > STICK_THRESHOLD) {
        if (focusArea === 'preview' && !isPreviewScaled) {
          navigateApps('right')
        } else if (focusArea === 'shell-nav') {
          navigateShellNav('right')
        }
        lastStickNavTime = currentTime
      } else if (leftStick.x < -STICK_THRESHOLD) {
        if (focusArea === 'preview' && !isPreviewScaled) {
          navigateApps('left')
        } else if (focusArea === 'shell-nav') {
          navigateShellNav('left')
        }
        lastStickNavTime = currentTime
      }
    }
  }
  
  // Vertical Navigation - Left stick vertical (UP/DOWN focus area switching)
  if (leftStick.magnitude > STICK_THRESHOLD && currentTime - lastStickNavTime > STICK_NAV_DELAY) {
    // Check if we're in library launchers mode
    if (focusArea === 'library-launchers') {
      if (leftStick.y > STICK_THRESHOLD) { // Stick pushed UP
        navigateLaunchers('up')
        lastStickNavTime = currentTime
      } else if (leftStick.y < -STICK_THRESHOLD) { // Stick pushed DOWN
        navigateLaunchers('down')
        lastStickNavTime = currentTime
      }
    }
    // Check if we're in settings navigation mode
    else if (focusArea === 'settings-nav') {
      if (leftStick.y > STICK_THRESHOLD) { // Stick pushed UP
        navigateSettingsNav('up')
        lastStickNavTime = currentTime
      } else if (leftStick.y < -STICK_THRESHOLD) { // Stick pushed DOWN
        navigateSettingsNav('down')
        lastStickNavTime = currentTime
      }
    }
    // Check if we're in gallery navigation mode
    else if (focusArea === 'gallery-nav') {
      if (leftStick.y > STICK_THRESHOLD) { // Stick pushed UP
        navigateGalleryNav('up')
        lastStickNavTime = currentTime
      } else if (leftStick.y < -STICK_THRESHOLD) { // Stick pushed DOWN
        navigateGalleryNav('down')
        lastStickNavTime = currentTime
      }
    }
    // Check if we're in notifications navigation mode
    else if (focusArea === 'notifications-nav') {
      if (leftStick.y > STICK_THRESHOLD) { // Stick pushed UP
        navigateNotificationsNav('up')
        lastStickNavTime = currentTime
      } else if (leftStick.y < -STICK_THRESHOLD) { // Stick pushed DOWN
        navigateNotificationsNav('down')
        lastStickNavTime = currentTime
      }
    }
    // Check if we're in notifications content mode
    else if (focusArea === 'notifications-content') {
      if (leftStick.y > STICK_THRESHOLD) { // Stick pushed UP
        navigateNotifications('up')
        lastStickNavTime = currentTime
      } else if (leftStick.y < -STICK_THRESHOLD) { // Stick pushed DOWN
        navigateNotifications('down')
        lastStickNavTime = currentTime
      }
    }
    // Check if we're in gallery media mode
    else if (focusArea === 'gallery-media') {
      if (leftStick.y > STICK_THRESHOLD) { // Stick pushed UP
        navigateMediaItems('up')
        lastStickNavTime = currentTime
      } else if (leftStick.y < -STICK_THRESHOLD) { // Stick pushed DOWN
        navigateMediaItems('down')
        lastStickNavTime = currentTime
      }
    }
    // Check if we're in settings display controls mode
    else if (focusArea === 'settings-display-controls') {
      if (leftStick.y > STICK_THRESHOLD) { // Stick pushed UP
        navigateDisplayControls('up')
        lastStickNavTime = currentTime
      } else if (leftStick.y < -STICK_THRESHOLD) { // Stick pushed DOWN
        navigateDisplayControls('down')
        lastStickNavTime = currentTime
      }
    }
    // Only allow focus area switching if not in a shell surface
    else if (focusArea !== 'shell-surface') {
      if (leftStick.y > STICK_THRESHOLD) { // Stick pushed UP
        if (focusArea === 'shell-nav' && !isPreviewScaled) {
          focusArea = 'preview'
          updateFocusPosition()
          lastStickNavTime = currentTime
        }
      } else if (leftStick.y < -STICK_THRESHOLD) { // Stick pushed DOWN
        if (focusArea === 'preview' && !isPreviewScaled) {
          focusArea = 'shell-nav'
          // Keep current selectedNavIndex - don't reset to 0
          updateFocusPosition()
          lastStickNavTime = currentTime
        }
      }
    }
  }
  
  // Focus area navigation - DOWN moves from preview to shell-nav, UP moves back
  if (input.justPressed('DOWN') || (input.isDown('DOWN') && now - lastStickNavTime > STICK_NAV_DELAY)) {
    if (DEBUG) console.log('DOWN detected - focusArea:', focusArea)
    // Check if we're in library launchers mode
    if (focusArea === 'library-launchers') {
      navigateLaunchers('down')
      lastStickNavTime = now
    }
    // Check if we're in settings navigation mode
    else if (focusArea === 'settings-nav') {
      navigateSettingsNav('down')
      lastStickNavTime = now
    }
    // Check if we're in gallery navigation mode
    else if (focusArea === 'gallery-nav') {
      navigateGalleryNav('down')
      lastStickNavTime = now
    }
    // Check if we're in notifications navigation mode
    else if (focusArea === 'notifications-nav') {
      navigateNotificationsNav('down')
      lastStickNavTime = now
    }
    // Check if we're in notifications content mode
    else if (focusArea === 'notifications-content') {
      navigateNotifications('down')
      lastStickNavTime = now
    }
    // Check if we're in gallery media mode
    else if (focusArea === 'gallery-media') {
      navigateMediaItems('down')
      lastStickNavTime = now
    }
    // Check if we're in settings display controls mode
    else if (focusArea === 'settings-display-controls') {
      navigateDisplayControls('down')
      lastStickNavTime = now
    }
    // Only allow focus area switching if not in a shell surface
    else if (focusArea !== 'shell-surface') {
      if (focusArea === 'preview' && !isPreviewScaled) {
        focusArea = 'shell-nav'
        // Keep current selectedNavIndex - don't reset to 0
        updateFocusPosition()
        lastStickNavTime = now
      }
    }
  }
  if (input.justPressed('UP') || (input.isDown('UP') && now - lastStickNavTime > STICK_NAV_DELAY)) {
    if (DEBUG) console.log('UP detected - focusArea:', focusArea)
    // Check if we're in library launchers mode
    if (focusArea === 'library-launchers') {
      navigateLaunchers('up')
      lastStickNavTime = now
    }
    // Check if we're in settings navigation mode
    else if (focusArea === 'settings-nav') {
      navigateSettingsNav('up')
      lastStickNavTime = now
    }
    // Check if we're in gallery navigation mode
    else if (focusArea === 'gallery-nav') {
      navigateGalleryNav('up')
      lastStickNavTime = now
    }
    // Check if we're in notifications navigation mode
    else if (focusArea === 'notifications-nav') {
      navigateNotificationsNav('up')
      lastStickNavTime = now
    }
    // Check if we're in notifications content mode
    else if (focusArea === 'notifications-content') {
      navigateNotifications('up')
      lastStickNavTime = now
    }
    // Check if we're in gallery media mode
    else if (focusArea === 'gallery-media') {
      navigateMediaItems('up')
      lastStickNavTime = now
    }
    // Check if we're in settings display controls mode
    else if (focusArea === 'settings-display-controls') {
      navigateDisplayControls('up')
      lastStickNavTime = now
    }
    // Only allow focus area switching if not in a shell surface
    else if (focusArea !== 'shell-surface') {
      if (focusArea === 'shell-nav' && !isPreviewScaled) {
        focusArea = 'preview'
        updateFocusPosition()
        lastStickNavTime = now
      }
    }
  }
  
  // D-pad DOWN
  if (input.justPressed('DOWN') || (input.isDown('DOWN') && now - lastStickNavTime > STICK_NAV_DELAY)) {
    // Check if we're in settings navigation mode
    if (focusArea === 'settings-nav') {
      if (DEBUG) console.log('Navigating settings down')
      navigateSettingsNav('down')
      lastStickNavTime = now
    }
    // Check if we're in gallery navigation mode
    else if (focusArea === 'gallery-nav') {
      navigateGalleryNav('down')
      lastStickNavTime = now
    }
    // Check if we're in notifications navigation mode
    else if (focusArea === 'notifications-nav') {
      navigateNotificationsNav('down')
      lastStickNavTime = now
    }
    // Check if we're in notifications content mode
    else if (focusArea === 'notifications-content') {
      navigateNotifications('down')
      lastStickNavTime = now
    }
    // Check if we're in settings display controls mode
    else if (focusArea === 'settings-display-controls') {
      if (DEBUG) console.log('Navigating display controls down')
      navigateDisplayControls('down')
      lastStickNavTime = now
    }
  }
  
  // Fullscreen Input Handling
  // When a preview is fullscreen (isPreviewScaled = true), joystick and d-pad inputs are available for app-specific functionality
  if (isPreviewScaled && focusArea === 'preview') {
    // Example: Use left stick for in-app navigation
    const leftStick = input.getStick('LEFT')
    if (leftStick.magnitude > STICK_THRESHOLD) {
      // Add your fullscreen app logic here
    }
    
    // Example: Use d-pad for in-app actions
    if (input.justPressed('UP')) {
      // Add your fullscreen app logic here
    }
    if (input.justPressed('DOWN')) {
      // Add your fullscreen app logic here
    }
    if (input.justPressed('LEFT')) {
      // Add your fullscreen app logic here
    }
    if (input.justPressed('RIGHT')) {
      // Add your fullscreen app logic here
    }
  }
  
  // Face buttons for actions
  const buttonTime = Date.now()
  
  if (input.isDown('A') && (buttonTime - lastAButtonPress) > A_BUTTON_DEBOUNCE) {
    // Don't allow A button during Steam reveal animation
    if (isSteamRevealing) {
      return
    }
    
    lastAButtonPress = buttonTime
    
    if (focusArea === 'library-launchers') {
      // Check if Steam launcher is selected (Row 0, Index 1)
      if (selectedLauncherRow === 0 && selectedLauncherIndex === 1) {
        // Don't allow launching Steam if it's already been launched
        if (hasSteamBeenLaunched) {
          RumbleFeedback.lightTap() // Give feedback that it's disabled
          return
        }
        
        // Set flags to disable input and mark Steam as launched
        isSteamRevealing = true
        hasSteamBeenLaunched = true
        
        // Step 1: Dismiss library
        hideShellLibrary()
        
        // Step 2: Immediately after library starts dismissing, reveal and animate Steam
        setTimeout(() => {
          const orangeApp = document.getElementById('orange')
          const orangePreview = document.getElementById('orange-preview')
          
          // Reveal Steam app and preview with slide-in animation
          if (orangeApp) orangeApp.classList.remove('hidden-app')
          if (orangePreview) {
            orangePreview.classList.remove('hidden-app')
            orangePreview.classList.add('slide-in-left')
          }
          
          // DON'T move focus yet - let Steam animate first
          
          // Reorder to move Steam to leftmost position
          selectedAppIndex = 2 // Steam is at index 2
          
          const selectedAppContainer = appContainers[selectedAppIndex]
          const selectedAppName = appNames[selectedAppIndex]
          
          // Remove from current position
          appContainers.splice(selectedAppIndex, 1)
          appNames.splice(selectedAppIndex, 1)
          
          // Insert at the beginning (leftmost)
          appContainers.unshift(selectedAppContainer)
          appNames.unshift(selectedAppName)
          
          // Update the DOM order
          const runningApps = document.getElementById('running-apps')
          if (runningApps) {
            runningApps.innerHTML = ''
            appContainers.forEach(container => {
              if (container) runningApps.appendChild(container)
            })
          }
          
          // Set to index 0 (leftmost)
          selectedAppIndex = 0
          
          // Update states and positions (this shifts others to the right)
          updateAppStates()
          updatePreviewPositions()
          // Don't update focus yet
          
          // Step 3: After slide-in completes (0.6s), pause and let focus catch up
          setTimeout(() => {
            if (orangePreview) {
              orangePreview.classList.remove('slide-in-left')
            }
            
            // Move focus to preview area to catch up during the pause
            focusArea = 'preview'
            updateFocusPosition()
            
            // Step 4: After 0.4s pause, scale up Steam and focus together
            setTimeout(() => {
              scaleUpPreview()
              
              // Re-enable input after animation completes
              setTimeout(() => {
                isSteamRevealing = false
              }, 400) // Wait for scale-up to complete
            }, 400) // 0.4s pause for focus to catch up
          }, 600) // Match slide-in animation duration (0.6s)
        }, 100) // Start almost immediately (just after library starts dismiss)
        
        RumbleFeedback.confirmation()
      } else {
        // Other launchers - just confirmation
        RumbleFeedback.confirmation()
      }
    } else if (focusArea === 'preview') {
      // A button only scales UP previews when focus is on preview area
      scaleUpPreview()
    } else if (focusArea === 'shell-nav') {
      // A button actions based on selected nav item
      if (selectedNavIndex === 0) { // Library selected
        showShellLibrary()
        RumbleFeedback.confirmation()
      } else if (selectedNavIndex === 1) { // Settings selected
        showShellSettings()
        RumbleFeedback.confirmation()
      } else if (selectedNavIndex === 2) { // Gallery selected
        showShellGallery()
        RumbleFeedback.confirmation()
      } else if (selectedNavIndex === 3) { // Notifications selected
        showShellNotifications()
        RumbleFeedback.confirmation()
      }
    } else if (focusArea === 'shell-surface') {
      // A button actions within shell surface (future functionality)
      RumbleFeedback.lightTap()
    }
  }
  // B button handling with InputManager fallback
  if (input.justPressed('B')) {
    const shellLibrary = document.getElementById('shell-library')
    const shellSettings = document.getElementById('shell-settings')
    const shellNotifications = document.getElementById('shell-notifications')
    const shellGallery = document.getElementById('shell-gallery')
    
    if (shellLibrary && shellLibrary.classList.contains('visible')) {
      hideShellLibrary()
      RumbleFeedback.lightTap()
    } else if (shellSettings && shellSettings.classList.contains('visible')) {
      hideShellSettings()
      RumbleFeedback.lightTap()
    } else if (shellNotifications && shellNotifications.classList.contains('visible')) {
      hideShellNotifications()
      RumbleFeedback.lightTap()
    } else if (shellGallery && shellGallery.classList.contains('visible')) {
      hideShellGallery()
      RumbleFeedback.lightTap()
    } else {
      RumbleFeedback.lightTap()
    }
  }
  // X button for overlay toggle and hold-to-scale-down is handled in handleXButtonHold()
  // Y button
  if (input.justPressed('Y')) {
    RumbleFeedback.lightTap()
  }
  
  // Triggers for app switching or other actions
  if (input.justPressed('LT')) {
    RumbleFeedback.menuToggle()
  }
  if (input.justPressed('RT')) {
    RumbleFeedback.menuToggle()
  }
  
  // Right stick for scrolling (future use)
  const rightStick = input.getStick('RIGHT')
  
  // Right stick for slider controls (indices 0, 3, 6)
  if (focusArea === 'settings-display-controls' && [0, 3, 6].includes(selectedDisplayControlIndex)) {
    if (rightStick.magnitude > SLIDER_STICK_THRESHOLD) {
      // Map control index to slider index (0->0, 3->1, 6->2)
      const sliderIndex = selectedDisplayControlIndex === 0 ? 0 : selectedDisplayControlIndex === 3 ? 1 : 2
      
      // Adjust slider value based on horizontal stick movement
      const adjustSpeed = 2 // Adjust by 2% per frame when stick is held
      sliderValues[sliderIndex] += rightStick.x * adjustSpeed
      
      // Clamp between 0 and 100
      sliderValues[sliderIndex] = Math.max(0, Math.min(100, sliderValues[sliderIndex]))
      
      // Update the slider visual
      updateSlider(selectedDisplayControlIndex)
    }
  }
  // Right stick for cycle selector controls (indices 1, 2, 4, 5, 7, 8)
  else if (focusArea === 'settings-display-controls' && [1, 2, 4, 5, 7, 8].includes(selectedDisplayControlIndex)) {
    const currentTime = Date.now()
    if (rightStick.magnitude > STICK_THRESHOLD && currentTime - lastCycleTime > CYCLE_DELAY) {
      // Map control index to cycle index (1->0, 2->1, 4->2, 5->3, 7->4, 8->5)
      const cycleMapping = { 1: 0, 2: 1, 4: 2, 5: 3, 7: 4, 8: 5 }
      const cycleIndex = cycleMapping[selectedDisplayControlIndex]
      
      if (rightStick.x > STICK_THRESHOLD) {
        // Cycle right (next value)
        cycleSelectedIndices[cycleIndex] = (cycleSelectedIndices[cycleIndex] + 1) % cycleValues.length
        updateCycleSelector(selectedDisplayControlIndex)
        lastCycleTime = currentTime
      } else if (rightStick.x < -STICK_THRESHOLD) {
        // Cycle left (previous value)
        cycleSelectedIndices[cycleIndex] = (cycleSelectedIndices[cycleIndex] - 1 + cycleValues.length) % cycleValues.length
        updateCycleSelector(selectedDisplayControlIndex)
        lastCycleTime = currentTime
      }
    }
  }
  
  // Stick clicks
  if (input.justPressed('LS')) {
    RumbleFeedback.lightTap()
  }
  if (input.justPressed('RS')) {
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

// Start the application - ensure focus and gamepad activation
console.log('🚀 Starting application...')

// Check document focus and gamepad activation
if (!ensureDocumentFocus()) {
  console.log('⏳ Waiting for user interaction and controller activation...')
} else {
  console.log('✅ Document has focus and gamepads are ready!')
}

requestAnimationFrame(loop)