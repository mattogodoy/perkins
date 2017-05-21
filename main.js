const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const clipboard = require('electron-clipboard-extended')
const globalShortcut = electron.globalShortcut
const ipcMain = electron.ipcMain
const path = require('path')
const url = require('url')
const storage = require('electron-json-storage')
const robot = require('robotjs')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let clipboardHistory

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    icon: __dirname + '/img/icon.png',
    alwaysOnTop: true,
    skipTaskbar: true,
    center: true
  })

  //app.dock.hide()

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  win.webContents.openDevTools()

  // Emitted when the window is closed.
  win.on('closed', () => {
    win = null
  })

  win.on('blur', () => {
    win.hide()
  })

  win.webContents.on('did-finish-load', function() {
    win.webContents.send('history-changed', clipboardHistory);
  })
}

app.on('ready', function () {
  storage.get('history', function(error, data) {
    if(error){
      throw error
    } else {
      if(Object.keys(data).length === 0){ // Check if the data objecy is empty
        clipboardHistory = []
      } else {
        clipboardHistory = data
      }
    }
  });

  createWindow()

  globalShortcut.register('CommandOrControl+Alt+L', function () {
    robot.keyTap("tab", ["command"])

    setTimeout(function(){
      robot.keyTap("v", ["command"])
    }, 200)
  })
})

app.on('will-quit', function () {
  globalShortcut.unregisterAll()
  clipboard.off('text-changed')
  clipboard.stopWatching()
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  } else {
    win.show()
  }
})

ipcMain.on('history-changed', function(e, msg) {
  if(msg == 'clear'){
    storage.clear(function(error) {
      if(error){
        throw error
      } else {
        clipboardHistory = []
        console.log('History cleared!');
      }
    })
  }
});

clipboard.on('text-changed', () => {
  let currentText = clipboard.readText()

  // Maximum of 100 elements
  if(clipboardHistory.length >= 99){
    clipboardHistory.splice(-1,1) // Remove last element
  }

  clipboardHistory.unshift(currentText) // Add new text to the front of history
  clipboardHistory = Array.from(new Set(clipboardHistory)) // Remove duplicates

  win.webContents.send('history-changed', clipboardHistory);

  storage.set('history', clipboardHistory, function(error) {
    if(error){
      throw error
    } else {
      console.log('Saved!');
    }
  });
})

clipboard.startWatching()
