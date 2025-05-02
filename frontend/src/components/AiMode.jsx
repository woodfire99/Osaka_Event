import React, { useState } from 'react';

const AiMode = () => {
  // 🔧 상태 정의
  const [mood, setMood] = useState('');
  const [roomSize, setRoomSize] = useState('');
  const [rentLimit, setRentLimit] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [routes, setRoutes] = useState([]); 
  const [results, setResults] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [sortOption, setSortOption] = useState('default');
  const HUB_LABEL_MAP = {
    '難波': '난바(難波)',
    '梅田': '우메다(梅田)',
    '天王寺': '덴노지(天王寺)',
    '京橋': '쿄바시(京橋)',
    '本町': '혼마치(本町)',
  };
  
  // 📌 방 크기별 최소 월세 상한 (단위: 만엔)
  const rentMinByRoomSize = {
    '1R': 3,
    '1K': 4,
    '1LDK': 6,
  };

  // 🏷️ 선택 가능한 특징
  const FEATURES = [
    '공원 근처',
    '상점가',
    '마트 근처',
    '치안 좋음',
  ];

  // ✅ 필수 입력 유효성 검사
  const isFormValid =
    mood && selectedFeatures.length > 0 && roomSize && rentLimit !== ''&&
    routes.every(r => r.destination && r.transport && r.distance);

  // 🟦 특징 토글 (최대 2개)
  const toggleFeature = (feature) => {
    if (selectedFeatures.includes(feature)) {
      setSelectedFeatures(selectedFeatures.filter((f) => f !== feature));
    } else if (selectedFeatures.length < 2) {
      setSelectedFeatures([...selectedFeatures, feature]);
    } else {
      alert('특징은 최대 2개까지 선택할 수 있습니다.');
    }
  };

  // ➕ 조건 추가 (최대 3개)
  const handleAddRoute = () => {
    if (routes.length < 3) {
      setRoutes([...routes, { destination: '', transport: '', distance: '' }]);
    } else {
      alert('최대 3개까지 추가 가능합니다.');
    }
  };
  
  // ✅ 제출 버튼 클릭 시 결과 샘플 처리
  const handleSubmit = async () => {
    if (!isFormValid) {
      alert('❗ 필수 항목을 모두 입력해주세요.');
      return;
    }
  
    const payload = {
      mood,
      room_size: roomSize,
      rent_limit: rentLimit,
      features: selectedFeatures,
      routes, // [{ destination, transport, distance }, ...]
    };
  
    try {
      const res = await fetch('http://localhost:8000/api/recommend/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      alert('서버 통신 중 오류가 발생했습니다.');
      console.error(err);
    }
  };
  
  const getSortedResults = () => {
    const sorted = [...results]; // 원본 배열 복사
    switch (sortOption) {
      case 'rent_asc':
        return sorted.sort((a, b) => (a.rent ?? Infinity) - (b.rent ?? Infinity));
      case 'rent_desc':
        return sorted.sort((a, b) => (b.rent ?? 0) - (a.rent ?? 0));
      case 'name':
        return sorted.sort((a, b) => a.korean.localeCompare(b.korean));
      default:
        return sorted;
    }
  };
  
  return (
<div className="flex flex-col md:flex-row w-full h-[calc(100vh-3rem)] gap-6 p-6">
      {/* 🔴 왼쪽: 조건 입력 영역 */}
      <div className="md:w-2/5 w-full flex flex-col gap-4 sticky top-[3rem] self-start">

        <h2 className="text-xl font-semibold">조건을 입력하세요</h2>
        <div className="space-y-4">
          <p className="text-sm text-red-600">※ 아래 항목은 모두 필수입니다</p>

          {/* 분위기 선택 */}
          <div>
            <label className="font-semibold">
              분위기 <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border p-2 rounded mt-1"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
            >
              <option value="">선택하세요</option>
              <option value="조용함">조용함</option>
              <option value="활기참">활기참</option>
              <option value="현지 느낌">현지 느낌</option>
              <option value="신축 위주">신축 위주</option>
              <option value="노포/전통 분위기">노포/전통 분위기</option>
            </select>
          </div>

          {/* 특징 선택 */}
          <div>
            <label className="font-semibold">
              원하는 특징 <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {FEATURES.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFeature(f)}
                  className={`px-3 py-1 rounded-full border text-sm ${
                    selectedFeatures.includes(f)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">※ 최대 2개까지 선택 가능합니다</p>
          </div>

          {/* 방 크기 선택 */}
          <div>
            <label className="font-semibold">
              방 크기 <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border p-2 rounded mt-1"
              value={roomSize}
              onChange={(e) => {
                const value = e.target.value;
                setRoomSize(value);
                setRentLimit(rentMinByRoomSize[value] || '');
              }}
            >
              <option value="">선택</option>
              <option value="1R">1R</option>
              <option value="1K">1K</option>
              <option value="1LDK">1LDK</option>
            </select>
            {roomSize && (
              <p className="text-xs text-gray-500 mt-1">
                ※ {roomSize} 선택 시 월세 상한은 최소 {rentMinByRoomSize[roomSize]}만엔 이상입니다
              </p>
            )}
          </div>

          {/* 월세 상한 슬라이더 */}
          <div>
            <label className="font-semibold">
              월세 상한 <span className="text-red-500">*</span>
            </label>
            <input
              type="range"
              min={roomSize ? rentMinByRoomSize[roomSize] : 2}
              max="20"
              step="1"
              value={Math.max(
                Number(rentLimit || rentMinByRoomSize[roomSize] || 5),
                rentMinByRoomSize[roomSize] || 2
              )}
              onChange={(e) => setRentLimit(e.target.value)}
              disabled={!roomSize}
              className="w-full"
            />
            {rentLimit ? (
              <p className="text-sm text-gray-600">
                선택된 상한: <strong>{rentLimit}만엔 이하</strong>
              </p>
            ) : (
              <p className="text-sm text-red-500">※ 월세 상한을 선택해주세요</p>
            )}
          </div>

          {/* 선택 조건 안내 */}
          <p className="text-sm text-gray-500 pt-2">※ 아래 항목은 선택사항입니다</p>

          {/* 번화가 조건 (최대 3개) */}
          {routes.map((route, index) => (
          <div
            key={`${route.destination}-${index}`}
            className="flex flex-col md:flex-row items-center gap-2 mt-2 p-2 border rounded-md bg-gray-50"
          >
            {/* 목적지 */}
            <select
              className="border p-2 rounded w-full md:w-1/3"
              value={route.destination || ''}
              onChange={(e) => {
                const newRoutes = [...routes];
                newRoutes[index].destination = e.target.value;
                setRoutes(newRoutes);
              }}
            >
              <option disabled value="">목적지 선택</option>
              {[
                  { value: "Umeda", label: "우메다（梅田）" },
                  { value: "Namba", label: "난바（難波）" },
                  { value: "Tennoji", label: "덴노지（天王寺）" },
                  { value: "Kyobashi", label: "쿄바시（京橋）" },
                  { value: "Hommachi", label: "혼마치（本町）" },
                ].map(({ value, label }) => {
                  const isDisabled = routes.some(
                    (r, i) =>
                      i !== index &&
                      r.destination &&
                      r.destination.trim() === value
                  );
                  return (
                    <option key={value} value={value} disabled={isDisabled}>
                      {label}
                    </option>
                  );
                })}


            </select>



            {/* 이동수단 */}
            <select
              className="border p-2 rounded w-full md:w-1/3"
              value={route.transport}
              onChange={(e) => {
                const newRoutes = [...routes];
                newRoutes[index].transport = e.target.value;
                setRoutes(newRoutes);
              }}
            >
              <option disabled value="">이동수단</option>
              <option value="subway">전철</option>
              <option value="bike">자전거</option>
            </select>

            {/* 거리 */}
            <select
              className="border p-2 rounded w-full md:w-1/3"
              value={route.distance}
              onChange={(e) => {
                const newRoutes = [...routes];
                newRoutes[index].distance = e.target.value;
                setRoutes(newRoutes);
              }}
            >
              <option disabled value="">거리</option>
              <option value="10">10분</option>
              <option value="15">15분</option>
              <option value="20">20분</option>
            </select>

            {/* 삭제 버튼 (맨 오른쪽 정렬) */}

            <button
              onClick={() => {
                const newRoutes = routes.filter((_, i) => i !== index);
                setRoutes(newRoutes);
              }}
              className="ml-auto md:ml-1 mt-1 md:mt-0 px-3 py-2 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            >
              삭제
            </button>

          </div>
        ))}

          <button
            className="text-sm text-blue-600 underline mt-2"
            onClick={handleAddRoute}
          >
            + 번화가 조건 추가 (최대 3개)
          </button>
        </div>

        {/* ✅ 제출 버튼 */}
        <button
          disabled={!isFormValid}
          className={`mt-4 px-4 py-2 rounded text-white font-semibold transition ${
            isFormValid
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
          onClick={handleSubmit}
        >
          조건에 맞는 역 찾기
        </button>
      </div>

      {/* ⚪ 세로 구분선 */}
      <div className="hidden md:block w-px bg-gray-300 h-auto" />

      {/* 🔵 오른쪽: 결과 리스트 영역 */}
      <div className="md:w-3/5 w-full flex flex-col gap-4 overflow-y-auto h-full ">
        <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">추천된 역 리스트</h2>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="border p-1.5 rounded text-sm"
        >
          <option value="default">기본 순</option>
          <option value="rent_asc">월세 낮은 순</option>
          <option value="rent_desc">월세 높은 순</option>
          <option value="name">역 이름 가나다순</option>
        </select>
      </div>

        {results.length === 0 ? (
  <p className="text-gray-500">추천 결과가 여기에 표시됩니다.</p>
) : (
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {getSortedResults().map((station, index) => {
    const isExpanded = expandedIndex === index;
    return (
      <div
        key={index}
        className={`cursor-pointer border rounded-xl p-4 shadow bg-white transition-all duration-300 hover:shadow-md ${
          isExpanded ? 'row-span-2' : ''
        }`}
      >
        {/* 역 이름 */}
        <h3 className="font-bold text-lg text-gray-800 mb-2">
          {station.korean}{' '}
          <span className="text-gray-500 text-sm align-middle">{station.station}</span>
        </h3>

        {/* 사진 자리 */}
        {station.photo ? (
            <img
              src={`data:image/jpeg;base64,${station.photo}`}
              alt={`${station.korean} 사진`}
              className="w-full h-40 object-cover rounded mb-3"
            />
          ) : (
            <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 rounded mb-3">
              사진 없음
            </div>
          )}




        {/* ✅ 월세 강조 */}
        <div className="flex items-center text-base text-yellow-700 font-semibold mb-2">
          💰 월세: <span className="ml-1 text-lg">{station.rent?.toLocaleString()}만엔</span>
        </div>

        {/* ✅ 번화가 조건 (교통) 강조 */}
        {Object.entries(station.routes).map(([hub, info]) => (
          <div key={hub} className="flex items-center gap-2">
            <span>{info.mode === 'bike' ? '🚲' : '🚃'}</span>
            <span className="font-medium whitespace-nowrap text-gray-800">
              {HUB_LABEL_MAP[hub] || hub}
            </span>
            <span className="text-gray-600">까지 {info.duration}분</span>
          </div>
        ))}
      </div>
    );
  })}
</div>


)}




      </div>
    </div>
  );
};

export default AiMode;
