import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { GeminiService } from '../utils/geminiService';
import { StatusBarManager } from '../ui/statusBar';

export class PackageSidebarProvider implements vscode.TreeDataProvider<PackageItem | DetailItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<PackageItem | DetailItem | undefined | null | void> = new vscode.EventEmitter<PackageItem | DetailItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<PackageItem | DetailItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private packages: string[] = [];

    constructor(
        private geminiService: GeminiService,
        private statusBar: StatusBarManager
    ) { }

    refresh(): void {
        this.scanActiveFile();
        this._onDidChangeTreeData.fire();
    }

    scanActiveFile() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            this.packages = [];
            return;
        }

        const doc = editor.document;
        const text = doc.getText();
        this.packages = [];

        // Check if package.json
        if (path.basename(doc.fileName) === 'package.json') {
            try {
                const json = JSON.parse(text);
                const deps = { ...json.dependencies, ...json.devDependencies };
                this.packages = Object.keys(deps);
            } catch (e) {
                console.error('Error parsing package.json', e);
            }
        } else {
            // Regex scan
            const importRegex = /from\s+['"]([^'"]+)['"]/g;
            const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
            let match;
            while ((match = importRegex.exec(text)) !== null) {
                this.packages.push(match[1]);
            }
            while ((match = requireRegex.exec(text)) !== null) {
                this.packages.push(match[1]);
            }
            // Dedup
            this.packages = [...new Set(this.packages)];
        }
    }

    getTreeItem(element: PackageItem | DetailItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: PackageItem | DetailItem): Promise<(PackageItem | DetailItem)[]> {
        if (!element) {
            // Root: packages
            if (this.packages.length === 0) {
                const item = new vscode.TreeItem("No packages found in active file");
                return [item as any];
            }
            return this.packages.map(pkg => new PackageItem(pkg, vscode.TreeItemCollapsibleState.Collapsed));
        } else if (element instanceof PackageItem) {
            // Children: details from Gemini
            const targetLang = this.statusBar.getTargetLanguage();
            const sourceLang = this.statusBar.getSourceLanguage();
            const suggestions = await this.geminiService.getSuggestion(element.packageName, targetLang, sourceLang);

            if (!suggestions || suggestions.length === 0) {
                return [new DetailItem("No suggestions found", vscode.TreeItemCollapsibleState.None)];
            }

            const items: DetailItem[] = [];

            suggestions.forEach((suggestion, index) => {
                const prefix = suggestions.length > 1 ? `#${index + 1} ` : '';
                items.push(new DetailItem(`${prefix}Target: ${suggestion.name}`, vscode.TreeItemCollapsibleState.None, 'rocket'));
                items.push(new DetailItem(`Desc: ${suggestion.description}`, vscode.TreeItemCollapsibleState.None, 'info'));
                if (suggestion.docsLink) {
                    const docsItem = new DetailItem(`Link: Documentation`, vscode.TreeItemCollapsibleState.None, 'link');
                    docsItem.command = {
                        command: 'vscode.open',
                        title: 'Open Documentation',
                        arguments: [vscode.Uri.parse(suggestion.docsLink)]
                    };
                    items.push(docsItem);
                }
                items.push(new DetailItem(`Snippet: (Hover to view)`, vscode.TreeItemCollapsibleState.None, 'code', suggestion.snippet));
                // Add separator if multiple suggestions
                if (index < suggestions.length - 1) {
                    items.push(new DetailItem(`---`, vscode.TreeItemCollapsibleState.None));
                }
            });

            return items;
        }
        return [];
    }
}

class PackageItem extends vscode.TreeItem {
    constructor(
        public readonly packageName: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(packageName, collapsibleState);
        this.tooltip = `Check migration for ${packageName}`;
        this.description = 'Source Package';
        this.iconPath = new vscode.ThemeIcon('package');
    }
}

class DetailItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        iconName?: string,
        snippet?: string
    ) {
        super(label, collapsibleState);
        if (iconName) this.iconPath = new vscode.ThemeIcon(iconName);
        if (snippet) this.tooltip = snippet;
    }
}
