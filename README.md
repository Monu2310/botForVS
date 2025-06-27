# AI Chat Assistant (Groq)

A powerful VS Code extension that integrates a React-based web chat interface with AI assistance for code development. Features contextual awareness from your workspace, file attachments via `@filename` mentions, and intelligent code generation using Groq's fast and free API.

## ✨ Features

### 🤖 AI-Powered Chat Interface

- **React-based WebView**: Clean, modern chat interface built with React
- **Markdown Support**: Properly formatted responses with syntax-highlighted code blocks
- **Real-time Communication**: Seamless interaction between VS Code and the chat interface
- **Fast Groq API**: Powered by Groq's lightning-fast inference for instant responses

### 📎 File Attachment System

- **@mention Integration**: Type `@filename` to attach files from your workspace
- **Smart File Discovery**: Auto-complete suggestions for workspace files
- **Multiple File Types**: Support for text files and image metadata
- **Visual File Tags**: Clear indication of attached files in chat

### 🧠 Contextual Awareness

- **Workspace Context**: AI understands your project structure and files
- **Current File Awareness**: Knows which file you're currently editing
- **Code Selection**: Can work with selected code snippets
- **Language Detection**: Understands the programming languages you're using

### 🛠️ Code Generation & Assistance

- **Code Generation**: Create new code from natural language descriptions
- **Code Analysis**: Explain and review existing code
- **Debugging Help**: Identify and fix issues in your code
- **Refactoring Suggestions**: Improve code structure and efficiency
- **Documentation**: Generate comments and documentation

### Basic Usage

1. **Start a conversation**: Type your question or request in the chat input
2. **Attach files**: Use `@filename` to include specific files for context
3. **Get AI responses**: Receive detailed, context-aware responses with code examples

## 🔧 Configuration

### API Key Setup

The extension requires a free Groq API key to function:

1. Get your free API key from [Groq Console](https://console.groq.com/)
2. Open Command Palette (`Ctrl+Shift+P`)
3. Run "AI Chat: Configure Groq API Key"
4. Enter your API key (stored securely in VS Code's global state)

## 🚀 Why Groq?

- **Free API**: No credit card required, generous free tier
- **Lightning Fast**: Fastest inference speed in the industry
- **Multiple Models**: Access to Llama, Mixtral, and Gemma models
- **Reliable**: High uptime and consistent performance

## 🔄 Commands

| Command                           | Description                       |
| --------------------------------- | --------------------------------- |
| `AI Chat: Open Chat`              | Opens the chat interface panel    |
| `AI Chat: Configure Groq API Key` | Set up your free Groq API key     |
| `AI Chat: Select Groq Model`      | Choose from available Groq models |

---
