import os
import psycopg2
import requests
from dotenv import load_dotenv

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

# DB 연결
conn = psycopg2.connect(
    host="db",
    dbname="osaka_db",
    user="osaka_user",
    password="osaka_pw",
    port="5432"
)
cur = conn.cursor()

# event_details 중 district_name 또는 nearest_station 이 없는 row 조회
cur.execute("SELECT id, location FROM event_details WHERE district_name IS NULL OR nearest_station IS NULL")
events = cur.fetchall()

for event_id, location in events:
    if not location:
        print(f"❌ 위치 정보 없음 (ID: {event_id})")
        continue

    formatted_location = f"{location}, Osaka, Japan"

    # Geocoding API 요청
    geo_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={formatted_location}&key={GOOGLE_API_KEY}"
    geo_res = requests.get(geo_url).json()

    if not geo_res["results"]:
        print(f"❌ 지오코딩 실패: {location}")
        continue

    geometry = geo_res["results"][0]["geometry"]["location"]
    lat, lng = geometry["lat"], geometry["lng"]

    # 리버스 지오코딩으로 구 이름 확인
    # 리버스 지오코딩으로 전체 주소 추출
    rev_url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lng}&key={GOOGLE_API_KEY}&language=ja"
    rev_res = requests.get(rev_url).json()

    district = None
    if rev_res.get("results"):
        district = rev_res["results"][0].get("formatted_address")


    # 주변 역 정보 (여러 type 시도)
    station_types = ["train_station", "subway_station", "transit_station"]
    stations = []

    for station_type in station_types:
        nearby_url = (
            f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?"
            f"location={lat},{lng}&radius=1000&type={station_type}&key={GOOGLE_API_KEY}&language=ja"
        )
        station_res = requests.get(nearby_url).json()

        for result in station_res.get("results", []):
            name = result.get("name")
            if name and name not in stations:
                stations.append(name)
            if len(stations) >= 5:
                break
        if len(stations) >= 5:
            break

    # ✅ 출력만 하기
    print(f"🧾 ID: {event_id}")
    print(f"   위치: {location}")
    print(f"   위도/경도: {lat}, {lng}")
    print(f"   구 이름: {district}")
    print(f"   주변 역: {stations}")
    print("--------------------------------------------------")

cur.close()
conn.close()
