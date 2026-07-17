# Aura JSON Formatter

A beautiful, private, client-side JSON formatter, validator, and minifier. Part of the Aura utility series.

## Features

- **Live JSON Validation**: Validates JSON syntax as you type with a debounced live badge indicating `✓ Valid` or `✗ Invalid`.
- **Pretty Print & Minify Modes**: Toggle between 2-space indented formatting and single-line compact minification.
- **Detailed Error Handling**: Displays clean syntax error alerts including line/column details and a contextual code snippet showing exactly where the syntax error is.
- **Syntax Highlighting**: Beautifully tokenizes output into distinct colors for keys, strings, numbers, booleans, and null values.
- **Clipboard & Workspace Actions**: Instantly copy outputs with visual confirmation or clear the editor.
- **Keyboard Shortcuts**:
  - `Ctrl + Enter` (or `⌘ + Enter` on macOS): Format JSON input.
  - `Alt + F`: Switch to Format Mode.
  - `Alt + M`: Switch to Minify Mode.
  - `Alt + S`: Load Sample JSON.
  - `Alt + C`: Clear Workspace.
  - `Alt + K`: Copy Output to Clipboard.

## Running Locally

Since this tool is built entirely using vanilla HTML/CSS/JS without build tools or external server dependencies:
1. Double-click or open `index.html` in any modern web browser.
2. Alternatively, serve it locally:
   ```bash
   npx serve .
   ```
