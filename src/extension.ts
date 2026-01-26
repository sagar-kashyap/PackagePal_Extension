import * as vscode from 'vscode';
import { GeminiService } from './utils/geminiService';
import { StatusBarManager } from './ui/statusBar';
import { PackageHoverProvider } from './providers/hoverProvider';
import { PackageSidebarProvider } from './providers/sidebarProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "package-migration-assistant" is now active!');

    // Initialize Services
    const geminiService = new GeminiService(context);
    const statusBar = new StatusBarManager(context);

    // Initialize Providers
    const sidebarProvider = new PackageSidebarProvider(geminiService, statusBar);

    // Register Output Channel
    const outputChannel = vscode.window.createOutputChannel('Package Migrator');
    context.subscriptions.push(outputChannel);

    // Register Commands
    const setTargetLangCmd = vscode.commands.registerCommand('extension.setTargetLanguage', () => {
        statusBar.selectTargetLanguage();
    });

    const setSourceLangCmd = vscode.commands.registerCommand('extension.setSourceLanguage', () => {
        statusBar.selectSourceLanguage();
    });

    const setApiKeyCmd = vscode.commands.registerCommand('extension.setApiKey', async () => {
        const key = await vscode.window.showInputBox({
            title: 'Enter Gemini API Key',
            prompt: 'Get one at https://aistudio.google.com/',
            ignoreFocusOut: true,
            password: true,
            placeHolder: 'Paste your API Key here'
        });

        if (key) {
            await geminiService.setApiKey(key);
            vscode.window.showInformationMessage('Gemini API Key saved successfully.');
        }
    });

    const scanFileCmd = vscode.commands.registerCommand('extension.scanFile', () => {
        sidebarProvider.refresh();
        vscode.window.showInformationMessage('Scanned active file for packages.');
    });

    // Register Providers
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            [{ scheme: 'file', language: 'javascript' }, { scheme: 'file', language: 'typescript' }, { scheme: 'file', pattern: '**/package.json' }],
            new PackageHoverProvider(geminiService, statusBar)
        )
    );

    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('package-migrator.sidebar', sidebarProvider)
    );

    context.subscriptions.push(setTargetLangCmd, setSourceLangCmd, setApiKeyCmd, scanFileCmd);

    // Listen on file switch to auto-refresh sidebar and update source language
    vscode.window.onDidChangeActiveTextEditor((editor) => {
        sidebarProvider.refresh();
        statusBar.updateSourceLanguageFromEditor(editor);
    });

    // Initial check
    if (vscode.window.activeTextEditor) {
        statusBar.updateSourceLanguageFromEditor(vscode.window.activeTextEditor);
    }
}

export function deactivate() { }
