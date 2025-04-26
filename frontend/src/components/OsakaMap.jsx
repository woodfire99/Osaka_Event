import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import stationsCsv from '../data/osaka_station_names.csv'; // 경로 주의
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
  const [stations, setStations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchedTexts, setMatchedTexts] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
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

  // CSV
  useEffect(() => {
    fetch(stationsCsv)
      .then(res => res.text())
      .then(text => {
        const result = Papa.parse(text, { header: true });
        setStations(result.data);
      });
  }, []);
  

  // 🔥 검색 버튼 클릭했을 때 동작하는 함수
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setMatchedTexts([]);
      return;
    }
    const lower = searchTerm.toLowerCase();
    const matched = stations.filter(station =>
      station.Japanese?.includes(searchTerm) ||
      station.English?.toLowerCase().includes(lower) ||
      station.Korean?.includes(searchTerm)
    );
    setMatchedTexts(matched);
  };
  
  
  // 🔥 리스트에서 선택했을 때 동작하는 함수
  const handleSelect = (textEl) => {
    const parentG = textEl.closest('g');
    if (!parentG) return;

    const allTexts = parentG.querySelectorAll('text');
    const names = Array.from(allTexts)
      .map(t => t.querySelector('tspan')?.textContent.trim() ?? '')
      .filter(Boolean);
    console.log(names);
    setSelectedStation({
      name: names.join(' / '),
    });
  };

  const toggleLine = (key) => {
    setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 노선선택
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
        <div className="p-4 space-y-2">

          {/* 🔥 검색창 + 버튼 */}
          <div className="p-4 space-y-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="역 이름(일본어/영어/한국어) 입력"
              className="border border-gray-300 rounded px-2 py-1 w-full"
            />
            <button
              onClick={handleSearch}
              className="w-full bg-blue-500 text-white py-1 rounded hover:bg-blue-600"
            >
              검색
            </button>
          </div>

          {/* 🔥 검색 결과 리스트 */}
          {matchedTexts.length > 0 && (
          <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
            {matchedTexts.map((station, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedStation(station)}
                className="cursor-pointer hover:bg-blue-100 p-1 rounded"
              >
                {station.Japanese} / {station.English} / {station.Korean}
              </div>
            ))}
          </div>
        )}


          {/* 🔥 지역 정보 */}
          <h2 className="text-lg font-bold pt-4">지역 정보</h2>
          {selectedStation ? (
            <div className="mb-4 space-y-2">
              <p><strong>일본어:</strong> {selectedStation.Japanese}</p>
              <p><strong>영어:</strong> {selectedStation.English}</p>
              <p><strong>한국어:</strong> {selectedStation.Korean}</p>
              <p><strong>Station 코드:</strong> {selectedStation.Station}</p>
            </div>
          ) : (
            <p>검색하여 역을 선택해주세요.</p>
          )}
         </div>   
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
