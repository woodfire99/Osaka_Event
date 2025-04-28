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

const OsakaMap = () => {
  
  const [zoom, setZoom] = useState(0.4);  // 기본 0.4배로 시작
  const [serverResponse, setServerResponse] = useState(null);  // 서버 응답 저장할 상태
  const [stations, setStations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchedTexts, setMatchedTexts] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [visibleLines, setVisibleLines] = useState({
    jr: false,
    metro: false,
    kt: false,
    kh: false,
    hs: false,
    hk: false,
    nk: false,
  });


  // 버튼 색깔
  const lineColors = {
    metro: "border-[#3399FF]",   // 파랑
    jr: "border-[#FF6600]",      // 오렌지
    kt: "border-[#00CC66]",      // 연두 (킨테츠)
    nk: "border-[#006633]",      // 짙은 초록 (난카이)
    hs: "border-[#FFCC00]",      // 노랑 (한신)
    kh: "border-[#003366]",      // 짙은 파랑 (케이한)
    hk: "border-[#996633]",      // 갈색 (한큐)
  };


// 백엔드 연결
const sendIdxToServer = async (idx) => {
  try {
    const response = await fetch('http://localhost:8000/api/send-idx/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idx: idx })  // 반드시 객체로 포장해서 보내야 해!!
    });

    if (response.ok) {
      const data = await response.json();
      setServerResponse(data); 
    } else {
      console.error('서버 응답 오류');
    }
  } catch (error) {
    console.error('에러 발생:', error);
  }
};
  
// 휠 고정
  useEffect(() => {
    const handleGlobalWheel = (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };
  
    window.addEventListener('wheel', handleGlobalWheel, { passive: false });
  
    return () => {
      window.removeEventListener('wheel', handleGlobalWheel);
    };
  }, []);
  
  // CSV
  useEffect(() => {
    fetch(stationsCsv)
      .then(res => res.text())
      .then(text => {
        const result = Papa.parse(text, { header: true });
        setStations(result.data);
      });
  }, []);
  
  // 휠
  const handleWheel = (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;  // 휠 내리면 축소, 올리면 확대
    setZoom((prevZoom) => {
      let newZoom = prevZoom + delta;
      newZoom = Math.max(0.2, Math.min(2, newZoom)); // 최소 0.2배, 최대 2배 제한
      return newZoom;
    });
  };

  //  검색 버튼 클릭했을 때 동작하는 함수
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

  let moodPart = "";
let facilitiesPart = "";
let facilitiesList = [];
let rentInfo = "";

if (serverResponse && serverResponse.ai_summary) {
  const mainParts = serverResponse.ai_summary.split('[지난 3년 월세 평균]');
  const facilityAndMood = mainParts[0];
  rentInfo = mainParts[1]?.trim() || "";
  const aiSummaryParts = facilityAndMood.split('[주변 주요 시설]');
  moodPart = aiSummaryParts[0]
  ?.replace('[주변 분위기]', '')
  .replace(/\n/g, ' ')
  .trim();
  facilitiesPart = aiSummaryParts[1]?.trim();

  if (facilitiesPart) {
    facilitiesList = facilitiesPart
      .split('\n')
      .map(line => line.trim())
      .filter(line => line);
  }
}

  

  return (
    <div className="flex h-screen w-full">
      {/* SVG 영역 */}
      <div className="w-[70%] bg-gray-100 overflow-auto"onWheelCapture={handleWheel}>
        <div
          style={{
            position: 'relative',
            transform: `scale(${zoom})`,
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
      <div className="w-[30%] bg-white shadow-lg overflow-y-auto">
        <div className="p-4 space-y-2">

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
                className={`px-3 py-1 rounded border-2 ${
                  visibleLines[key]
                    ? `${lineColors[key]} bg-opacity-20 bg-white text-black`
                    : "border-gray-300 bg-gray-200 text-black"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 space-y-2">

          {/*  검색창 + 버튼 */}
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

          {/*  검색 결과 리스트 */}
          {matchedTexts.length > 0 && (
          <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
            {matchedTexts.map((station, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setSelectedStation(station);
                  sendIdxToServer(station.Number);
                }}
                className="cursor-pointer hover:bg-blue-100 p-1 rounded"
              >
                {station.Japanese} / {station.English} / {station.Korean}
              </div>
            ))}
          </div>
        )}
          
            {/*  지역 정보 */}
            {serverResponse && (
            <div className="p-4 border rounded-lg shadow-md bg-white space-y-4">
              <h2 className="text-xl font-bold">지역 설명</h2>

              {moodPart && (
                <>
                  <h3 className="text-lg font-bold mt-4">주변 분위기</h3>
                  <p className="leading-relaxed whitespace-pre-wrap">{moodPart}</p>
                </>
              )}

              {facilitiesList.length > 0 && (
                <>
                  <h3 className="text-lg font-bold mt-6">주변 주요 시설</h3>
                  <ul className="list-none space-y-4 leading-relaxed text-gray-800">
                    {facilitiesList.map((item, idx) => {
                      const [name, ...descParts] = item.split(' - ');
                      const description = descParts.join(' - ').trim(); // 이름 외 나머지를 다시 합치기
                      return (
                        <li key={idx}>
                          <strong>{name}</strong><br />
                          {description}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              {rentInfo && (
                <>
                  <h3 className="text-lg font-bold mt-6">지난 3년 월세 평균</h3>
                  <p className="leading-relaxed whitespace-pre-wrap">{rentInfo}</p>
                </>
              )}

            </div>
          )}
         </div>   
        </div>
      </div>
    </div>
  );
};
export default OsakaMap;
