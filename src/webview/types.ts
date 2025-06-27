export interface Message {
    id: string;
    content: string;
    type: 'user' | 'ai';
    timestamp: Date;
    attachedFiles?: AttachedFile[];
}

export interface AttachedFile {
    name: string;
    path: string;
    type: 'text' | 'image';
    content?: string;
    size?: number;
}

export interface VSCodeAPI {
    postMessage(message: any): void;
    setState(state: any): void;
    getState(): any;
}

export interface WorkspaceFile {
    name: string;
    path: string;
    relativePath: string;
    type: 'file' | 'directory';
}

export interface ChatMessage {
    type: 'sendMessage' | 'addMessage' | 'setFiles' | 'error';
    data: any;
}
