import * as vscode from 'vscode';

export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;
    private context: vscode.ExtensionContext;
    private static readonly TARGET_LANG_KEY = 'packageMigrator.targetLanguage';
    private static readonly SOURCE_LANG_KEY = 'packageMigrator.sourceLanguage';

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        // Command now opens a picker to decide what to change
        this.statusBarItem.command = 'extension.setTargetLanguage';
        this.context.subscriptions.push(this.statusBarItem);

        // Initialize
        const savedTarget = this.context.globalState.get<string>(StatusBarManager.TARGET_LANG_KEY) || 'Go';
        const savedSource = this.context.globalState.get<string>(StatusBarManager.SOURCE_LANG_KEY) || 'Node.js';
        this.update(savedSource, savedTarget);
        this.statusBarItem.show();
    }

    update(source: string, target: string) {
        this.statusBarItem.text = `$(rocket) ${source} -> ${target}`;
        this.statusBarItem.tooltip = 'Click to configure migration languages';
        this.context.globalState.update(StatusBarManager.SOURCE_LANG_KEY, source);
        this.context.globalState.update(StatusBarManager.TARGET_LANG_KEY, target);
    }

    async selectTargetLanguage() {
        const languages = ['Go', 'Python', 'Rust', 'Java', 'C++', 'C#', 'Ruby', 'PHP'];
        const selected = await vscode.window.showQuickPick(languages, {
            placeHolder: 'Select TARGET language for migration suggestions'
        });

        if (selected) {
            const currentSource = this.getSourceLanguage();
            this.update(currentSource, selected);
        }
    }

    async selectSourceLanguage() {
        const languages = ['Node.js', 'Python', 'Java', 'Go', 'Ruby', 'PHP', 'Rust'];
        const selected = await vscode.window.showQuickPick(languages, {
            placeHolder: 'Select SOURCE language of your current project'
        });

        if (selected) {
            const currentTarget = this.getTargetLanguage();
            this.update(selected, currentTarget);
        }
    }

    getTargetLanguage(): string {
        return this.context.globalState.get<string>(StatusBarManager.TARGET_LANG_KEY) || 'Go';
    }

    getSourceLanguage(): string {
        return this.context.globalState.get<string>(StatusBarManager.SOURCE_LANG_KEY) || 'Node.js';
    }

    updateSourceLanguageFromEditor(editor: vscode.TextEditor | undefined) {
        if (!editor) return;

        const langId = editor.document.languageId;
        // Capitalize for display (e.g., 'python' -> 'Python')
        // We use the languageId directly as requested, just making it look nice.
        const displayLang = langId.charAt(0).toUpperCase() + langId.slice(1);

        const currentTarget = this.getTargetLanguage();
        this.update(displayLang, currentTarget);
    }
}
