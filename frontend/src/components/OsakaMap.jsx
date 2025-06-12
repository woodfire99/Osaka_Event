// ⬇️ 1. 라이브러리 import
import React, { useEffect, useState, useRef} from 'react';
import { Bar } from 'react-chartjs-2';
import './OsakaMap.css';  
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


const OsakaMap = ({ selectedFromAi, stationListFromAi }) => {
  const backendHost = process.env.REACT_APP_API_BASE;
  const svgContainerRef = useRef(null);
  const [eventList, setEventList] = useState([]);
  const [facilitiesList, setFacilitiesList] = useState([]);     // 주변 시설 리스트 저장
  const [rentData, setRentData] = useState([]);
  const [selectedStationRentData, setSelectedStationRentData] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [zoom, setZoom] = useState(0.4);  // 기본 0.4배로 시작
  const [serverResponse, setServerResponse] = useState(null);  // 서버 응답 저장할 상태
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

  // 역 - 이벤트 연결
  const fetchEventsByStation = async (stationNameJapanese) => {
    try {
      const fullName = `${stationNameJapanese}駅`;  // 예: なんば駅
      const response = await fetch('http://localhost:8000/api/events-by-station/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ station_name: fullName })
      });
      if (response.ok) {
        const data = await response.json();
        return data.events;
      } else {
        console.error('이벤트 요청 실패');
        return [];
      }
    } catch (err) {
      console.error('에러 발생:', err);
      return [];
    }
  };  

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
  
  
  // 월세 CSV
  useEffect(() => {
    fetch('http://localhost:8000/api/rents/')
      .then((res) => res.json())
      .then((data) => {
        setRentData(data);
      })
      .catch((err) => {
        console.error('월세 데이터 불러오기 실패:', err);
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
        body: JSON.stringify({ idx: idx })
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log(data);
        setServerResponse(data);  // 서버에서 받은 역 기본 정보 저장
  
        // 🔥 추가: send-idx 끝난 후 facilities 요청
        if (data.japanese) {
          const facilities = await fetchNearbyFacilities(data.japanese);
          const events = await fetchEventsByStation(data.japanese);
          setEventList(events); 
          setFacilitiesList(facilities); // 주변 시설 리스트 저장
        }
      } else {
        console.error('서버 응답 오류');
      }
    } catch (error) {
      console.error('에러 발생:', error);
    }
  };
  
   // 백엔드 연결(주요 시설 데이터)
  const fetchNearbyFacilities = async (stationNameJapanese) => {

    try {
      const response = await fetch('http://localhost:8000/api/facilities/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ station_name: stationNameJapanese }),
      });
  
      if (response.ok) {
        const data = await response.json();
        return data.facilities;  // 시설 리스트 반환
      } else {
        console.error('시설 정보 요청 실패');
        return [];
      }
    } catch (error) {
      console.error('에러 발생:', error);
      return [];
    }
  };
  
  // 처리 코드(AImode -> Mapmode) - 카드
  useEffect(() => {
    if (selectedFromAi) {
      setMatchedTexts([]);  // ✅ 기존 검색 리스트 제거
  
      fetch('http://localhost:8000/api/search-stations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: selectedFromAi })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.length > 0) {
            handleStationFocus(data[0]);  // 자동 클릭
          } else {
            console.warn('해당 이름으로 검색된 역이 없습니다:', selectedFromAi);
          }
        })
        .catch((err) => {
          console.error('AI역 검색 실패:', err);
        });
    }
  }, [selectedFromAi]);
  
 // 처리 코드(AImode -> Mapmode) - 리스트
 useEffect(() => {
  console.log("ww");
  if (stationListFromAi && stationListFromAi.length > 0) {
    setMatchedTexts(stationListFromAi); // 바로 리스트에 뿌리기
  }
}, [stationListFromAi]);


 // 처리 ZOOM SVG
  const handleStationFocus = (station) => {
    setSelectedStation(station);
    sendIdxToServer(station.number);
    setZoom(1.0);
  
    // ✅ 노선 표시
    const stationCodes = (station.station_code || '').split(',').map(code => code.trim());
    const updatedLines = {
      jr: false, metro: false, kt: false, kh: false, hs: false, hk: false, nk: false,
    };
  
    stationCodes.forEach(code => {
      if (code.startsWith('JR-')) updatedLines.jr = true;
      else if (code.startsWith('KT-')) updatedLines.kt = true;
      else {
        const prefix2 = code.slice(0, 2);
        const prefix1 = code.slice(0, 1);
        if (prefix2 === 'KH') updatedLines.kh = true;
        else if (prefix2 === 'NK') updatedLines.nk = true;
        else if (prefix2 === 'HK') updatedLines.hk = true;
        else if (prefix2 === 'HS') updatedLines.hs = true;
        else if (['M', 'S', 'Y', 'C', 'T', 'N', 'I', 'P', 'K'].includes(prefix1)) updatedLines.metro = true;
        else if (prefix1 === 'D') updatedLines.kt = true;
        else if (['Q', 'F', 'O', 'A', 'R', 'G', 'H'].includes(prefix1)) updatedLines.jr = true;
      }
    });
  
    setVisibleLines(updatedLines);
  
    // ✅ SVG 위치 이동
    setTimeout(() => {
      const svgRoot = document.querySelector('svg');
      if (!svgRoot) return;
  
      const targetTspan = Array.from(document.querySelectorAll('tspan')).find(t =>
        t.textContent?.trim() === station.japanese
      );
      const targetText = targetTspan?.closest('text');
  
      if (targetText && svgContainerRef.current) {
        const clientRect = targetText.getBoundingClientRect();
        const containerRect = svgContainerRef.current.getBoundingClientRect();
        const offsetX = clientRect.left - containerRect.left + svgContainerRef.current.scrollLeft;
        const offsetY = clientRect.top - containerRect.top + svgContainerRef.current.scrollTop;
  
        svgContainerRef.current.scrollTo({
          left: offsetX - 750,
          top: offsetY - 400,
          behavior: 'smooth',
        });
      }
    }, 600);
  
    // ✅ 월세 정보
    fetch('http://localhost:8000/api/rent-by-station/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ station: station.japanese })
    })
      .then(res => res.json())
      .then(data => {
        setSelectedStationRentData(data);
      })
      .catch(err => {
        console.error('월세 API 요청 실패:', err);
      });
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
  
    fetch('http://localhost:8000/api/search-stations/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ keyword: searchTerm })
    })
      .then(res => res.json())
      .then(data => {
        setMatchedTexts(data);
      })
      .catch(err => {
        console.error('검색 실패:', err);
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
          jr: ['Q', 'O', 'G', 'R', 'F', 'H'].includes(prefix1)&& !['HS'].includes(prefix2)&&
          !isKTinDataLine,
          metro: ['M', 'T', 'N', 'K', 'C', 'S', 'I', 'Y', 'P'].includes(prefix1) && !['KH', 'HS', 'NK'].includes(prefix2),
          kt: (['A', 'F'].includes(prefix1)&&isKTinDataLine) || prefix1 === 'D',
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
  if (serverResponse && serverResponse.ai_summary) {
    const mainParts = serverResponse.ai_summary.split('[지난 3년 월세 평균]');
    const facilityAndMood = mainParts[0];
  
    const aiSummaryParts = facilityAndMood.split('[주변 주요 시설]');
    moodPart = aiSummaryParts[0]
      ?.replace('[주변 분위기]', '')
      .replace(/\n/g, ' ')
      .trim();
  }

  return (
    <div className="flex h-screen w-full">
      {/* SVG 영역 */}
      <div
        ref={svgContainerRef}
        className="w-[70%] h-full relative bg-gray-100 overflow-auto"
        onWheelCapture={handleWheel}
      >
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

        <div className="p-4 space-y-4">

          {/* 토글 버튼 */}

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
        

          {/*  검색창 + 버튼 */}
          <div className="space-y-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="역 이름(일본어/영어/한국어) 입력"
              className="border border-gray-300 rounded px-2 py-1 w-full"
            />
            <button
              onClick={handleSearch}
              className="w-full bg-blue-500 text-white text-lg font-semibold py-2 rounded-xl shadow-md transition duration-200 ease-in-out hover:bg-blue-600 hover:shadow-lg active:scale-95"
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
                onClick={() => handleStationFocus(station)}
                className="cursor-pointer hover:bg-blue-100 p-1 rounded"
              >
              {station.japanese}/{station.english}/{station.korean}
              </div>
            ))}
          </div>
        )}
            {/* 역정보 데이터 */}
            {selectedStation && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-md text-center">
              <div className="text-xl font-semibold text-gray-800">
                {selectedStation.japanese}
              </div>
              <div className="text-sm text-gray-500">
                {selectedStation.english}
              </div>
              <div className="text-sm text-gray-500 mb-2">
                {selectedStation.korean}
              </div>
              {selectedStation?.station_code && (
                <div className="text-xs flex flex-wrap gap-2 mt-2">
                  {selectedStation.station_code.split(',').map((code, idx) => {
                    const trimmedCode = code.trim();
                    let isKintetsuA = false;
                    let isKintetsuF = false;
                    let isJR = false;
                    let displayCode = trimmedCode;
                    let textColor = "text-white"; // 기본은 흰색

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

                    
                    if (/^N\d{2}$/.test(displayCode)) {
                      textColor = "text-black";
                    }
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
              
              {/* 월세 데이터 */}
              {selectedStationRentData.length > 0 ? (
                <div className="mt-6">
                  <h3 className="text-lg font-bold">[1R / 1K / 1LDK 평균 월세 비교]</h3>

                  {(() => {
                    const grouped = {};
                    selectedStationRentData.forEach((r) => {
                      const type = r.room_type;
                      const price = r.rent_price;
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
                              backgroundColor: [
                                'rgba(255, 159, 64, 0.6)',    // 주황 (1R)
                                'rgba(54, 162, 235, 0.6)',    // 파랑 (1K)
                                'rgba(255, 99, 132, 0.6)'     // 핑크 (1LDK)
                              ],                              
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

              {/* 현재 이벤트 정보 */}
              {eventList.length > 0 && (
                <div className="p-4 mt-6 border-t">
                  <h3 className="text-lg font-bold">[예정된 이벤트]</h3>
                  <ul className="space-y-4">
                    {eventList.map((event, idx) => (
                      <li key={idx} className="border-b pb-2">
                        <a href={event.url} target="_blank" rel="noreferrer" className="text-blue-600 font-semibold hover:underline">
                          {event.title}
                        </a>
                        <p className="text-sm text-gray-500">{event.date} | {event.location}</p>
                        {event.image && (
                          <img src={event.image} alt={event.title} className="mt-2 rounded-xl w-full max-w-md" />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* 지역 분위기 */}
              {moodPart && (
                <>
                  <h3 className="text-lg font-bold mt-4">[주변 분위기]</h3>
                  <p className="leading-relaxed whitespace-pre-wrap">{moodPart}</p>
                </>
              )}
              <div>
                    <h3 className="text-lg font-bold mt-6">[주변 주요시설]</h3>
                    <ul className="list-none space-y-10">
                    {facilitiesList.slice(0, 5).map((place, idx) => (
                      <li key={idx} className="border-b pb-6">
                        <div className="font-bold text-lg mb-2">
                          {idx + 1}.{" "}
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('大阪 ' + place.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {place.name}
                          </a>
                        </div>

                        {/* 이미지 바로 표시 */}
                        {place.photo_url ? (
                          <img
                            src={`${backendHost}${place.photo_url}`} 
                            alt={`${place.name} 사진`}
                            className="rounded-2xl shadow-md w-full max-w-md h-auto object-cover"
                          />
                        ) : (
                          <div className="text-gray-400 text-sm">이미지 없음</div>
                        )}


                        {/* 평점 표시 */}
                        <div className="flex items-center mt-2">
                          {place.rating ? (
                            <>
                              {Array.from({ length: 5 }).map((_, i) => (
                                <svg
                                  key={i}
                                  xmlns="http://www.w3.org/2000/svg"
                                  className={`h-5 w-5 ${i < Math.round(place.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.18 3.64a1 1 0 00.95.69h3.826c.969 0 1.371 1.24.588 1.81l-3.1 2.252a1 1 0 00-.364 1.118l1.18 3.64c.3.921-.755 1.688-1.54 1.118l-3.1-2.252a1 1 0 00-1.175 0l-3.1 2.252c-.784.57-1.838-.197-1.539-1.118l1.18-3.64a1 1 0 00-.364-1.118l-3.1-2.252c-.783-.57-.38-1.81.588-1.81h3.826a1 1 0 00.95-.69l1.18-3.64z" />
                                </svg>
                              ))}
                              <span className="text-gray-500 text-sm ml-2">({place.rating})</span>
                            </>
                          ) : (
                            <span className="text-gray-400">평점 정보 없음</span>
                          )}
                        </div>
                      </li>
                    ))}
              </ul>
              </div>

            </div>
          )}
        </div>   
      </div>
    </div>
  );
};
export default OsakaMap;