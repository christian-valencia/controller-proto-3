import { GamepadManager, ButtonName } from './GamepadManager'
import { KeyboardManager } from './KeyboardManager'

export type { ButtonName } from './GamepadManager'

export class InputManager {
  private gamepadManager: GamepadManager
  private keyboardManager: KeyboardManager

  constructor() {
    this.gamepadManager = new GamepadManager()
    this.keyboardManager = new KeyboardManager()
  }

  update() {
    this.gamepadManager.update()
    this.keyboardManager.update()
  }

  // Check if button is down on either gamepad or keyboard
  isDown(buttonName: ButtonName, padIndex = 0): boolean {
    return this.gamepadManager.isDown(buttonName, padIndex) || 
           this.keyboardManager.isDown(buttonName)
  }

  // Check if button was just pressed on either gamepad or keyboard
  justPressed(buttonName: ButtonName, padIndex = 0): boolean {
    return this.gamepadManager.justPressed(buttonName, padIndex) || 
           this.keyboardManager.justPressed(buttonName)
  }

  // Check if button was just released on either gamepad or keyboard
  justReleased(buttonName: ButtonName, padIndex = 0): boolean {
    return this.gamepadManager.justReleased(buttonName, padIndex) || 
           this.keyboardManager.justReleased(buttonName)
  }

  // Get combined stick input (gamepad takes priority, keyboard as fallback)
  getStick(which: 'LEFT' | 'RIGHT', padIndex = 0): { x: number, y: number, magnitude: number } {
    const gamepadStick = this.gamepadManager.getStick(which, padIndex)
    
    // If gamepad stick has significant input, use it
    if (gamepadStick.magnitude > 0.1) {
      return gamepadStick
    }
    
    // Otherwise, use keyboard input
    return this.keyboardManager.getStick(which)
  }

  // Access to individual managers for specific needs
  get gamepad(): GamepadManager {
    return this.gamepadManager
  }

  get keyboard(): KeyboardManager {
    return this.keyboardManager
  }

  // Helper method to get the first connected gamepad (for rumble, etc.)
  firstGamepad(): Gamepad | null {
    return this.gamepadManager.first()
  }

  // Helper method to check what input method is currently being used
  getActiveInputMethod(): 'gamepad' | 'keyboard' | 'both' | 'none' {
    const hasGamepadInput = this.gamepadManager.first() !== null
    const hasKeyboardInput = this.keyboardManager.getStick('LEFT').magnitude > 0 ||
                            this.keyboardManager.getStick('RIGHT').magnitude > 0 ||
                            Object.values(this.keyboardManager.getKeyMappings()).some(buttonName => 
                              this.keyboardManager.isDown(buttonName)
                            )
    
    if (hasGamepadInput && hasKeyboardInput) return 'both'
    if (hasGamepadInput) return 'gamepad'
    if (hasKeyboardInput) return 'keyboard'
    return 'none'
  }
}
