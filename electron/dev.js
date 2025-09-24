// Starts Vite dev server and then launches Electron pointing to it.
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const vite = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run','dev'], {
  cwd: path.join(__dirname,'..'), stdio: 'inherit', shell: false
})
// wait a bit, then start electron with VITE_DEV_SERVER_URL
setTimeout(()=>{
  const electron = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['electron','electron/main.js'],
    { cwd: path.join(__dirname,'..'), stdio: 'inherit', env: {...process.env, VITE_DEV_SERVER_URL: 'http://localhost:5173/'} }
  )
}, 1500)
