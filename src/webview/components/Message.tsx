import React from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { Message } from '../types';

// Configure marked with syntax highlighting
const renderer = new marked.Renderer();
marked.setOptions({
    breaks: true,
    gfm: true
});

// Custom highlight function
const highlightCode = (code: string, lang: string) => {
    if (lang && hljs.getLanguage(lang)) {
        try {
            return hljs.highlight(code, { language: lang }).value;
        } catch (err) {
            console.warn('Syntax highlighting failed:', err);
        }
    }
    return hljs.highlightAuto(code).value;
};

interface MessageProps {
    message: Message;
}

export const MessageComponent: React.FC<MessageProps> = ({ message }) => {
    const formatTime = (timestamp: Date) => {
        return timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    const renderContent = (content: string) => {
        if (message.type === 'ai') {
            // Process markdown manually for code blocks
            let processedContent = content;
            
            // Replace code blocks with highlighted versions
            processedContent = processedContent.replace(
                /```(\w+)?\n([\s\S]*?)```/g,
                (match, lang, code) => {
                    const highlighted = highlightCode(code.trim(), lang || '');
                    return `<pre><code class="hljs">${highlighted}</code></pre>`;
                }
            );
            
            // Process with marked for other markdown
            const html = marked(processedContent);
            return (
                <div 
                    className="message-bubble"
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            );
        } else {
            // Plain text for user messages
            return <div className="message-bubble">{content}</div>;
        }
    };

    return (
        <div className={`message ${message.type}`}>
            <div className="message-avatar">
                {message.type === 'user' ? 'U' : 'AI'}
            </div>
            <div className="message-content">
                {message.attachedFiles && message.attachedFiles.length > 0 && (
                    <div className="attached-files">
                        {message.attachedFiles.map(file => (
                            <div key={file.name} className="attached-file">
                                📎 {file.name}
                            </div>
                        ))}
                    </div>
                )}
                {renderContent(message.content)}
                <div className="message-time">
                    {formatTime(message.timestamp)}
                </div>
            </div>
        </div>
    );
};
