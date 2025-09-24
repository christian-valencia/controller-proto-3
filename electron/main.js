import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import url from 'node:url'

let win
const isDev = process.env.VITE_DEV_SERVER_URL

async function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    fullscreenable: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  })
  if (isDev) {
    await win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    const index = url.pathToFileURL(path.join(process.cwd(), '../dist/index.html')).toString()
    await win.loadURL(index)
  }
  win.maximize()
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
