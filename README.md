# 🗾 Osaka_Event(2025.04 ~ 2025.04) - 현재 AWS화 진행중

<br/>

## 🎥 프로젝트 영상 보기

| Map Mode | AI Mode |
|----------|---------|
| [![Map Mode](https://github.com/user-attachments/assets/bfa4250e-5e7d-41ca-96c2-6590ca7d8920)](https://www.youtube.com/watch?v=G9FsQ2JF76w)<br>[영상 보러가기](https://www.youtube.com/watch?v=G9FsQ2JF76w) | [![AI Mode](https://github.com/user-attachments/assets/e0174ba9-b1f4-4ed0-bd89-42d353452cb7)](https://youtu.be/-IkcyRilcVI)<br>[영상 보러가기](https://youtu.be/-IkcyRilcVI) |


---
<br/>

## 프로젝트 설명
Osaka_Event는 오사카 지역의 지하철역 기반 생활 정보와 지역 이벤트를 시각적으로 탐색할 수 있는 웹 애플리케이션입니다.  
사용자는 두 가지 모드를 사용할 수 있습니다.  
첫번째 모드인 Map Mode를 통해서는 역 주변 정보, 추천, 월세 시세 등을 직관적으로 확인할 수 있습니다.  
두번째 모드인 AI Mode를 통해서는 사용자가 원하는 조건의 집이 많은 역들을 추천해줍니다.  

<br/>

## 🏗️ 구조 설명

![구조도_1](https://github.com/user-attachments/assets/86482f44-62e7-4951-bd75-9092cde13385)

<br/>

### 🗺️ Map Mode

- **오사카 지하철 노선도**  
  SVG + Inkscape를 활용해 직접 제작한 시각화 기반 지도를 만들었습니다.

- **월세 데이터**  
  [SUUMO](https://suumo.jp/)에서 수동 스크래핑하여 구축했습니다.

- **현재 진행 중인 이벤트**  
  [Japan Travel](https://www.japan.travel/) 웹사이트를 웹 스크래핑하여 이벤트 정보를 수집하였습니다.

- **역 주변 분위기 요약**  
  OpenAI의 ChatGPT API를 통해 각 역의 주변 분위기를 자동으로 요약하여 저장하여 사용하였습니다.

- **주변 주요 시설 및 이미지**  
  Google Places API를 사용해 관광지, 편의시설, 사진 등의 정보를 시각화합니다.

---

### 🤖 AI Mode

- **역별 분위기 및 특징 요약**  
  오사카시의 193개 전 역에 대해 ChatGPT API를 사용해 개별 요약 데이터를 생성하고 DB에 저장하였습니다.

- **월세 상한 필터링 기능**  
  [SUUMO](https://suumo.jp/)에서 스크래핑한 임대료 데이터를 기반으로 사용자의 예산 조건에 맞는 역을 필터링합니다.

- **번화가 조건 필터링**  
  [Yahoo Japan](https://transit.yahoo.co.jp/search/result?from=難波&to=梅田)(예시 사이트) 등의 상업 데이터 기반 웹사이트를 크롤링하여 역 주변 상권 밀집도 데이터를 구축했습니다.  
  외부 API가 없어 자체 DB화하여 활용하였습니다.




