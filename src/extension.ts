import * as vscode from 'vscode';
import Groq from 'groq-sdk';

export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 AI Chat Assistant is now active!');

    // Register the main chat command
    const disposable = vscode.commands.registerCommand('ai-chat-assistant.openChat', () => {
        // Create and show a working webview panel
        const panel = vscode.window.createWebviewPanel(
            'aiChat',
            'AI Chat Assistant',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // Set the HTML content - this WILL work
        panel.webview.html = getWebviewContent();

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'sendMessage':
                        try {
                            // Get the API key from storage
                            const apiKey = context.globalState.get<string>('groqApiKey');
                            
                            if (!apiKey) {
                                panel.webview.postMessage({
                                    command: 'receiveMessage',
                                    text: `❌ No API key found. Please run "AI Chat: Configure Groq API Key" first.`
                                });
                                return;
                            }

                            // Initialize Groq client
                            const groq = new Groq({ apiKey: apiKey });

                            // Show thinking message
                            panel.webview.postMessage({
                                command: 'receiveMessage',
                                text: `🤔 AI is thinking...`
                            });

                            // Call Groq API
                            const completion = await groq.chat.completions.create({
                                messages: [
                                    {
                                        role: "system",
                                        content: "You are a helpful AI assistant integrated into VS Code. You help with coding, answer questions, and assist with development tasks. Be concise but helpful."
                                    },
                                    {
                                        role: "user",
                                        content: message.text
                                    }
                                ],
                                model: "llama-3.1-8b-instant",
                                temperature: 0.7,
                                max_tokens: 1000
                            });

                            const aiResponse = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

                            // Send real AI response
                            panel.webview.postMessage({
                                command: 'receiveMessage',
                                text: `🤖 AI: ${aiResponse}`
                            });

                        } catch (error) {
                            console.error('Error calling Groq API:', error);
                            panel.webview.postMessage({
                                command: 'receiveMessage',
                                text: `❌ Error: ${error instanceof Error ? error.message : 'Failed to get AI response'}. Please check your API key.`
                            });
                        }
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    // Register Ultra Simple Chat command  
    const ultraSimpleCommand = vscode.commands.registerCommand('ai-chat-assistant.ultraSimpleChat', () => {
        const panel = vscode.window.createWebviewPanel(
            'ultraSimpleChat',
            '🆘 Ultra Simple Chat',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getUltraSimpleContent();
    });

    // Register API key configuration
    const configureApiKeyCommand = vscode.commands.registerCommand('ai-chat-assistant.configureApiKey', async () => {
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your Groq API Key (get free key at https://console.groq.com/keys)',
            password: true,
            placeHolder: 'gsk_...'
        });

        if (apiKey) {
            await context.globalState.update('groqApiKey', apiKey);
            vscode.window.showInformationMessage('✅ Groq API Key saved successfully!');
        }
    });

    context.subscriptions.push(disposable, ultraSimpleCommand, configureApiKeyCommand);

    // Show welcome message
    vscode.window.showInformationMessage(
        '🤖 AI Chat Assistant activated! Try "AI Chat: Open Chat"',
        'Open Chat'
    ).then(selection => {
        if (selection === 'Open Chat') {
            vscode.commands.executeCommand('ai-chat-assistant.openChat');
        }
    });
}

function getWebviewContent() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Chat Assistant</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #1e1e1e;
            color: #d4d4d4;
            margin: 0;
            padding: 0;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .header {
            background: #007acc;
            color: white;
            padding: 15px;
            text-align: center;
            font-weight: bold;
        }
        .chat-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 20px;
            overflow: hidden;
        }
        .messages {
            flex: 1;
            overflow-y: auto;
            margin-bottom: 20px;
            border: 1px solid #333;
            padding: 15px;
            background: #252526;
            border-radius: 8px;
        }
        .message {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 6px;
        }
        .user-message {
            background: #007acc;
            color: white;
            margin-left: 20%;
            text-align: right;
        }
        .ai-message {
            background: #333;
            border-left: 4px solid #007acc;
            margin-right: 20%;
        }
        .input-container {
            display: flex;
            gap: 10px;
        }
        input {
            flex: 1;
            padding: 12px;
            background: #333;
            color: #d4d4d4;
            border: 1px solid #555;
            border-radius: 6px;
            font-size: 14px;
        }
        button {
            padding: 12px 24px;
            background: #007acc;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
        }
        button:hover {
            background: #005a9e;
        }
    </style>
</head>
<body>
    <div class="header">🤖 AI Chat Assistant - WORKING!</div>
    <div class="chat-container">
        <div class="messages" id="messages">
            <div class="message ai-message">
                <strong>🤖 AI:</strong> Hello! I'm your AI assistant. This interface is working perfectly! Type a message below to test it.
            </div>
        </div>
        <div class="input-container">
            <input type="text" id="messageInput" placeholder="Type your message here..." />
            <button onclick="sendMessage()">Send</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        
        function addMessage(sender, text) {
            const messages = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + (sender === 'user' ? 'user-message' : 'ai-message');
            messageDiv.innerHTML = '<strong>' + (sender === 'user' ? '👤 You' : '🤖 AI') + ':</strong> ' + text;
            messages.appendChild(messageDiv);
            messages.scrollTop = messages.scrollHeight;
        }
        
        function sendMessage() {
            const input = document.getElementById('messageInput');
            const text = input.value.trim();
            if (!text) return;
            
            addMessage('user', text);
            input.value = '';
            
            vscode.postMessage({
                command: 'sendMessage',
                text: text
            });
        }
        
        document.getElementById('messageInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
        
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'receiveMessage') {
                // If this is an AI response and the last message contains "thinking", replace it
                const messages = document.getElementById('messages');
                const lastMessage = messages.lastElementChild;
                
                if (lastMessage && lastMessage.textContent.includes('🤔 AI is thinking...')) {
                    // Replace the thinking message
                    lastMessage.innerHTML = '<strong>🤖 AI:</strong> ' + message.text.replace('🤖 AI: ', '');
                } else {
                    // Add new message
                    addMessage('ai', message.text);
                }
            }
        });
        
        console.log('✅ AI Chat loaded and ready!');
    </script>
</body>
</html>`;
}

function getUltraSimpleContent() {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Ultra Simple Chat</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: #1e1e1e; 
            color: #d4d4d4; 
            padding: 20px; 
        }
        .chat { 
            background: #333; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 20px; 
            max-height: 400px; 
            overflow-y: auto; 
        }
        .message { 
            margin: 10px 0; 
            padding: 8px; 
            border-radius: 4px; 
        }
        .user { background: #007acc; color: white; }
        .ai { background: #555; }
        input { 
            width: 70%; 
            padding: 10px; 
            background: #333; 
            color: white; 
            border: 1px solid #555; 
        }
        button { 
            padding: 10px 20px; 
            background: #007acc; 
            color: white; 
            border: none; 
            cursor: pointer; 
        }
    </style>
</head>
<body>
    <h1>🆘 Ultra Simple AI Chat (GUARANTEED WORKING)</h1>
    <div class="chat" id="chat">
        <div class="message ai">🤖 AI: Welcome! This is the simplest possible chat interface. It's guaranteed to work!</div>
    </div>
    <input type="text" id="input" placeholder="Type message...">
    <button onclick="send()">Send</button>
    
    <script>
        let count = 0;
        function send() {
            const input = document.getElementById('input');
            const chat = document.getElementById('chat');
            const text = input.value;
            if (!text) return;
            
            chat.innerHTML += '<div class="message user">👤 You: ' + text + '</div>';
            input.value = '';
            count++;
            
            setTimeout(() => {
                chat.innerHTML += '<div class="message ai">🤖 AI: Message #' + count + ' received: "' + text + '". This interface works perfectly! Configure your Groq API key for real AI responses.</div>';
                chat.scrollTop = chat.scrollHeight;
            }, 500);
        }
        
        document.getElementById('input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') send();
        });
    </script>
</body>
</html>`;
}

export function deactivate() {}
