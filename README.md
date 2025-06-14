# Osaka_Event 
프로젝트 진행일자(Project Period) : 2025/04 ~ 2025/05 
인원(Team Size) : 1人

<br/>



## 프로젝트 소개

**Osaka_Event**는 오사카 지역의 지하철역 기반 생활 정보와 지역 이벤트를 시각적으로 탐색할 수 있는 웹 애플리케이션입니다.  
사용자는 두 가지 모드를 선택하여 오사카 지역에 적합한 거주지를 탐색할 수 있습니다.  
(Osaka_Event is a web application designed to help users explore lifestyle information and local events based on subway stations in Osaka, Japan.
Users can choose between two interactive modes to find suitable residential)  

- **Map Mode**: 지도를 기반으로 주변 정보, 추천 역, 월세 시세 등을 시각적으로 확인   
 (Visualizes rent prices, nearby facilities, and current events by station on a map.)   
- **AI Mode**: 사용자가 원하는 조건(예산, 분위기, 특징, 번화가 조건)에 맞는 역을 추천   
(Recommends stations based on the user's preferences such as budget, atmosphere, desired features, and accessibility.)   

<br/><br/>

## 시연 영상

| Map Mode | AI Mode |
|----------|---------|
| [![Map Mode](https://github.com/user-attachments/assets/bfa4250e-5e7d-41ca-96c2-6590ca7d8920)](https://www.youtube.com/watch?v=G9FsQ2JF76w)<br>[영상 보러가기](https://www.youtube.com/watch?v=G9FsQ2JF76w) | [![AI Mode](https://github.com/user-attachments/assets/e0174ba9-b1f4-4ed0-bd89-42d353452cb7)](https://youtu.be/-IkcyRilcVI)<br>[영상 보러가기](https://youtu.be/-IkcyRilcVI) |

<br/><br/>

## 프로젝트 구조

<img src="https://github.com/user-attachments/assets/49c891e9-dc41-4b93-b65b-45e5f94044c3" width="800" alt="구조도" />

<br/><br/>

## 사용 기술 스택(System Architecture)

### Backend
![Django](https://img.shields.io/badge/Django-092E20?style=flat-square&logo=django&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat-square&logo=postgresql&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)

### API
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat-square&logo=openai&logoColor=white)
![Google APIs](https://img.shields.io/badge/Google%20APIs-4285F4?style=flat-square&logo=google&logoColor=white)

### Frontend
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![SVG](https://img.shields.io/badge/SVG-FFB13B?style=flat-square&logo=svg&logoColor=white)
![Inkscape](https://img.shields.io/badge/Inkscape-000000?style=flat-square&logo=inkscape&logoColor=white)

### DevOps & Deployment
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=flat-square&logo=nginx&logoColor=white)
![Ubuntu](https://img.shields.io/badge/Ubuntu-E95420?style=flat-square&logo=ubuntu&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=flat-square&logo=amazon-aws&logoColor=white)

<br/><br/>

## Map Mode Features

- **지하철 노선 시각화(Subway Route Visualization)**  
  SVG와 Inkscape를 사용해 오사카 지하철 노선도를 직접 제작하였습니다.   
(Created a custom subway route map of Osaka using SVG and Inkscape.)

- **월세 시세 표시(Rent Price Visualization)**  
  [SUUMO](https://suumo.jp/)에서 수동 수집한 임대 데이터를 기반으로 시세를 시각화합니다.  
  (Visualizes average rent prices based on data manually collected from SUUMO.)  

- **이벤트 정보 시각화(Live Event Mapping)**  
  [Japan Travel](https://www.japan.travel/) 웹사이트에서 웹 스크래핑을 통해 현재 진행 중인 지역 이벤트를 수집합니다.  
(Scraped event data from Japan Travel to show currently ongoing regional events.)

- **주변 분위기 요약(Station Atmosphere Summary)**  
  OpenAI의 ChatGPT API를 사용해 각 역의 분위기를 자동 요약하고 데이터베이스에 저장합니다.   
(Used OpenAI's ChatGPT API to generate station-specific atmosphere summaries, stored in the database.)

- **주변 시설 및 이미지 표시(Nearby Facilities and Photos)**  
  Google Places API를 활용해 각 역 주변의 대표 관광지, 편의시설, 이미지 등을 제공합니다.  
  (Retrieved nearby attractions and facility images using Google Places API.)  

<br/><br/>

## AI Mode Features

- **역별 분위기 및 특징 요약(Station Feature Summarization)**  
  오사카 지역 193개 역에 대해 ChatGPT API를 사용해 요약 데이터를 생성하고 DB에 저장합니다.
  (Generated summarized descriptions for 193 Osaka stations using ChatGPT and stored them for search.)  

- **월세 조건 필터링(Budget Filtering)**  
  사용자가 입력한 예산 조건에 따라 SUUMO 기반 임대 시세 데이터를 필터링합니다.
  (Filters rent data according to user-defined budget limits based on SUUMO pricing.)  

- **상권 조건 필터링(Accessibility to City Centers)**  
  [Yahoo Japan](https://transit.yahoo.co.jp/search/result?from=難波&to=梅田)(예시 사이트) 번화가로부터 각 역의 최소 시간을 DB화  
(Calculates travel time from each station to major downtown areas (e.g., Umeda, Namba) using transit data.)  

<br/>

(웹 수집은 시간 지연을 두며 프로젝트를 위한 최소 범위로 수행하였으며, 원저작물(이미지, 리뷰 전문 등)은 사용하지 않았습니다.)  
(⚠️ Web scraping was executed with delays and used only limited data for project demonstration. No copyrighted images or full reviews were used.)  

<br/><br/>

---


## 배포 환경 (AWS + Ubuntu)

<img src="https://github.com/user-attachments/assets/c13a3199-8aa6-4404-b4ae-c92bd9262db8" width="700" alt="AWS Ubuntu 배포 인증" />

<br/>

- Ubuntu 22.04 LTS + Docker 환경에서 React 프론트엔드와 Django 백엔드를 분리 배포  
(Deployed the React frontend and Django backend separately in a Docker environment on Ubuntu 22.04 LTS)

- Nginx를 이용해 백엔드 - 프론트엔드 구성  
(Configured the connection between backend and frontend using Nginx as a reverse proxy)  
  
- EC2 퍼블릭 IP를 이용한 직접 접속 및 테스트 완료  
(Verified deployment and functionality via direct access using the EC2 public IP address)

## Update
ver 1.01 - 2025/06/13

![버전1_01](https://github.com/user-attachments/assets/8253cba5-b2ae-4b08-b5c6-e9472510c13c)

맵 색상 변경 + 오류 해결(JR노선 클릭시 킨테츠 A노선도 나오던 오류) 

후에 폰트 및 글씨 안보이는 문제 해결하려고함  
(Updated the map color scheme and resolved a bug where the Kintetsu A line was mistakenly shown when selecting the JR line. Planning to work on font rendering and text visibility issues next.)  

<br/>

ver 1.02 - 2025/06/14

![image](https://github.com/user-attachments/assets/c86d5423-42f1-486f-a79f-768a63adf881)

텍스트 가독성 향상 (Improved text visibility)

검정 채움 + 연회색 외곽선 적용 (Black fill + light gray stroke)

paint-order: stroke fill 설정 (Set paint-order: stroke fill)

노선 구분용 <text id="KT"> 사용 (Used <text id="KT"> for line ID)

폰트: Noto Sans + JP 사용 (Used Noto Sans + Noto Sans JP)


