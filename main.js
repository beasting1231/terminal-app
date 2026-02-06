const { app, BrowserWindow, Menu, ipcMain, dialog, shell, globalShortcut } = require('electron');
const path = require('path');

let mainWindow;
let isHidden = false;

// Global hotkey to toggle terminal visibility
const GLOBAL_HOTKEY = 'Control+`';

function toggleWindow() {
    if (!mainWindow) {
        createWindow();
        return;
    }

    if (isHidden || !mainWindow.isVisible()) {
        mainWindow.show();
        mainWindow.focus();
        isHidden = false;
    } else {
        mainWindow.hide();
        isHidden = true;
    }
}

// Handle closing window when last tab is closed
ipcMain.on('close-window', () => {
    if (mainWindow) {
        mainWindow.close();
    }
});

// Handle opening URLs in default browser
ipcMain.handle('open-external-url', async (_, url) => {
    try {
        await shell.openExternal(url);
        return true;
    } catch (err) {
        console.error('Failed to open URL:', err);
        return false;
    }
});

// Handle folder picker dialog
ipcMain.handle('open-folder-dialog', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Select Directory'
    });
    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 600,
        minWidth: 400,
        minHeight: 300,
        title: 'Terminal',
        transparent: true,
        backgroundColor: '#00000000',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 14, y: 13 },
        hasShadow: true,
        vibrancy: 'popover',
        visualEffectState: 'active'
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    mainWindow.on('enter-full-screen', () => {
        mainWindow.webContents.send('fullscreen-change', true);
    });

    mainWindow.on('leave-full-screen', () => {
        mainWindow.webContents.send('fullscreen-change', false);
    });
}

function createMenu() {
    const template = [
        {
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'Shell',
            submenu: [
                {
                    label: 'New Tab',
                    accelerator: 'CmdOrCtrl+T',
                    click: () => mainWindow?.webContents.send('new-tab')
                },
                {
                    label: 'Close Tab',
                    accelerator: 'CmdOrCtrl+W',
                    click: () => mainWindow?.webContents.send('close-tab')
                },
                { type: 'separator' },
                {
                    label: 'Next Tab',
                    accelerator: 'CmdOrCtrl+Shift+]',
                    click: () => mainWindow?.webContents.send('next-tab')
                },
                {
                    label: 'Previous Tab',
                    accelerator: 'CmdOrCtrl+Shift+[',
                    click: () => mainWindow?.webContents.send('prev-tab')
                },
                { type: 'separator' },
                ...Array.from({ length: 9 }, (_, i) => ({
                    label: `Tab ${i + 1}`,
                    accelerator: `CmdOrCtrl+${i + 1}`,
                    click: () => mainWindow?.webContents.send('switch-to-tab-index', i)
                })),
                { type: 'separator' },
                {
                    label: 'Clear',
                    accelerator: 'CmdOrCtrl+K',
                    click: () => mainWindow?.webContents.send('clear-terminal')
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                {
                    label: 'Select All',
                    accelerator: 'CmdOrCtrl+A',
                    click: () => mainWindow?.webContents.send('select-all')
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                { type: 'separator' },
                {
                    label: 'Toggle Quick Terminal',
                    accelerator: GLOBAL_HOTKEY,
                    click: toggleWindow
                },
                { type: 'separator' },
                { role: 'front' }
            ]
        }
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
    createWindow();
    createMenu();

    // Register global hotkey
    const registered = globalShortcut.register(GLOBAL_HOTKEY, toggleWindow);
    if (!registered) {
        console.error('Failed to register global hotkey:', GLOBAL_HOTKEY);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    // Unregister all global shortcuts
    globalShortcut.unregisterAll();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
