import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChatApp } from './components/ChatApp';
import './styles/main.css';

console.log('🎯 React app starting...');

const container = document.getElementById('root');
if (container) {
    console.log('✅ Found root container, rendering React app...');
    const root = createRoot(container);
    root.render(<ChatApp />);
    console.log('🚀 React app rendered!');
} else {
    console.error('❌ Root container not found!');
}
