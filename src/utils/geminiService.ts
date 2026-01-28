import * as vscode from 'vscode';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export interface PackageSuggestion {
    name: string;
    description: string;
    snippet: string;
    docsLink: string;
}

export class GeminiService {
    private context: vscode.ExtensionContext;
    private cache: Map<string, PackageSuggestion[]> = new Map();
    private static readonly API_KEY_SECRET = 'gemini.apiKey';

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    async setApiKey(key: string): Promise<void> {
        await this.context.secrets.store(GeminiService.API_KEY_SECRET, key);
        console.log('PackagePal: API Key stored.');
    }

    async getApiKey(): Promise<string | undefined> {
        return await this.context.secrets.get(GeminiService.API_KEY_SECRET);
    }

    async getSuggestion(packageName: string, targetLanguage: string, sourceLanguage: string): Promise<PackageSuggestion[]> {
        const cacheKey = `${packageName}->${sourceLanguage}->${targetLanguage}`;
        if (this.cache.has(cacheKey)) {
            console.log(`PackagePal: Cache hit for ${cacheKey}`);
            return this.cache.get(cacheKey)!;
        }

        const apiKey = await this.getApiKey();
        if (!apiKey) {
            console.warn('PackagePal: No API Key found.');
            await this.promptForApiKey();
            // Try one more time after prompt, or just fail and let user retry
            const newKey = await this.getApiKey();
            if (!newKey) return [];
        }

        // Re-read key in case it was just set
        const finalKey = (await this.getApiKey())!;

        try {
            const genAI = new GoogleGenerativeAI(finalKey);
            // Using gemini-3-flash-preview as it's the stable model.
            const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

            const prompt = `
            You are an expert developer helping to migrate code.
            Find the TOP 3 best equivalent packages/libraries for "${packageName}" (which is a package in Source Language: "${sourceLanguage}") in the Target Language: "${targetLanguage}".
            
            Return ONLY a raw JSON array (no markdown, no code blocks) containing 3 objects with the following structure:
            [
                {
                    "name": "package_name_in_target_language",
                    "description": "A very brief 1-sentence description.",
                    "snippet": "A tiny code snippet showing import and basic usage.",
                    "docsLink": "URL to the official documentation or repository."
                },
                ...
            ]
            `;

            console.log(`PackagePal: Querying Gemini for ${packageName}...`);
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean up potentially md-formatted JSON
            const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const suggestions = JSON.parse(jsonStr) as PackageSuggestion[];

            // Ensure it's an array
            const finalSuggestions = Array.isArray(suggestions) ? suggestions : [suggestions];

            this.cache.set(cacheKey, finalSuggestions);
            return finalSuggestions;
        } catch (error) {
            console.error('PackagePal: API Error', error);
            vscode.window.showErrorMessage(`Gemini API Error: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }

    private async promptForApiKey() {
        const key = await vscode.window.showInputBox({
            title: 'Enter Gemini API Key',
            prompt: 'Get one at https://aistudio.google.com/',
            ignoreFocusOut: true,
            password: true
        });

        if (key) {
            await this.setApiKey(key);
            vscode.window.showInformationMessage('Gemini API Key saved successfully.');
        }
    }
}
