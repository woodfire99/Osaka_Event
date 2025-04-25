import React, { useEffect, useState } from 'react';
import {
  Basemap,
  Legend,
  JrLine, JrName,
  MetroLine, MetroName,
  KtLine, KtName,
  KhLine, KhName,
  HsLine, HsName,
  HkLine, HkName,
  NkLine, NkName,
  GroupName,
} from './svg';

// import './OsakaMap.css'; // 스타일 분리 (선택사항)
  // useEffect(() => {
   //   fetch("http://localhost:8000/api/events/")
   //     .then(res => res.json())
   //     .then(data => setEvents(data));
   // }, []);
//    <div>
//    <h2>이벤트 목록</h2>
//    {events.map(event => (
//      <div key={event.id} style={{ marginBottom: '2rem' }}>
//        <h3>{event.title}</h3>
//        <img src={event.image} alt={event.title} style={{ width: '300px' }} />
//        <p><strong>날짜:</strong> {event.date}</p>
//        <p><strong>장소:</strong> {event.location}</p>
//        <p>{event.content}</p>
//        <a href={event.url} target="_blank" rel="noreferrer">자세히 보기</a>
//      </div>
//    ))}
//  </div>


const OsakaMap = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [visibleLines, setVisibleLines] = useState({
    jr: false,
    metro: false,
    kt: false,
    kh: false,
    hs: false,
    hk: false,
    nk: false,
  });
  const toggleLine = (key) => {
    setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex h-screen w-full">
      {/* SVG 영역 */}
      <div className={`transition-all duration-300 ${isOpen ? "w-[60%]" : "w-full"} bg-gray-100 overflow-auto`}>
        <div
          style={{
            position: 'relative',
            transform: 'scale(0.4)',
            transformOrigin: 'top left',
            width: 'fit-content',
          }}
        >
          <Basemap className="absolute top-0 left-0" />
          <Legend className="absolute top-0 left-0" />
          

          {visibleLines.jr && (
            <>
              <JrLine className="absolute top-0 left-0" />
              <JrName className="absolute top-0 left-0" />
            </>
          )}
          {visibleLines.metro && (
            <>
              <MetroLine className="absolute top-0 left-0" />
              <MetroName className="absolute top-0 left-0" />
            </>
          )}
          {visibleLines.kt && (
            <>
              <KtLine className="absolute top-0 left-0" />
              <KtName className="absolute top-0 left-0" />
            </>
          )}
          {visibleLines.kh && (
            <>
              <KhLine className="absolute top-0 left-0" />
              <KhName className="absolute top-0 left-0" />
            </>
          )}
          {visibleLines.hs && (
            <>
              <HsLine className="absolute top-0 left-0" />
              <HsName className="absolute top-0 left-0" />
            </>
          )}
          {visibleLines.hk && (
            <>
              <HkLine className="absolute top-0 left-0" />
              <HkName className="absolute top-0 left-0" />
            </>
          )}
          {visibleLines.nk && (
            <>
              <NkLine className="absolute top-0 left-0" />
              <NkName className="absolute top-0 left-0" />
            </>
          )}
          <GroupName className="absolute top-0 left-0" />
        </div>
      </div>

      {/* 사이드바 */}
      <div className={`transition-all duration-300 ${isOpen ? "w-[40%]" : "w-0"} bg-white shadow-lg overflow-hidden`}>
        <div className="p-4 space-y-2">
          <button onClick={() => setIsOpen(false)} className="text-sm text-blue-500 underline">
            닫기
          </button>

          {/* 토글 버튼 */}
          {[
            { key: "jr", label: "JR" },
            { key: "metro", label: "Metro" },
            { key: "kt", label: "KT" },
            { key: "kh", label: "KH" },
            { key: "hs", label: "HS" },
            { key: "hk", label: "HK" },
            { key: "nk", label: "NK" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => toggleLine(key)}
              className={`px-3 py-1 rounded block ${
                visibleLines[key] ? "bg-blue-600 text-white" : "bg-gray-200 text-black"
              }`}
            >
              {label} 보기 {visibleLines[key] ? "숨기기" : "보이기"}
            </button>
          ))}

          <h2 className="text-lg font-bold pt-4">지역 정보</h2>
          <p>스미요시구는 오사카 남부에 위치한...</p>
        </div>
      </div>

      {/* 열기 버튼 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-blue-500 text-white p-2 rounded-l"
        >
          열기
        </button>
      )}
    </div>
  );
};
export default OsakaMap;
