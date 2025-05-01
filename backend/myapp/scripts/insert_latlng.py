import os
import time
import requests
from dotenv import load_dotenv
from myapp.models import StationInfo  # 앱 이름 수정
import logging
logger = logging.getLogger(__name__)
def get_lat_lng_from_station_name(station_name):
    GOOGLE_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
    query = f"{station_name}駅 大阪府"
    url = f"https://maps.googleapis.com/maps/api/geocode/json?address={query}&region=jp&key={GOOGLE_API_KEY}"

    response = requests.get(url)
    if response.status_code == 200:
        results = response.json().get('results')
        if results:
            location = results[0]['geometry']['location']
            return location['lat'], location['lng']
    return None, None

def run():
    print("📍 lat/lng 삽입 시작")
    load_dotenv()
    stations = (
        StationInfo.objects
        .filter(japanese__in=["中津", "長原", "清水", "淡路"])
        .order_by("number")
    )

    logger.info(stations)
    for station in stations:
        time.sleep(0.2)  # 쿼터 보호
        lat, lng = get_lat_lng_from_station_name(station.japanese)
        if lat and lng:
            StationInfo.objects.filter(id=station.id).update(lat=lat, lng=lng)
            print(f"✅ {station.japanese}: lat={lat}, lng={lng}")
        else:
            print(f"❌ 못 찾음: {station.japanese}")

    print("✅ 완료")
