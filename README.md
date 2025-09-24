# ROG Ally Controller Prototype Template (Vite + TS + Gamepad API)

A tiny starter you can vibe-code in VS Code and run on your ASUS ROG Ally.
It gives you: hotplug, ABXY/LB/RB/Triggers, D‑pad, sticks with deadzones, edge events, rumble test, and an on-screen HUD.

## Quick Start
```bash
npm install
npm run dev
```
Open http://localhost:5173 then press any gamepad button. Press `F` to toggle full screen.

### Optional: Electron wrapper
```bash
npm run start:electron   # dev w/ live reload (launches Vite + Electron)
npm run package:electron # builds portable exe to /electron/dist
```

## Notes
- Uses the Web Gamepad API (works in Chrome/Edge/Electron). ROG Ally shows up as an XInput gamepad.
- System/vendor buttons (Windows key, Armoury Crate, occasionally "View/Share") may not be exposed to the web. ABXY/LB/RB/LT/RT, sticks, and D‑pad are.
- Rumble depends on driver support (via `gamepad.vibrationActuator`).

## Files to tweak
- `src/input/GamepadManager.ts` — mapping / deadzones / events
- `src/main.ts` — your loop / scenes
- `src/ui/Hud.ts` — simple overlay for debugging inputs
