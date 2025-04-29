// src/App.jsx 또는 App.js
import React from 'react';
import OsakaMap from './components/OsakaMap'; // 경로 꼭 확인!
import OsakaStationFinder from './components/OsakaStationFinder';

export default function App() {
  return (
    <div>
      <OsakaStationFinder />
    </div>
  );
}
