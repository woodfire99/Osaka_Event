import os
import time
import requests
from django.conf import settings
from myapp.models import StationInfo
from dotenv import load_dotenv
import hashlib

def get_hashed_filename(photo_ref):
    hash_object = hashlib.md5(photo_ref.encode())
    return f"{hash_object.hexdigest()}.jpg"

def run():
    print("📷 역 사진 캐싱 시작")
    load_dotenv()

    API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
    if not API_KEY:
        print("❌ API 키가 없습니다. .env 확인 필요")
        return

    save_dir = os.path.join(settings.MEDIA_ROOT, "station_photos")
    os.makedirs(save_dir, exist_ok=True)

    stations = StationInfo.objects.exclude(station_photo__isnull=True)

    for station in stations:
        photo_ref = station.station_photo
        filename = get_hashed_filename(photo_ref)
        local_path = os.path.join(save_dir, filename)

        if os.path.exists(local_path):
            print(f"✅ {station.japanese}: 이미 존재")
            continue

        photo_url = (
            f"https://maps.googleapis.com/maps/api/place/photo"
            f"?maxwidth=400&photo_reference={photo_ref}&key={API_KEY}"
        )

        try:
            res = requests.get(photo_url, stream=True, timeout=10)
            if res.status_code == 200:
                with open(local_path, "wb") as f:
                    for chunk in res.iter_content(1024):
                        f.write(chunk)
                print(f"📥 {station.japanese}: 저장 완료")
            else:
                print(f"❌ {station.japanese}: {res.status_code} 에러")
        except Exception as e:
            print(f"❌ {station.japanese}: 예외 발생 - {e}")

        time.sleep(0.3)  # 쿼터 보호

    print("✅ 모든 사진 저장 완료")
