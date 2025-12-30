# Terminal

A minimal, beautiful terminal emulator for macOS built with Electron.

![macOS](https://img.shields.io/badge/macOS-000000?style=flat&logo=apple&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-47848F?style=flat&logo=electron&logoColor=white)

## Features

### Multi-Tab Support
- Open multiple terminal sessions in tabs
- Quick tab navigation with keyboard shortcuts
- Close individual tabs without losing other sessions

### Split Panes
- Split terminals vertically or horizontally
- Right-click context menu for split options
- Resize panes by dragging the divider
- Close individual panes

### Command Shortcuts
Create custom shortcuts for frequently used commands:

| Command | Description |
|---------|-------------|
| `cc` | Create a new shortcut |
| `/` or `cc list` | Open shortcut picker |
| `/shortcutname` | Run a saved shortcut directly |
| `cc del` | Delete a shortcut (interactive) |
| `cc delete <name>` | Delete a shortcut by name |

### Folder Navigation
- Type `finder` to open a native folder picker dialog
- Quickly `cd` into any directory using the macOS file browser

### Native macOS Design
- Transparent window with vibrancy effect
- Native traffic light buttons
- Clean, minimal interface

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd + T` | New tab |
| `Cmd + W` | Close tab |
| `Cmd + Shift + ]` | Next tab |
| `Cmd + Shift + [` | Previous tab |
| `Cmd + K` | Clear terminal |
| `Cmd + +` | Zoom in |
| `Cmd + -` | Zoom out |
| `Cmd + 0` | Reset zoom |

## Installation

```bash
# Clone the repository
git clone https://github.com/beasting1231/terminal-app.git
cd terminal-app

# Install dependencies
npm install

# Run the app
npm start
```

## Building

```bash
# Build for macOS
npm run build
```

The built app will be in the `dist/` folder.

## Requirements

- macOS
- Node.js 18+

## License

MIT
