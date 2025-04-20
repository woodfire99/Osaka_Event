import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App'; // 이게 App.js 불러오고 있는지 확인!

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
