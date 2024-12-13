# Scribe

## Overview

Let your Github contribution graph reflect how long you code. Scribe is a VS Code extension that helps track your coding activity. It allows you to:

- Set a timer for coding sessions.
- Log your coding activity duration.
- Customize the timer duration through settings.

## Features

- **Timer Settings:** Easily configure the timer duration for coding activity via VS Code settings.
- **Command Integration:** Run commands to start, stop, or view coding sessions.
- **Lightweight Design:** Minimal impact on system performance.

# How to install the extension locally

1. Download the extension from here [Extension link](https://drive.google.com/file/d/1kBRRfXTAdFDkcZk9obNc0-XUhi1lUnjy/view?usp=sharing)

2. Open Visual Studio Code.

3. Go to the Extensions view (click on the Extensions icon in the Activity Bar on the side).

4. Click on the three-dot menu (top right) and select Install from VSIX...

5. Navigate to the location where you generated the .vsix file and select it.

This will install the extension in your local VS Code environment

## How to Use

1. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`).
2. Search for `Activate Scribe` to activate extension.
3. Search for `Restart Scribe` to restart extension.
4. Search for `Disable Scribe` to disable extension.
5. Customize settings in `settings.json` or through the UI:
   ```json
   "scribe.timerDurationMinutes": 30
   ```

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.
