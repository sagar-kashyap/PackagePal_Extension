"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBarManager = void 0;
const vscode = require("vscode");
class StatusBarManager {
    constructor(context) {
        this.context = context;
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        // Command now opens a picker to decide what to change
        this.statusBarItem.command = 'extension.setTargetLanguage';
        this.context.subscriptions.push(this.statusBarItem);
        // Initialize
        const savedTarget = this.context.globalState.get(StatusBarManager.TARGET_LANG_KEY) || 'Go';
        const savedSource = this.context.globalState.get(StatusBarManager.SOURCE_LANG_KEY) || 'Node.js';
        this.update(savedSource, savedTarget);
        this.statusBarItem.show();
    }
    update(source, target) {
        this.statusBarItem.text = `$(rocket) ${source} -> ${target}`;
        this.statusBarItem.tooltip = 'Click to configure migration languages';
        this.context.globalState.update(StatusBarManager.SOURCE_LANG_KEY, source);
        this.context.globalState.update(StatusBarManager.TARGET_LANG_KEY, target);
    }
    async selectTargetLanguage() {
        const languages = ['Go', 'Python', 'Rust', 'Java', 'C++', 'C#', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'TypeScript'];
        const selected = await vscode.window.showQuickPick(languages, {
            placeHolder: 'Select TARGET language for migration suggestions'
        });
        if (selected) {
            const currentSource = this.getSourceLanguage();
            this.update(currentSource, selected);
        }
    }
    async selectSourceLanguage() {
        const languages = ['Node.js', 'Python', 'Java', 'Go', 'Ruby', 'PHP', 'Rust', 'C++', 'C#', 'Swift', 'Kotlin'];
        const selected = await vscode.window.showQuickPick(languages, {
            placeHolder: 'Select SOURCE language of your current project'
        });
        if (selected) {
            const currentTarget = this.getTargetLanguage();
            this.update(selected, currentTarget);
        }
    }
    getTargetLanguage() {
        return this.context.globalState.get(StatusBarManager.TARGET_LANG_KEY) || 'Go';
    }
    getSourceLanguage() {
        return this.context.globalState.get(StatusBarManager.SOURCE_LANG_KEY) || 'Node.js';
    }
    updateSourceLanguageFromEditor(editor) {
        if (!editor)
            return;
        const langId = editor.document.languageId;
        // Capitalize for display (e.g., 'python' -> 'Python')
        // We use the languageId directly as requested, just making it look nice.
        const displayLang = langId.charAt(0).toUpperCase() + langId.slice(1);
        const currentTarget = this.getTargetLanguage();
        this.update(displayLang, currentTarget);
    }
}
exports.StatusBarManager = StatusBarManager;
StatusBarManager.TARGET_LANG_KEY = 'packageMigrator.targetLanguage';
StatusBarManager.SOURCE_LANG_KEY = 'packageMigrator.sourceLanguage';
//# sourceMappingURL=statusBar.js.map