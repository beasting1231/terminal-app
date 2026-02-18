const { app, BrowserWindow, Menu, ipcMain, dialog, shell, globalShortcut } = require('electron');
const path = require('path');

const windows = new Set();
let isHidden = false;

// Global hotkey to toggle terminal visibility
const GLOBAL_HOTKEY = 'Control+`';

const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'ftp:']);

function normalizeExternalUrl(url) {
    if (typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed) return null;

    const withScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed) || trimmed.startsWith('//')
        ? trimmed
        : `https://${trimmed}`;

    try {
        const parsed = new URL(withScheme);
        return ALLOWED_EXTERNAL_PROTOCOLS.has(parsed.protocol) ? parsed.toString() : null;
    } catch {
        return null;
    }
}

function toggleWindow() {
    const allWindows = Array.from(windows);

    if (allWindows.length === 0) {
        createWindow();
        return;
    }

    const firstWindow = allWindows[0];
    if (isHidden || !firstWindow.isVisible()) {
        firstWindow.show();
        firstWindow.focus();
        isHidden = false;
    } else {
        firstWindow.hide();
        isHidden = true;
    }
}

// Handle closing window when last tab is closed
ipcMain.on('close-window', (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
        window.close();
    }
});

// Handle opening URLs in default browser
ipcMain.handle('open-external-url', async (_, url) => {
    const normalizedUrl = normalizeExternalUrl(url);
    if (!normalizedUrl) return false;

    try {
        await shell.openExternal(normalizedUrl);
        return true;
    } catch (err) {
        console.error('Failed to open URL:', err);
        return false;
    }
});

// Handle folder picker dialog
ipcMain.handle('open-folder-dialog', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(window, {
        properties: ['openDirectory'],
        title: 'Select Directory'
    });
    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

// Handle always on top toggle
ipcMain.handle('toggle-always-on-top', async (event, alwaysOnTop) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
        window.setAlwaysOnTop(alwaysOnTop);
        return true;
    }
    return false;
});

function createWindow() {
    // Offset new windows by 30px down and right from the previous window
    const existingWindows = Array.from(windows);
    let x, y;

    if (existingWindows.length > 0) {
        const lastWindow = existingWindows[existingWindows.length - 1];
        const bounds = lastWindow.getBounds();
        x = bounds.x + 30;
        y = bounds.y + 30;
    }

    const window = new BrowserWindow({
        width: 900,
        height: 600,
        minWidth: 400,
        minHeight: 300,
        x,
        y,
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

    windows.add(window);

    window.loadFile('index.html');

    window.webContents.setWindowOpenHandler(({ url }) => {
        const normalizedUrl = normalizeExternalUrl(url);
        if (normalizedUrl) {
            shell.openExternal(normalizedUrl).catch((err) => {
                console.error('Failed to open external URL from new window request:', err);
            });
        }
        return { action: 'deny' };
    });

    window.webContents.on('will-navigate', (event, url) => {
        const appUrl = window.webContents.getURL();
        if (url === appUrl) return;

        const normalizedUrl = normalizeExternalUrl(url);
        if (normalizedUrl) {
            event.preventDefault();
            shell.openExternal(normalizedUrl).catch((err) => {
                console.error('Failed to open external URL from navigation:', err);
            });
        }
    });

    window.on('closed', () => {
        windows.delete(window);
    });

    window.on('enter-full-screen', () => {
        window.webContents.send('fullscreen-change', true);
    });

    window.on('leave-full-screen', () => {
        window.webContents.send('fullscreen-change', false);
    });

    return window;
}

function createMenu() {
    const getFocusedWindow = () => BrowserWindow.getFocusedWindow();

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
                    label: 'New Window',
                    accelerator: 'CmdOrCtrl+N',
                    click: createWindow
                },
                {
                    label: 'New Tab',
                    accelerator: 'CmdOrCtrl+T',
                    click: () => getFocusedWindow()?.webContents.send('new-tab')
                },
                {
                    label: 'Close Tab',
                    accelerator: 'CmdOrCtrl+W',
                    click: () => getFocusedWindow()?.webContents.send('close-tab')
                },
                { type: 'separator' },
                {
                    label: 'Next Tab',
                    accelerator: 'CmdOrCtrl+Shift+]',
                    click: () => getFocusedWindow()?.webContents.send('next-tab')
                },
                {
                    label: 'Previous Tab',
                    accelerator: 'CmdOrCtrl+Shift+[',
                    click: () => getFocusedWindow()?.webContents.send('prev-tab')
                },
                { type: 'separator' },
                ...Array.from({ length: 9 }, (_, i) => ({
                    label: `Tab ${i + 1}`,
                    accelerator: `CmdOrCtrl+${i + 1}`,
                    click: () => getFocusedWindow()?.webContents.send('switch-to-tab-index', i)
                })),
                { type: 'separator' },
                {
                    label: 'Clear',
                    accelerator: 'CmdOrCtrl+K',
                    click: () => getFocusedWindow()?.webContents.send('clear-terminal')
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
                    click: () => getFocusedWindow()?.webContents.send('select-all')
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

// Dock menu for macOS
function createDockMenu() {
    const dockMenu = Menu.buildFromTemplate([
        {
            label: 'New Window',
            click: createWindow
        }
    ]);
    app.dock.setMenu(dockMenu);
}

app.whenReady().then(() => {
    createWindow();
    createMenu();

    // Create dock menu (macOS only)
    if (process.platform === 'darwin') {
        createDockMenu();
    }

    // Register global hotkey
    const registered = globalShortcut.register(GLOBAL_HOTKEY, toggleWindow);
    if (!registered) {
        console.error('Failed to register global hotkey:', GLOBAL_HOTKEY);
    }
});

app.on('window-all-closed', () => {
    // Quit the app when all windows are closed (including macOS)
    app.quit();
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
