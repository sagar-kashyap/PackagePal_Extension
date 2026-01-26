import * as vscode from 'vscode';
import { GeminiService } from '../utils/geminiService';
import { StatusBarManager } from '../ui/statusBar';

export class PackageHoverProvider implements vscode.HoverProvider {
    private geminiService: GeminiService;
    private statusBar: StatusBarManager;

    constructor(geminiService: GeminiService, statusBar: StatusBarManager) {
        this.geminiService = geminiService;
        this.statusBar = statusBar;
    }

    async provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Promise<vscode.Hover | null> {
        const range = document.getWordRangeAtPosition(position);
        if (!range) return null;

        const line = document.lineAt(position).text;
        const packageName = this.extractPackageName(line);

        if (!packageName) return null;

        // Ensure we are hovering over the package name part
        // Simple check: is the cursor roughly near the package name string?
        // For robustness, we could check range intersection, but text regex is okay for now.

        const targetLang = this.statusBar.getTargetLanguage();
        const sourceLang = this.statusBar.getSourceLanguage();
        const suggestions = await this.geminiService.getSuggestion(packageName, targetLang, sourceLang);

        if (!suggestions || suggestions.length === 0) return null;

        const markdown = new vscode.MarkdownString();
        markdown.supportHtml = true;

        suggestions.forEach((suggestion, index) => {
            if (index > 0) markdown.appendMarkdown('---\n\n'); // Separator

            markdown.appendMarkdown(`### 📦 ${suggestion.name} \n`);
            markdown.appendMarkdown(`_(Equivalent in ${targetLang} from ${sourceLang})_\n\n`);
            markdown.appendMarkdown(`${suggestion.description}\n\n`);
            if (suggestion.docsLink) {
                markdown.appendMarkdown(`[📘 Official Documentation](${suggestion.docsLink})\n\n`);
            }
            markdown.appendCodeblock(suggestion.snippet, targetLang.toLowerCase());
        });

        return new vscode.Hover(markdown);
    }

    private extractPackageName(line: string): string | null {
        // Regex for detecting imports
        // 1. import ... from 'package' or "package"
        const importMatch = line.match(/from\s+['"]([^'"]+)['"]/);
        if (importMatch) return importMatch[1];

        // 2. require('package') or require("package")
        const requireMatch = line.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
        if (requireMatch) return requireMatch[1];

        // 3. For Go: import "package/path" (if scanning Go files, but task says source is primarily Node-like, but extendable)
        // User said "identifying packages in the source code (e.g., Node.js 'axios')"

        return null;
    }
}
