import { InputManager } from '../input/InputManager'

export function createHud() {
  const root = document.createElement('div')
  root.className = 'hud'
  const title = document.createElement('h2')
  title.textContent = 'Controller & Keyboard HUD'
  const pre = document.createElement('pre')
  root.appendChild(title)
  root.appendChild(pre)
  document.body.appendChild(root)

  return {
    render(input: InputManager) {
      const g = input.firstGamepad()
      const activeInput = input.getActiveInputMethod()
      
      if (!g && activeInput === 'none') {
        pre.textContent = 'Connect a controller or use keyboard controls…\n\nKeyboard Controls:\n• Arrow Keys: D-pad\n• A/S/D/W or I/J/K/L: ABXY buttons\n• Q/E: LB/RB  Z/C: LT/RT\n• Tab: View  Enter: Menu  Esc: Home\n• Ctrl+WASD: Left stick\n• Alt+IJKL: Right stick'
        return
      }
      
      const btns = [
        'A','B','X','Y','LB','RB','LT','RT','LS','RS','UP','DOWN','LEFT','RIGHT','VIEW','MENU','HOME'
      ] as const
      const pressed = btns.filter(b => input.isDown(b as any)).join(' ')
      const ls = input.getStick('LEFT')
      const rs = input.getStick('RIGHT')
      
      const lines = []
      
      if (g) {
        lines.push(`Gamepad: ${g.id}`)
      }
      
      lines.push(`Input Method: ${activeInput}`)
      lines.push(`Buttons: ${pressed || '(none)'}`)
      lines.push(`LS: x=${ls.x.toFixed(2)} y=${ls.y.toFixed(2)} mag=${ls.magnitude.toFixed(2)}`)
      lines.push(`RS: x=${rs.x.toFixed(2)} y=${rs.y.toFixed(2)} mag=${rs.magnitude.toFixed(2)}`)
      
      pre.textContent = lines.join('\n')
    }
  }
}
