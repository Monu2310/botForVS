import React, { useState, useRef, useEffect } from 'react';
import { AttachedFile, WorkspaceFile, VSCodeAPI } from '../types';

interface ChatInputProps {
    onSendMessage: (content: string, files: AttachedFile[]) => void;
    attachedFiles: AttachedFile[];
    onFileAttach: (file: AttachedFile) => void;
    onFileRemove: (filename: string) => void;
    disabled: boolean;
}

declare global {
    function acquireVsCodeApi(): VSCodeAPI;
}

export const ChatInput: React.FC<ChatInputProps> = ({
    onSendMessage,
    attachedFiles,
    onFileAttach,
    onFileRemove,
    disabled
}) => {
    const [input, setInput] = useState('');
    const [showFileSuggestions, setShowFileSuggestions] = useState(false);
    const [fileSuggestions, setFileSuggestions] = useState<WorkspaceFile[]>([]);
    const [currentMention, setCurrentMention] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const vscodeRef = useRef<VSCodeAPI | null>(null);

    useEffect(() => {
        vscodeRef.current = acquireVsCodeApi();
        
        // Request initial file list
        vscodeRef.current?.postMessage({
            type: 'getWorkspaceFiles'
        });

        // Listen for file suggestions from extension
        const messageListener = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'workspaceFiles') {
                setFileSuggestions(message.data);
            }
        };

        window.addEventListener('message', messageListener);
        return () => window.removeEventListener('message', messageListener);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        const position = e.target.selectionStart;
        setInput(value);
        setCursorPosition(position);

        // Check for @ mentions
        const beforeCursor = value.substring(0, position);
        const atIndex = beforeCursor.lastIndexOf('@');
        
        if (atIndex !== -1 && atIndex === beforeCursor.length - 1) {
            // Just typed @
            setCurrentMention('');
            setShowFileSuggestions(true);
        } else if (atIndex !== -1) {
            const afterAt = beforeCursor.substring(atIndex + 1);
            if (/^[a-zA-Z0-9._-]*$/.test(afterAt)) {
                // Valid filename characters
                setCurrentMention(afterAt);
                setShowFileSuggestions(true);
            } else {
                setShowFileSuggestions(false);
            }
        } else {
            setShowFileSuggestions(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        } else if (e.key === 'Escape') {
            setShowFileSuggestions(false);
        }
    };

    const handleSend = () => {
        if (input.trim() && !disabled) {
            onSendMessage(input.trim(), attachedFiles);
            setInput('');
        }
    };

    const handleFileSuggestionClick = (file: WorkspaceFile) => {
        // Replace @mention with selected file
        const beforeCursor = input.substring(0, cursorPosition);
        const atIndex = beforeCursor.lastIndexOf('@');
        const beforeAt = input.substring(0, atIndex);
        const afterCursor = input.substring(cursorPosition);
        
        setInput(beforeAt + `@${file.name} ` + afterCursor);
        setShowFileSuggestions(false);
        
        // Add file to attachments
        onFileAttach({
            name: file.name,
            path: file.path,
            type: file.name.match(/\.(jpg|jpeg|png|gif|bmp|svg)$/i) ? 'image' : 'text'
        });

        // Focus back to textarea
        setTimeout(() => textareaRef.current?.focus(), 0);
    };

    const filteredSuggestions = fileSuggestions.filter(file => 
        file.name.toLowerCase().includes(currentMention.toLowerCase())
    ).slice(0, 10);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [input]);

    return (
        <div className="chat-input-container">
            {attachedFiles.length > 0 && (
                <div className="attached-files">
                    {attachedFiles.map(file => (
                        <div key={file.name} className="attached-file">
                            📎 {file.name}
                            <button
                                className="remove-file"
                                onClick={() => onFileRemove(file.name)}
                                title="Remove file"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="chat-input-wrapper">
                {showFileSuggestions && filteredSuggestions.length > 0 && (
                    <div className="file-suggestions">
                        {filteredSuggestions.map(file => (
                            <div
                                key={file.path}
                                className="file-suggestion"
                                onClick={() => handleFileSuggestionClick(file)}
                            >
                                {file.type === 'file' ? '📄' : '📁'} {file.relativePath}
                            </div>
                        ))}
                    </div>
                )}
                
                <textarea
                    ref={textareaRef}
                    className="chat-input"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message... Use @filename to attach files"
                    disabled={disabled}
                    rows={1}
                />
                
                <button
                    className="send-button"
                    onClick={handleSend}
                    disabled={disabled || !input.trim()}
                >
                    Send
                </button>
            </div>
        </div>
    );
};
