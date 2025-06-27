import React, { useState, useEffect, useRef } from 'react';
import { Message, AttachedFile, VSCodeAPI } from '../types';
import { MessageComponent } from './Message';
import { ChatInput } from './ChatInput';

declare global {
    function acquireVsCodeApi(): VSCodeAPI;
}

export const ChatApp: React.FC = () => {
    console.log('🎨 ChatApp component rendering...');
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const vscodeRef = useRef<VSCodeAPI | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        console.log('📡 ChatApp useEffect running...');
        // Initialize VS Code API
        vscodeRef.current = acquireVsCodeApi();
        console.log('✅ VS Code API acquired:', vscodeRef.current);

        // Add a welcome message
        const welcomeMessage: Message = {
            id: 'welcome',
            content: `# Welcome to AI Chat Assistant! 🤖

I'm here to help you with your code development. You can:

- Ask questions about programming concepts
- Get help with debugging code  
- Request code examples and explanations
- Attach files using @filename mentions (when a workspace is open)

Try asking me something like "How do I create a React component?" or "Explain async/await in JavaScript"`,
            type: 'ai',
            timestamp: new Date()
        };
        
        setMessages([welcomeMessage]);

        // Listen for messages from the extension
        const messageListener = (event: MessageEvent) => {
            const message = event.data;
            console.log('📨 ChatApp received message:', message);
            
            switch (message.type) {
                case 'addMessage':
                    console.log('➕ Adding message:', message.data);
                    setMessages(prev => [...prev, message.data]);
                    setIsLoading(false);
                    break;
                case 'setFiles':
                    // Update available files for @ mentions
                    break;
                case 'error':
                    console.error('❌ Error from extension:', message.data);
                    const errorMessage: Message = {
                        id: Date.now().toString(),
                        content: `❌ **Error:** ${message.data}`,
                        type: 'ai',
                        timestamp: new Date()
                    };
                    setMessages(prev => [...prev, errorMessage]);
                    setIsLoading(false);
                    break;
                case 'workspaceFiles':
                    console.log('📁 Workspace files received:', message.data);
                    // Handle workspace files if needed
                    break;
                case 'ready':
                    console.log('🎉 Extension ready signal received');
                    break;
            }
        };

        window.addEventListener('message', messageListener);
        return () => window.removeEventListener('message', messageListener);
    }, []);

    useEffect(() => {
        // Auto-scroll to bottom when new messages arrive
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = (content: string, files: AttachedFile[]) => {
        // Add user message immediately
        const userMessage: Message = {
            id: Date.now().toString(),
            content,
            type: 'user',
            timestamp: new Date(),
            attachedFiles: files
        };

        setMessages(prev => [...prev, userMessage]);
        setAttachedFiles([]);
        setIsLoading(true);

        // Send message to extension
        vscodeRef.current?.postMessage({
            type: 'sendMessage',
            data: {
                content,
                attachedFiles: files
            }
        });
    };

    const handleFileAttach = (file: AttachedFile) => {
        setAttachedFiles(prev => [...prev, file]);
    };

    const handleFileRemove = (filename: string) => {
        setAttachedFiles(prev => prev.filter(f => f.name !== filename));
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <h1 className="chat-title">AI Chat Assistant</h1>
            </div>
            
            <div className="chat-messages">
                {messages.map(message => (
                    <MessageComponent key={message.id} message={message} />
                ))}
                {isLoading && (
                    <div className="message ai">
                        <div className="message-avatar">AI</div>
                        <div className="message-content">
                            <div className="loading">
                                <div className="loading-spinner"></div>
                                Thinking...
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <ChatInput
                onSendMessage={handleSendMessage}
                attachedFiles={attachedFiles}
                onFileAttach={handleFileAttach}
                onFileRemove={handleFileRemove}
                disabled={isLoading}
            />
        </div>
    );
};
