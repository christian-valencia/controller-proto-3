// Packages the Electron app by copying dist and creating a minimal runnable folder.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const out = path.join(__dirname, 'dist')
fs.rmSync(out, { recursive:true, force:true })
fs.mkdirSync(out, { recursive:true })
// Copy electron runtime deps via npm i --production (user will run manually)
// Copy dist (built by `npm run build` in root)
fs.cpSync(path.join(root,'dist'), path.join(out,'dist'), { recursive:true })
// Copy electron main.js
fs.cpSync(path.join(__dirname,'main.js'), path.join(out,'main.js'))
// Write a README
fs.writeFileSync(path.join(out,'README.txt'), 'Run: npm i --omit=dev && npx electron ./main.js\n')
console.log('Electron bundle staged in electron/dist')
