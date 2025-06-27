import Groq from 'groq-sdk';

export interface AttachedFile {
    name: string;
    path: string;
    type: 'text' | 'image';
    content?: string;
}

export interface ChatContext {
    workspaceFiles: string[];
    currentFile?: string;
    selectedCode?: string;
    language?: string;
}

export type AIModel = 
    | 'llama-3.1-70b-versatile'
    | 'llama-3.1-8b-instant'
    | 'mixtral-8x7b-32768'
    | 'gemma-7b-it';

export interface AIModelInfo {
    id: AIModel;
    name: string;
    provider: 'groq';
    description: string;
    requiresApiKey: boolean;
}

export const AVAILABLE_MODELS: AIModelInfo[] = [
    {
        id: 'llama-3.1-70b-versatile',
        name: 'Llama 3.1 70B',
        provider: 'groq',
        description: 'Meta - Powerful, versatile model for complex tasks',
        requiresApiKey: true
    },
    {
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B Instant',
        provider: 'groq',
        description: 'Meta - Fast, efficient model for quick responses',
        requiresApiKey: true
    },
    {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B',
        provider: 'groq',
        description: 'Mistral AI - Excellent for coding and technical tasks',
        requiresApiKey: true
    },
    {
        id: 'gemma-7b-it',
        name: 'Gemma 7B IT',
        provider: 'groq',
        description: 'Google - Optimized for instruction following',
        requiresApiKey: true
    }
];

export class AIService {
    private groq: Groq | null = null;
    private currentModel: AIModel = 'llama-3.1-8b-instant';

    constructor(apiKey?: string) {
        if (apiKey) {
            this.groq = new Groq({
                apiKey: apiKey
            });
        }
    }

    setApiKey(apiKey: string) {
        this.groq = new Groq({
            apiKey: apiKey
        });
    }

    setModel(model: AIModel) {
        this.currentModel = model;
    }

    getCurrentModel(): AIModel {
        return this.currentModel;
    }

    getModelInfo(model: AIModel): AIModelInfo | undefined {
        return AVAILABLE_MODELS.find(m => m.id === model);
    }

    async generateResponse(
        userMessage: string,
        attachedFiles: AttachedFile[],
        context: ChatContext,
        conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
    ): Promise<string> {
        if (!this.groq) {
            throw new Error('Groq API key not configured. Please set your Groq API key first.');
        }

        // Build system prompt with context
        const systemPrompt = this.buildSystemPrompt(context, attachedFiles);
        
        // Build messages array
        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
            { role: 'system', content: systemPrompt }
        ];

        // Add conversation history (keep last 8 messages to manage context length)
        const recentHistory = conversationHistory.slice(-8);
        messages.push(...recentHistory);

        // Add current user message with file contents
        let currentMessage = userMessage;
        if (attachedFiles.length > 0) {
            currentMessage += '\n\n--- Attached Files ---\n';
            for (const file of attachedFiles) {
                if (file.content) {
                    currentMessage += `\n**${file.name}:**\n\`\`\`\n${file.content}\n\`\`\`\n`;
                }
            }
        }

        messages.push({ role: 'user', content: currentMessage });

        try {
            const completion = await this.groq.chat.completions.create({
                model: this.currentModel,
                messages: messages,
                max_tokens: 1000,
                temperature: 0.7,
            });

            return completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
        } catch (error: any) {
            console.error('Groq API error:', error);
            
            if (error?.status === 404) {
                throw new Error('AI service error: Model not found or no access.');
            } else if (error?.status === 401) {
                throw new Error('AI service error: Invalid API key. Please check your Groq API key.');
            } else if (error?.status === 429) {
                throw new Error('AI service error: Rate limit exceeded. Please wait a moment before trying again.');
            } else if (error?.status === 400) {
                throw new Error('AI service error: Bad request. The message might be too long.');
            } else if (error?.status === 500) {
                throw new Error('AI service error: Groq server error. Please try again in a moment.');
            } else {
                throw new Error(`AI service error: ${error?.message || 'Unknown error'}`);
            }
        }
    }

    private buildSystemPrompt(context: ChatContext, attachedFiles: AttachedFile[]): string {
        let prompt = `You are an AI coding assistant integrated into VS Code via Groq API. You help developers with:

1. **Code Generation**: Creating new code based on requirements
2. **Code Analysis**: Explaining and reviewing existing code
3. **Debugging**: Helping identify and fix issues
4. **Refactoring**: Improving code structure and efficiency
5. **Documentation**: Writing comments and documentation

## Current Context:
`;

        if (context.currentFile) {
            prompt += `- Currently viewing: ${context.currentFile}\n`;
        }

        if (context.language) {
            prompt += `- Programming language: ${context.language}\n`;
        }

        if (context.selectedCode) {
            prompt += `- Selected code snippet:\n\`\`\`\n${context.selectedCode}\n\`\`\`\n`;
        }

        if (context.workspaceFiles.length > 0) {
            prompt += `- Workspace files: ${context.workspaceFiles.slice(0, 20).join(', ')}${context.workspaceFiles.length > 20 ? ' and more...' : ''}\n`;
        }

        if (attachedFiles.length > 0) {
            prompt += `\n## Attached Files:
The user has attached ${attachedFiles.length} file(s) for reference. Use this context to provide more accurate assistance.\n`;
        }

        prompt += `
## Guidelines:
- Provide clear, concise, and actionable responses
- Use proper markdown formatting for code blocks
- Specify the programming language in code blocks
- When generating code, follow best practices and conventions
- Explain your reasoning when making suggestions
- Ask clarifying questions if requirements are unclear
- Consider the workspace context when making recommendations

Be helpful, accurate, and focused on practical solutions.`;

        return prompt;
    }
}
