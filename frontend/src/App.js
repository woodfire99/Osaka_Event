// src/App.jsx 또는 App.js
import React from 'react';
import OsakaMap from './components/OsakaMap'; // 경로 꼭 확인!
import OsakaStationFinder from './components/OsakaStationFinder';
import { Helmet } from 'react-helmet';

export default function App() {
  return (
    <>
    <Helmet>
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP&display=swap"
        rel="stylesheet"
      />
    </Helmet>
    <div>
      <OsakaStationFinder />
    </div>
    </>
  );
}
