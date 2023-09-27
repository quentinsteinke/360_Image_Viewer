const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let preferencesWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        // set window size to screen size
        width: 1920,
        height: 1080,
        icon: path.join(__dirname, '../assets/images/3d.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
    });

    mainWindow.maximize();

    mainWindow.loadFile('renderer/index.html');
    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    // mainWindow.webContents.openDevTools();

    // Add this line to send the event after the window has been shown
    mainWindow.once('ready-to-show', () => {
        mainWindow.webContents.send('open-file-dialog');
    });

    const menu = Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                {
                    label: 'Open File',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => {
                        dialog.showOpenDialog(mainWindow, {
                            properties: ['openFile (ctrl+o)'],
                            filters: [
                                { name: 'Images', extensions: ['jpg', 'png'] }
                            ]
                        }).then(result => {
                            if (!result.canceled && result.filePaths.length > 0) {
                                mainWindow.webContents.send('selected-file', result.filePaths[0]);
                            }
                        }).catch(err => {
                            console.log(err);
                        });
                    }
                },
                {
                    label: 'Preferences',
                    accelerator: 'CmdOrCtrl+,p',
                    click: () => {
                        openPreferences();
                    }
                }
            ]
        }
    ]);
    
    Menu.setApplicationMenu(menu);
    
}

function openPreferences() {
    if (preferencesWindow) {
        preferencesWindow.focus();
        return;
    }

    preferencesWindow = new BrowserWindow({
        width: 500,
        height: 400,
        icon: path.join(__dirname, '../assets/images/3d.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        autoHideMenuBar: true
    });

    preferencesWindow.setMenuBarVisibility(false);

    preferencesWindow.loadFile('renderer/preferences.html');

    preferencesWindow.on('closed', function () {
        preferencesWindow = null;
    });
}

ipcMain.on('open-file-dialog', (event) => {
    dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'Images', extensions: ['jpg', 'png'] }]
    }).then(result => {
        if (!result.canceled && result.filePaths.length > 0) {
            event.sender.send('selected-file', result.filePaths[0]);
        }
    }).catch(err => {
        console.error(err);
    });
});

ipcMain.on('minimize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.minimize();
});

ipcMain.on('toggle-maximize-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win.isMaximized()) {
        win.unmaximize();
    } else {
        win.maximize();
    }
});

ipcMain.on('close-window', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    win.close();
});

app.on('ready', createWindow);
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});
