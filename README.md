# Osaka_Event 
프로젝트 진행일자(2025/04/22 ~ 2025/05/04)

## 프로젝트 소개

**Osaka_Event**는 오사카 지역의 지하철역 기반 생활 정보와 지역 이벤트를 시각적으로 탐색할 수 있는 웹 애플리케이션입니다.  
사용자는 두 가지 모드를 선택하여 오사카 지역에 적합한 거주지를 탐색할 수 있습니다.

- **Map Mode**: 지도를 기반으로 주변 정보, 추천 역, 월세 시세 등을 시각적으로 확인
- **AI Mode**: 사용자가 원하는 조건(예산, 분위기, 특징, 번화가 조건)에 맞는 역을 추천

<br/><br/>

## 시연 영상

| Map Mode | AI Mode |
|----------|---------|
| [![Map Mode](https://github.com/user-attachments/assets/bfa4250e-5e7d-41ca-96c2-6590ca7d8920)](https://www.youtube.com/watch?v=G9FsQ2JF76w)<br>[영상 보러가기](https://www.youtube.com/watch?v=G9FsQ2JF76w) | [![AI Mode](https://github.com/user-attachments/assets/e0174ba9-b1f4-4ed0-bd89-42d353452cb7)](https://youtu.be/-IkcyRilcVI)<br>[영상 보러가기](https://youtu.be/-IkcyRilcVI) |

<br/><br/>

## 프로젝트 구조

<img src="https://github.com/user-attachments/assets/49c891e9-dc41-4b93-b65b-45e5f94044c3" width="800" alt="구조도" />

<br/><br/>

## 사용 기술 스택

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

## Map Mode 기능

- **지하철 노선 시각화**  
  SVG와 Inkscape를 사용해 오사카 지하철 노선도를 직접 제작하였습니다.

- **월세 시세 표시**  
  [SUUMO](https://suumo.jp/)에서 수동 크롤링한 임대 데이터를 기반으로 시세를 시각화합니다.

- **이벤트 정보 시각화**  
  [Japan Travel](https://www.japan.travel/) 웹사이트에서 웹 크롤링을 통해 현재 진행 중인 지역 이벤트를 수집합니다.

- **주변 분위기 요약**  
  OpenAI의 ChatGPT API를 사용해 각 역의 분위기를 자동 요약하고 데이터베이스에 저장합니다.

- **주변 시설 및 이미지 표시**  
  Google Places API를 활용해 각 역 주변의 대표 관광지, 편의시설, 이미지 등을 제공합니다.

<br/><br/>

## AI Mode 기능

- **역별 분위기 및 특징 요약**  
  오사카 지역 193개 역에 대해 ChatGPT API를 사용해 요약 데이터를 생성하고 DB에 저장합니다.

- **월세 조건 필터링**  
  사용자가 입력한 예산 조건에 따라 SUUMO 기반 임대 시세 데이터를 필터링합니다.

- **상권 조건 필터링**  
  [Yahoo Japan](https://transit.yahoo.co.jp/search/result?from=難波&to=梅田) 등 외부 웹사이트 데이터를 수집하여 상권 밀집도 지표를 정제하고 자체 DB화하였습니다.


(웹 수집은 시간 지연을 두었으며, 프로젝트를 위한 데이터셋 수집에만 사용 하였습니다.)

---

## 배포 환경 (AWS + Ubuntu)

<img src="https://github.com/user-attachments/assets/c13a3199-8aa6-4404-b4ae-c92bd9262db8" width="700" alt="AWS Ubuntu 배포 인증" />

- Ubuntu 22.04 LTS + Docker 환경에서 React 프론트엔드와 Django 백엔드를 분리 배포
- Nginx를 이용해 백엔드 - 프론트엔드 구성
- EC2 퍼블릭 IP를 이용한 직접 접속 및 테스트 완료
