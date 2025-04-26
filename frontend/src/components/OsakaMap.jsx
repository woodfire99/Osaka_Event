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

  useEffect(() => {
    const groupRoot = document.getElementById('group-name-layer');
    if (!groupRoot) return;
  
    const isStationCode = (text) => /^[A-Z]{1,2}\d{2}$/.test(text || '');
  
    const groups = groupRoot.querySelectorAll('g');
  
    groups.forEach((group) => {
      const tspans = group.querySelectorAll('text tspan');
      let hasVisibleStationCode = false;
  
      tspans.forEach((tspan) => {
        const text = tspan.textContent?.trim();
        if (!text || !isStationCode(text)) return;
  
        const prefix2 = text.slice(0, 2);
        const prefix1 = text.slice(0, 1);
        const textElement = tspan.closest('text');
        const dataLine = textElement?.dataset.line || '';

        const isKTinDataLine = dataLine.includes('KT');

        const match = {
          kh: prefix2 === 'KH',
          hs: prefix2 === 'HS',
          nk: prefix2 === 'NK',
          jr: ['A', 'Q', 'O', 'G', 'R', 'F', 'H'].includes(prefix1)&& !['HS'].includes(prefix2)&&
          !isKTinDataLine,
          metro: ['M', 'T', 'N', 'K', 'C', 'S', 'I', 'Y', 'P'].includes(prefix1) && !['KH', 'HS', 'NK'].includes(prefix2),
          kt: ['A', 'F'].includes(prefix1)&&isKTinDataLine || prefix1 === 'D',
          hk: prefix2 === 'HK',
        };
        
  
        const isVisible = Object.entries(match).some(
          ([key, matched]) => matched && visibleLines[key]
        );
  
        if (isVisible) {
          hasVisibleStationCode = true;
          const parentText = tspan.closest('text');
          if (parentText) parentText.style.display = 'inline';
        } else {
          const parentText = tspan.closest('text');
          if (parentText) parentText.style.display = 'none';
        }
      });
  
      // 여기!! 역 이름 text와 path, rect 처리
      group.querySelectorAll('text, path, rect, circle').forEach((el) => {
        const tspan = el.querySelector('tspan');
        const isCode = tspan && isStationCode(tspan.textContent?.trim());
  
        if (!isCode) {
          // 역 이름 text나 path, rect는 해당 그룹 안에 표시할 코드가 있을 때만 표시
          el.style.display = hasVisibleStationCode ? 'inline' : 'none';
        }
      });
    });
  }, [visibleLines]);
  
  return (
    <div className="flex h-screen w-full">
      {/* SVG 영역 */}
      <div className={`transition-all duration-300 ${isOpen ? "w-[75%]" : "w-full"} bg-gray-100 overflow-auto`}>
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

          {/* 먼저 노선(Line)만 */}
          {visibleLines.jr && <JrLine className="absolute top-0 left-0" />}
          {visibleLines.metro && <MetroLine className="absolute top-0 left-0" />}
          {visibleLines.kt && <KtLine className="absolute top-0 left-0" />}
          {visibleLines.kh && <KhLine className="absolute top-0 left-0" />}
          {visibleLines.hs && <HsLine className="absolute top-0 left-0" />}
          {visibleLines.hk && <HkLine className="absolute top-0 left-0" />}
          {visibleLines.nk && <NkLine className="absolute top-0 left-0" />}

          {/* 마지막에 이름(Name)만 */}
          {visibleLines.jr && <JrName className="absolute top-0 left-0" />}
          {visibleLines.metro && <MetroName className="absolute top-0 left-0" />}
          {visibleLines.kt && <KtName className="absolute top-0 left-0" />}
          {visibleLines.kh && <KhName className="absolute top-0 left-0" />}
          {visibleLines.hs && <HsName className="absolute top-0 left-0" />}
          {visibleLines.hk && <HkName className="absolute top-0 left-0" />}
          {visibleLines.nk && <NkName className="absolute top-0 left-0" />}

          {/* 환승역 그룹 (GroupName)는 항상 맨 위 */}
          <GroupName className="absolute top-0 left-0" />
        </div>
      </div>

      {/* 사이드바 */}
      <div className={`transition-all duration-300 ${isOpen ? "w-[25%]" : "w-0"} bg-white shadow-lg overflow-hidden`}>
        <div className="p-4 space-y-2">
          <button onClick={() => setIsOpen(false)} className="text-sm text-blue-500 underline">
            닫기
          </button>

          {/* 토글 버튼 */}
          <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "jr", label: "JR선" },
              { key: "metro", label: "오사카메트로" },
              { key: "kt", label: "킨테츠선" },
              { key: "kh", label: "케이한선" },
              { key: "hs", label: "한신선" },
              { key: "hk", label: "한큐선" },
              { key: "nk", label: "난카이선" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleLine(key)}
                className={`px-3 py-1 rounded ${
                  visibleLines[key] ? "bg-blue-600 text-white" : "bg-gray-200 text-black"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

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
