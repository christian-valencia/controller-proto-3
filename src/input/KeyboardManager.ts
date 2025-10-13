export type ButtonName =
  | 'A' | 'B' | 'X' | 'Y'
  | 'LB' | 'RB' | 'LT' | 'RT'
  | 'LS' | 'RS'
  | 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
  | 'VIEW' | 'MENU' | 'HOME'

// Keyboard mapping to gamepad buttons
const KEY_MAP: Record<string, ButtonName> = {
  // ABXY mapping (can use either WASD or IJKL layout)
  'a': 'A', 'A': 'A',
  's': 'B', 'S': 'B', 
  'd': 'X', 'D': 'X',
  'w': 'Y', 'W': 'Y',
  
  // Alternative ABXY mapping (closer to Xbox layout)
  'j': 'A', 'J': 'A',  // A (bottom)
  'l': 'B', 'L': 'B',  // B (right)
  'i': 'Y', 'I': 'Y',  // Y (top)
  'k': 'X', 'K': 'X',  // X (left)
  
  // Arrow keys for D-pad
  'ArrowUp': 'UP',
  'ArrowDown': 'DOWN', 
  'ArrowLeft': 'LEFT',
  'ArrowRight': 'RIGHT',
  
  // Shoulder buttons
  'q': 'LB', 'Q': 'LB',
  'e': 'RB', 'E': 'RB',
  'z': 'LT', 'Z': 'LT',
  'c': 'RT', 'C': 'RT',
  
  // Stick clicks
  'v': 'LS', 'V': 'LS',
  'n': 'RS', 'N': 'RS',
  
  // View/Menu buttons
  'Tab': 'VIEW',
  'Enter': 'MENU',
  'Escape': 'HOME'
}

export class KeyboardManager {
  private keysDown: Set<string> = new Set()
  private prevKeysDown: Set<string> = new Set()
  
  // Simulated stick positions using WASD and arrow keys
  private leftStick = { x: 0, y: 0 }
  private rightStick = { x: 0, y: 0 }

  constructor() {
    window.addEventListener('keydown', (e) => {
      // Prevent default behavior first for game controls
      if (KEY_MAP[e.key] || e.key === 'Tab') {
        e.preventDefault()
      }
      
      this.keysDown.add(e.key)
      this.updateSticks()
    })

    window.addEventListener('keyup', (e) => {
      // Prevent default on keyup too for consistency
      if (KEY_MAP[e.key] || e.key === 'Tab') {
        e.preventDefault()
      }
      
      this.keysDown.delete(e.key)
      this.updateSticks()
    })
  }

  private updateSticks() {
    // Left stick simulation with WASD + CTRL/SHIFT modifiers
    let lx = 0, ly = 0
    const isCtrlPressed = this.keysDown.has('Control')
    
    if (isCtrlPressed) {
      // Use WASD for left stick when Ctrl is held
      if (this.keysDown.has('a') || this.keysDown.has('A')) lx -= 1
      if (this.keysDown.has('d') || this.keysDown.has('D')) lx += 1
      if (this.keysDown.has('w') || this.keysDown.has('W')) ly += 1  // Up is positive Y
      if (this.keysDown.has('s') || this.keysDown.has('S')) ly -= 1  // Down is negative Y
    }
    
    // Right stick simulation with IJKL + ALT modifier
    let rx = 0, ry = 0
    const isAltPressed = this.keysDown.has('Alt')
    
    if (isAltPressed) {
      // Use IJKL for right stick when Alt is held
      if (this.keysDown.has('j') || this.keysDown.has('J')) rx -= 1
      if (this.keysDown.has('l') || this.keysDown.has('L')) rx += 1
      if (this.keysDown.has('i') || this.keysDown.has('I')) ry += 1
      if (this.keysDown.has('k') || this.keysDown.has('K')) ry -= 1
    }

    this.leftStick = { x: lx, y: ly }
    this.rightStick = { x: rx, y: ry }
  }

  update() {
    this.prevKeysDown = new Set(this.keysDown)
  }

  isDown(buttonName: ButtonName): boolean {
    // Check all keys that map to this button
    for (const [key, mappedButton] of Object.entries(KEY_MAP)) {
      if (mappedButton === buttonName && this.keysDown.has(key)) {
        return true
      }
    }
    return false
  }

  justPressed(buttonName: ButtonName): boolean {
    const isDownNow = this.isDown(buttonName)
    if (!isDownNow) return false
    
    // Check if this button was NOT down in the previous frame
    for (const [key, mappedButton] of Object.entries(KEY_MAP)) {
      if (mappedButton === buttonName && this.prevKeysDown.has(key)) {
        return false  // Was already down
      }
    }
    return true
  }

  justReleased(buttonName: ButtonName): boolean {
    const isDownNow = this.isDown(buttonName)
    if (isDownNow) return false
    
    // Check if this button WAS down in the previous frame
    for (const [key, mappedButton] of Object.entries(KEY_MAP)) {
      if (mappedButton === buttonName && this.prevKeysDown.has(key)) {
        return true  // Was down, now isn't
      }
    }
    return false
  }

  getStick(which: 'LEFT' | 'RIGHT'): { x: number, y: number, magnitude: number } {
    const stick = which === 'LEFT' ? this.leftStick : this.rightStick
    const magnitude = Math.hypot(stick.x, stick.y)
    
    // Normalize if magnitude > 1 (diagonal movement)
    if (magnitude > 1) {
      return {
        x: stick.x / magnitude,
        y: stick.y / magnitude,
        magnitude: 1
      }
    }
    
    return {
      x: stick.x,
      y: stick.y,
      magnitude
    }
  }

  getKeyMappings(): Record<string, ButtonName> {
    return { ...KEY_MAP }
  }
}
