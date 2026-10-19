import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Widget from './Widget';
import { isTauri } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import './styles.css';

const widget = isTauri() ? getCurrentWindow().label === 'widget' : new URLSearchParams(location.search).get('widget') === '1';
document.documentElement.dataset.window = widget ? 'widget' : 'main';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode>{widget ? <Widget /> : <App />}</React.StrictMode>);
