import React, { useState } from 'react';
import OsakaMap from './OsakaMap';
import AiMode from './AiMode';

const OsakaStationFinder = () => {
  const [viewMode, setViewMode] = useState('map');

  return (
<div className="relative h-screen">
  {/* 상단 버튼 - 화면 위에 겹치게 */}
  <div className="absolute top-0 right-3 flex gap-2 p-2 z-50 shadow-sm">
    <button
      className={`px-4 py-1.5 rounded font-semibold text-sm ${
        viewMode === 'map' ? 'bg-blue-500 text-white' : 'bg-gray-200'
      }`}
      onClick={() => setViewMode('map')}
    >
      🗺️ 맵으로 찾기
    </button>
    <button
      className={`px-4 py-1.5 rounded font-semibold text-sm ${
        viewMode === 'ai' ? 'bg-green-500 text-white' : 'bg-gray-200'
      }`}
      onClick={() => setViewMode('ai')}
    >
      🤖 AI로 찾기
    </button>
  </div>

  {/* 메인 콘텐츠 (map or ai) */}
  <div className="w-full h-full">
    {viewMode === 'map' ? <OsakaMap /> : <AiMode />}
  </div>
</div>

  );
};

export default OsakaStationFinder;
