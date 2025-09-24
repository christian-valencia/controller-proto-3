import { InputManager } from './input/InputManager'
import { createHud } from './ui/Hud'

const input = new InputManager()
const hud = createHud()

// Simple demo cube element for feedback
const container = document.createElement('div')
container.className = 'center'
const card = document.createElement('div')
card.className = 'card'
card.innerHTML = `<div style="text-align:center">
  <div style="font-size:22px;margin-bottom:8px">ROG Ally Template</div>
  <div style="opacity:.8;margin-bottom:12px">Press <b>A</b> or <b>J</b> to rumble, <b>F</b> for full screen</div>
  <div style="opacity:.8;margin-bottom:12px">Use controller or keyboard: <b>Arrow keys</b>, <b>WASD/IJKL</b>, <b>Ctrl+WASD</b> (stick)</div>
  <div><span class="pill">ABXY</span><span class="pill">LB/RB</span><span class="pill">LT/RT</span><span class="pill">D‑pad</span><span class="pill">Sticks</span></div>
</div>`
container.appendChild(card)
document.getElementById('app')!.appendChild(container)

// Fullscreen toggle via keyboard or View/Menu buttons if exposed
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

// Main loop
function loop() {
  input.update()

  // Example actions
  if (input.justPressed('A')) {
    rumble(0.8, 120)
  }
  if (input.justPressed('VIEW') || input.justPressed('MENU')) {
    toggleFullscreen()
  }

  // Move the card subtly with left stick; rotate with right stick
  const ls = input.getStick('LEFT')
  const rs = input.getStick('RIGHT')
  card.style.transform = `translate(${ls.x * 10}px, ${ls.y * 10}px) rotate(${rs.x * 5}deg)`

  hud.render(input)
  requestAnimationFrame(loop)
}
requestAnimationFrame(loop)

async function rumble(intensity = 1, durationMs = 200) {
  const g = input.firstGamepad()
  if (!g) return
  const v = g.vibrationActuator
  if (v) {
    try { await v.playEffect('dual-rumble', { duration: durationMs, strongMagnitude: intensity, weakMagnitude: intensity }) } catch {}
  }
}
