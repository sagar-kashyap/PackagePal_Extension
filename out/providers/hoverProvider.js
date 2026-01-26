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
        const packageName = this.extractPackageName(line);
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
    extractPackageName(line) {
        // Regex for detecting imports
        // 1. import ... from 'package' or "package"
        const importMatch = line.match(/from\s+['"]([^'"]+)['"]/);
        if (importMatch)
            return importMatch[1];
        // 2. require('package') or require("package")
        const requireMatch = line.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
        if (requireMatch)
            return requireMatch[1];
        // 3. For Go: import "package/path" (if scanning Go files, but task says source is primarily Node-like, but extendable)
        // User said "identifying packages in the source code (e.g., Node.js 'axios')"
        return null;
    }
}
exports.PackageHoverProvider = PackageHoverProvider;
//# sourceMappingURL=hoverProvider.js.map