import React, { useState } from 'react';
import OsakaMap from './OsakaMap';
import AiMode from './AiMode';

const OsakaStationFinder = () => {
  const [viewMode, setViewMode] = useState('map');

  return (
<div className="relative h-screen">
  {/* 상단 바 - 로고 + 버튼 */}
  <div className="absolute top-0 left-0 w-full flex justify-between items-center p-2 z-50 bg-white shadow-sm">
    {/* ⬅️ 왼쪽: 로고/제목 */}
    <div className="text-xl font-bold px-3">🏙️Osaka Navi</div>

    {/* ➡️ 오른쪽: 버튼 */}
    <div className="flex gap-2">
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
  </div>

  {/* 메인 콘텐츠 */}
  <div className="w-full h-full pt-[2.8rem]">
    {viewMode === 'map' ? <OsakaMap /> : <AiMode />}
  </div>
</div>


  );
};

export default OsakaStationFinder;
