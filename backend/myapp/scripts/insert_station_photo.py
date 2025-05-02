import os
import time
import requests
from dotenv import load_dotenv
from myapp.models import StationInfo  # ← 실제 앱 이름으로 수정
import django
import logging

logger = logging.getLogger(__name__)

def get_station_photo_reference(station_name):
    GOOGLE_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
    query = f"{station_name}駅周辺 風景、 大阪府"
    url = f"https://maps.googleapis.com/maps/api/place/textsearch/json?query={query}&region=jp&key={GOOGLE_API_KEY}"

    response = requests.get(url)
    if response.status_code == 200:
        results = response.json().get('results')
        if results:
            photos = results[0].get('photos')
            if photos:
                return photos[0].get('photo_reference')
    return None

def run():
    print("📸 역 사진 정보 삽입 시작")
    load_dotenv()

    stations = (
        StationInfo.objects
        .order_by("number")
    )

    for station in stations:
        time.sleep(0.3)  # API 쿼터 보호
        photo_ref = get_station_photo_reference(station.japanese)
        if photo_ref:
            StationInfo.objects.filter(id=station.id).update(station_photo=photo_ref)
            print(f"✅ {station.japanese}: 사진 ref 등록 완료")
        else:
            print(f"❌ {station.japanese}: 사진 ref 없음")

    print("✅ 전체 완료")
