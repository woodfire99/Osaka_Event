// src/App.jsx 또는 App.js
import React from 'react';
import OsakaMap from './components/OsakaMap'; // 경로 꼭 확인!

export default function App() {
  return (
    <div>
      <h1>오사카 시 지도</h1>
      <OsakaMap />
    </div>
  );
}
