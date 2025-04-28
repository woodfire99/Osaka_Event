// ⬇️ 1. 라이브러리 import
import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// ⬇️ 2. 내부 파일 import
import rentDataCsv from '../data/rent_data.csv';
import stationsCsv from '../data/osaka_station_names.csv'; // 경로 주의
import {
  Basemap,
  Legend as SvgLegend,
  JrLine, JrName,
  MetroLine, MetroName,
  KtLine, KtName,
  KhLine, KhName,
  HsLine, HsName,
  HkLine, HkName,
  NkLine, NkName,
  GroupName,
} from './svg';

// ⬇️ 3. ChartJS 설정 (이건 import랑 별개. 함수 호출이니까 그 다음에 위치)
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);


const OsakaMap = () => {
  const [rentData, setRentData] = useState([]);
  const [selectedStationRentData, setSelectedStationRentData] = useState([]);
  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const [openedFacilityName, setOpenedFacilityName] = useState(null);
  const [facilityDetailData, setFacilityDetailData] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [zoom, setZoom] = useState(0.4);  // 기본 0.4배로 시작
  const [serverResponse, setServerResponse] = useState(null);  // 서버 응답 저장할 상태
  const [stations, setStations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchedTexts, setMatchedTexts] = useState([]);
  const [visibleLines, setVisibleLines] = useState({
    jr: false,
    metro: false,
    kt: false,
    kh: false,
    hs: false,
    hk: false,
    nk: false,
  });
  const [facilityClickEnabled, setFacilityClickEnabled] = useState(false); // 시설 클릭 메소드 활성화 선택

  // 버튼 색깔(크게 나눠서)
  const lineColors = {
    metro: "border-[#3399FF]",   // 파랑
    jr: "border-[#FF6600]",      // 오렌지
    kt: "border-[#00CC66]",      // 연두 (킨테츠)
    nk: "border-[#006633]",      // 짙은 초록 (난카이)
    hs: "border-[#FFCC00]",      // 노랑 (한신)
    kh: "border-[#003366]",      // 짙은 파랑 (케이한)
    hk: "border-[#996633]",      // 갈색 (한큐)
  };

  // 라인 색깔
  const lineColorByCode = {
    M: "ff0000ff",   // 미도스지선 (빨강)
    T: "7f007fff",   // 타니마치선 (보라)
    Y: "0000ffff",   // 요츠바시선 (파랑)
    C: "008000ff",   // 츄오선 (초록)
    S: "ff00ffff",   // 센니치마에선 (핑크)
    K: "7f0000ff",   // 사카이스지선 (갈색)
    N: "7fff00ff",   // 나가호리선 (연두)
    I: "ff7f00ff",   // 이마자토스지선 (오렌지)
    P: "007fffff",   // 뉴트램 (하늘색)
  
    O: "d86060ff",   // 오사카 순환선 (초록)
    H: "ec2c8cff",   // 토자이선 (보라)
    R: "f59e0bff",   // 한와선 (오렌지)
    G: "facc15ff",   // 후쿠치야마선 (남색)
    Q: "00a86bff",   // 야마토지선 (초록)
    F: "2f6f97ff",   // 오사카히가시선 (남색)
    A: "0076c0ff",   // 교토선/고베선 (파랑)
  
    NK: "0e7c3aff",  // 난카이선 (짙은 초록)
    KH: "00008bff",  // 케이한선 (짙은 파랑)
    HS: "ffff00ff",  // 한신선 (노랑)
    HK: "b72036ff",  // 한큐선 (갈색)
    D: "0072bcff",   // 킨테츠 오사카선 (파랑)
  };
  

  // getLineName 함수 (OsakaMap 밖)
  const getLineName = (stationCode) => {
    if (!stationCode) return "";
  
    // KT- 계열은 킨테츠
    if (stationCode.startsWith('KT-F') || stationCode.startsWith('KT-A')) {
      const realCode = stationCode.replace('KT-', '');
      return `${realCode}(Kintetsu)`;
    }
  
    // JR-P 계열은 JR
    if (stationCode.startsWith('JR-P')) {
      return `${stationCode.slice(3)}(JR)`;
    }
  
    const displayCode = stationCode
      .replace('KT-', '')
      .replace('JR-', '');
  
    const prefix2 = displayCode.slice(0, 2); // 2글자
    const prefix1 = displayCode.slice(0, 1); // 1글자
  
    // 2글자 우선 매칭
    if (['KH', 'NK', 'HK', 'HS'].includes(prefix2)) {
      return `${displayCode}`;
    }
  
    // Metro 계열
    if (['M', 'T', 'Y', 'C', 'S', 'N', 'I', 'P'].includes(prefix1)) {
      return `${displayCode}(Metro)`;
    }
  
    // JR 계열
    if (['O', 'Q', 'R', 'A', 'G', 'F', 'H'].includes(prefix1)) {
      return `${displayCode}(JR)`;
    }
  
    return displayCode; // 매칭 안 되면 그냥 코드만
  };
  

  // 역코드 나누기
  const getLineType = (stationCode) => {
    if (!stationCode) return "";

    if (stationCode.startsWith('KT-F') || stationCode.startsWith('KT-A')) {
      return 'kt'; // Kintetsu
    }
    if (stationCode.startsWith('JR-P')) {
      return 'jr';
    }
    if (
      stationCode.startsWith('M') || stationCode.startsWith('T') || stationCode.startsWith('N') ||
      stationCode.startsWith('K') || stationCode.startsWith('C') || stationCode.startsWith('S') ||
      (stationCode.startsWith('P') && !stationCode.startsWith('JR-P')) ||
      stationCode.startsWith('I') || stationCode.startsWith('Y')
    ) {
      return 'metro';
    }
    if (
      stationCode.startsWith('O') || stationCode.startsWith('Q') || stationCode.startsWith('R') ||
      stationCode.startsWith('A') || stationCode.startsWith('G') || stationCode.startsWith('F') ||
      stationCode.startsWith('H')
    ) {
      return 'jr';
    }
    if (stationCode.startsWith('KH')) {
      return 'kh';
    }
    if (stationCode.startsWith('HS')) {
      return 'hs';
    }
    if (stationCode.startsWith('HK')) {
      return 'hk';
    }
    if (stationCode.startsWith('NK')) {
      return 'nk';
    }
    return '';
  };
  

  // 백엔드 연결(주요 시설 데이터)
  const fetchFacilityInfo = async (facilityName) => {
    try {
      const response = await fetch('http://localhost:8000/api/fetch-facility-info/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ facility_name: facilityName })
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('서버에서 받은 시설 데이터:', data);
        return data;
      } else {
        console.error('서버 응답 오류');
        return null;
      }
    } catch (error) {
      console.error('에러 발생:', error);
      return null;
    }
  };

  // 주요시설 클릭시
  const handleFacilityClick = async (facilityName) => {
    const facilityData = await fetchFacilityInfo(facilityName);
    if (facilityData) {
      setSelectedFacility(facilityData);
    }
  };
  
  // 월세 CSV
  useEffect(() => {
    fetch(rentDataCsv)
      .then(res => res.text())
      .then(text => {
        const result = Papa.parse(text, { header: true });
        setRentData(result.data);
      });
  }, []);
  
  // 백엔드 연결(리스트 선택)
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
        .split('\n')                 // 일단 줄마다 쪼개고
        .map(line => line.trim())     // 앞뒤 공백 제거
        .filter(line => line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.') || line.startsWith('5.') || line.startsWith('6.') || line.startsWith('7.') || line.startsWith('8.') || line.startsWith('9.'))
        // 🔥 번호로 시작하는 진짜 리스트만 남김
        .filter(line => line.includes('**')); 
        // 🔥 그리고 **(별표)가 포함된 것만 => 설명글은 걸러짐
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
          <SvgLegend className="absolute top-0 left-0" />

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
                  // rent 데이터 매칭
                  const matchedRents = rentData.filter(
                    (item) => item.station === station.Japanese
                  );
                  setSelectedStationRentData(matchedRents);
                }}
                className="cursor-pointer hover:bg-blue-100 p-1 rounded"
              >
              {station.Japanese}/{station.English}/{station.Korean}
              </div>
            ))}
          </div>
        )}
            {selectedStation && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-md text-center">
              <div className="text-xl font-semibold text-gray-800">
                {selectedStation.Japanese}
              </div>
              <div className="text-sm text-gray-500">
                {selectedStation.English}
              </div>
              <div className="text-sm text-gray-500 mb-2">
                {selectedStation.Korean}
              </div>
              {selectedStation?.Station && (
                <div className="text-xs flex flex-wrap gap-2 mt-2">
                  {selectedStation.Station.split(',').map((code, idx) => {
                    const trimmedCode = code.trim();

                    let isKintetsuA = false;
                    let isKintetsuF = false;
                    let isJR = false;
                    let displayCode = trimmedCode;

                    if (trimmedCode.startsWith('KT-A')) {
                      isKintetsuA = true;
                      displayCode = trimmedCode.replace('KT-', '');
                    } else if (trimmedCode.startsWith('KT-F')) {
                      isKintetsuF = true;
                      displayCode = trimmedCode.replace('KT-', '');
                    } else if (trimmedCode.startsWith('JR-')) {
                      isJR = true;
                      displayCode = trimmedCode.replace('JR-', '');
                    }

                    const prefix2 = displayCode.slice(0, 2);
                    const prefix1 = displayCode.slice(0, 1);

                    let codeKey = "";
                    if (["NK", "KH", "HS", "HK"].includes(prefix2)) {
                      codeKey = prefix2;
                    } else {
                      codeKey = prefix1;
                    }

                    let color = "ccccccff"; // 기본 회색

                    if (isKintetsuA) {
                      color = "d1003fff"; // 킨테츠 나라선용 색 (파랑 느낌)
                    } else if (isKintetsuF) {
                      color = "0d8737ff"; // 킨테츠 오사카선용 색 (연두)
                    } else if (isJR && codeKey === 'P') {
                      color = "121b4cff"; // JR-P 오렌지
                    } else {
                      color = lineColorByCode[codeKey] || "ccccccff";
                    }

                    let textColor = "text-white"; // 기본은 흰색

                    if (codeKey === 'HS') {
                      textColor = "text-black"; // 한신선(HS)은 검정 글자
                    }

                    return (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${textColor}`}
                        style={{ backgroundColor: `#${color}` }}
                      >
                        {getLineName(trimmedCode)}
                      </span>
                    );
                  })}
                </div>
              )}




            </div>
            
            )}
            {/*  지역 정보 */}
            {serverResponse && (
            <div className="p-4 border rounded-lg shadow-md bg-white space-y-4">
              <h2 className="text-xl font-bold">지역 설명</h2>
              {selectedStationRentData.length > 0 ? (
                <div className="mt-6">
                  <h3 className="text-lg font-bold">1R / 1K 월세 비교</h3>

                  {(() => {
                    const grouped = {};
                    selectedStationRentData.forEach((r) => {
                      const type = r.room_type;
                      const price = parseFloat(r.rent_price.replace('万円', ''));
                      if (!grouped[type]) {
                        grouped[type] = [];
                      }
                      grouped[type].push(price);
                    });

                    const averaged = Object.entries(grouped).map(([type, prices]) => {
                      const sum = prices.reduce((acc, curr) => acc + curr, 0);
                      const avg = sum / prices.length;
                      return { room_type: type, average: avg };
                    });

                    return (
                      <Bar
                        data={{
                          labels: averaged.map(item => item.room_type),
                          datasets: [
                            {
                              label: '월세 (만엔)',
                              data: averaged.map(item => item.average),
                              backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(153, 102, 255, 0.6)'],
                            },
                          ],
                        }}
                      />
                    );
                  })()}
                </div>
              ) : (
                <div className="mt-6">
                  <h3 className="text-lg font-bold">1R / 1K 월세 비교</h3>
                  <p className="text-center text-gray-500 mt-4">월세 데이터 없음</p> 
                </div>
              )}



              {moodPart && (
                <>
                  <h3 className="text-lg font-bold mt-4">주변 분위기</h3>
                  <p className="leading-relaxed whitespace-pre-wrap">{moodPart}</p>
                </>
              )}
              <div>
              <h3 className="text-lg font-bold mt-6">[주변 주요 시설]</h3>
                <ul className="list-none space-y-6">
                  {facilitiesList.map((item, idx) => {
                    const [name, ...descParts] = item.split(' - ');
                    const description = descParts.join(' - ').trim();
                    const cleanName = name.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').trim(); // 🔥 여기가 중요
                    const facilityData = (facilityDetailData && openedFacilityName === cleanName) ? facilityDetailData : null;

                    return (
                      <li key={idx} className="border-b pb-4">
                        <div
                          className="cursor-pointer hover:underline"
                          onClick={async () => {
                            if (!facilityClickEnabled) return;  // 🔥 클릭 막기
                            setOpenedFacilityName(cleanName);
                            const facilityData = await fetchFacilityInfo(cleanName);
                            if (facilityData) {
                              setFacilityDetailData(facilityData);
                            }
                          }}
                        >
                          <div className="font-bold">{idx + 1}. {cleanName}</div>

                          {/* 지도, 평점, 주소 */}
                          {facilityData && (
                            <div className="mt-2 space-y-2">
                              {facilityData.photo_reference && (
                                <img
                                  src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${facilityData.photo_reference}&key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}`}
                                  alt={`${facilityData.name} 사진`}
                                  className="rounded shadow"
                                />
                              )}
                              <p><strong>평점:</strong> {facilityData.rating}</p>
                              <p><strong>주소:</strong> {facilityData.address}</p>
                            </div>
                          )}
                        </div>

                        {/* 설명 */}
                        <div className="text-gray-600 mt-2 pl-1">{description}</div>
                      </li>
                    );
                  })}
                </ul>
              </div>


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
