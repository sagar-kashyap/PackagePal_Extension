"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageHoverProvider = void 0;
const vscode = require("vscode");
class PackageHoverProvider {
    constructor(geminiService, statusBar) {
        this.geminiService = geminiService;
        this.statusBar = statusBar;
    }
    async provideHover(document, position, token) {
        const range = document.getWordRangeAtPosition(position);
        if (!range)
            return null;
        const line = document.lineAt(position).text;
        const packageName = this.extractPackageName(line, document.languageId);
        if (!packageName)
            return null;
        // Ensure we are hovering over the package name part
        // Simple check: is the cursor roughly near the package name string?
        // For robustness, we could check range intersection, but text regex is okay for now.
        const targetLang = this.statusBar.getTargetLanguage();
        const sourceLang = this.statusBar.getSourceLanguage();
        const suggestions = await this.geminiService.getSuggestion(packageName, targetLang, sourceLang);
        if (!suggestions || suggestions.length === 0)
            return null;
        const markdown = new vscode.MarkdownString();
        markdown.supportHtml = true;
        suggestions.forEach((suggestion, index) => {
            if (index > 0)
                markdown.appendMarkdown('---\n\n'); // Separator
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
    extractPackageName(line, langId) {
        let patterns = [];
        switch (langId) {
            case 'python':
                patterns.push(/^(?:from|import)\s+([a-zA-Z0-9_]+)/);
                break;
            case 'go':
                patterns.push(/import\s+(?:[a-zA-Z0-9_]+\s+)?['"]([^'"]+)['"]/);
                patterns.push(/^\s*['"]([^'"]+)['"]/); // inside parens
                break;
            case 'rust':
                patterns.push(/(?:use|extern\s+crate)\s+([a-zA-Z0-9_]+)/);
                break;
            case 'java':
            case 'kotlin':
                patterns.push(/import\s+([a-zA-Z0-9_.]+(?:\.[a-zA-Z0-9_]+)*)/);
                break;
            case 'csharp':
                patterns.push(/using\s+([a-zA-Z0-9_.]+);/);
                break;
            case 'cpp':
                patterns.push(/#include\s+[<"]([^>"]+)[>"]/);
                break;
            case 'ruby':
                patterns.push(/require\s+['"]([^'"]+)['"]/);
                patterns.push(/gem\s+['"]([^'"]+)['"]/);
                break;
            case 'php':
                patterns.push(/use\s+([a-zA-Z0-9_\\]+);/);
                break;
            case 'swift':
                patterns.push(/import\s+([a-zA-Z0-9_]+)/);
                break;
            default:
                // JS/TS
                patterns.push(/from\s+['"]([^'"]+)['"]/);
                patterns.push(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
                break;
        }
        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    }
}
exports.PackageHoverProvider = PackageHoverProvider;
//# sourceMappingURL=hoverProvider.js.map