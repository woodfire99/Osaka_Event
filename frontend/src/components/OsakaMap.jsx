import React, { useEffect, useState } from 'react';
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

  return (
    <div className="flex h-screen w-full">
      {/* SVG 영역 */}
      <div className={`transition-all duration-300 ${isOpen ? "w-4/5" : "w-full"} bg-gray-100`}>
         <svg viewBox="0 0 300 300" className="w-full h-full">
         <circle cx="150" cy="150" r="100" fill="skyblue" />
         <text x="100" y="160" fontSize="18">여기가 오사카</text>
         </svg>
      </div>

      {/* 사이드바 */}
      <div className={`transition-all duration-300 ${isOpen ? "w-1/5" : "w-0"} bg-white shadow-lg overflow-hidden`}>
        <div className="p-4">
          <button onClick={() => setIsOpen(false)} className="mb-4 text-sm text-blue-500 underline">
            닫기
          </button>
          <h2 className="text-lg font-bold">지역 정보</h2>
          <p>스미요시구는 오사카 남부에 위치한...</p>
        </div>
      </div>

      {/* 열기 버튼 (사이드에 붙이기) */}
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
