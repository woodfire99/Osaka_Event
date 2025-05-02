import React, { useState } from 'react';
import OsakaMap from './OsakaMap';
import AiMode from './AiMode.jsx'; // ✅ OK

const OsakaStationFinder = () => {
  const [viewMode, setViewMode] = useState('map');
  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedFromAi, setSelectedFromAi] = useState(null);
  const [stationListFromAi, setStationListFromAi] = useState([]);


  return (
<div className="relative h-screen">
  {/* 상단 바 - 로고 + 버튼 */}
  <div className="fixed top-0 left-0 w-full flex justify-between items-center p-2 z-50 bg-white shadow-sm h-[3rem]">
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
  <div className="w-full min-h-[calc(100vh-3rem)] pt-[3rem] relative">
    {/* 항상 렌더링, 보이는 것만 토글 */}
    <div className={viewMode === 'map' ? 'block' : 'hidden'}>  
    <OsakaMap 
    selectedStation={selectedStation} 
    selectedFromAi={selectedFromAi} 
    stationListFromAi={stationListFromAi}
    />
    </div>
    <div className={viewMode === 'ai' ? 'block' : 'hidden'}>
    <AiMode
      onStationSelect={(station) => {
        console.log(station);
        setSelectedFromAi(station);
        setViewMode('map');
      }}
      onStationListSend={(list) => {
        setStationListFromAi(list); // 리스트 저장
        setViewMode('map');         // 맵으로 전환
      }}
    />

    </div>
  </div>

</div>


  );
};

export default OsakaStationFinder;
