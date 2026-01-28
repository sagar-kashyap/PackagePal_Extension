# PackagePal 🚀

**PackagePal** is an AI-powered VS Code extension designed to help developers migrate codebases from one language to another (e.g., Node.js to Go, Python to Rust) by identifying package dependencies and finding their best equivalents in the target language.

Powered by Google's **Gemini AI**, it provides accurate, context-aware suggestions, code snippets, and direct links to official documentation.

## ✨ Features

### 1. 🔍 Hover Suggestions
Simply hover over an import statement in your code (e.g., `import axios from 'axios';`) to see instant suggestions for equivalent packages in your target language.
- Shows the **Top 3** recommended alternatives.
- Includes a brief description and a usage code snippet.
- Provides a direct **[📘 Official Documentation]** link.

### 2. 🧠 Auto-Detect Source Language
The extension automatically detects the source language based on your active file (e.g., opening a `.py` file sets the Source to `Python`). You don't need to configure this manually every time you switch files.

### 3. 📂 Sidebar Explorer
Open the **PackagePal** view in the Activity Bar (Rocket icon) to see a comprehensive list of all packages discovered in your current file.
- Click on any package to expand potential replacements.
- View details like Description, Code Snippets, and Documentation links in a structured tree view.

### 4. ⚙️ Flexible Configuration
- **Target Language**: Easily switch your desired target language (e.g., "Go", "Rust", "Python") via the Status Bar or Command Palette.
- **Source Language**: Auto-detected, but can be manually overridden if needed.

## 🚀 Getting Started

1.  **Install** the extension.
2.  **Set your Gemini API Key**:
    - You will be prompted to enter it on first use, or run the command `Set Gemini API Key`.
    - Get a free key at [Google AI Studio](https://aistudio.google.com/).
3.  **Select Target Language**:
    - Click the status bar item `$(rocket) Source -> Target` (bottom right).
    - Or run `Set Target Language` from the command palette.
4.  **Start Migrating**:
    - Open any source file and hover over imports!

## ⚙️ Commands

- `Set Target Language`: Choose the language you are migrating *to*.
- `Set Source Language`: Manually set the language you are migrating *from* (usually auto-detected).
- `Set Gemini API Key`: securely store your API key.
- `Scan File for Packages`: Manually refresh the Sidebar view for the current file.

## 🔒 Privacy & Security

- Your **API Key** is stored securely using VS Code's native Secret Storage.
- Code snippets (package names only) are sent to the Gemini API solely for the purpose of finding suggestions. No other code is shared.

## 📝 Release Notes

### 0.0.1
- Initial release.
- Support for detailed multi-option suggestions.
- Auto-detection of source language.
- Integration with Gemini Pro.

---

**Enjoy smoother migrations!** 🚀
