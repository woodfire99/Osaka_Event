import os
import csv
import time
import requests
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "your_project.settings")
django.setup()

from myapp.models import StationInfo
from dotenv import load_dotenv
from math import radians, cos, sin, asin, sqrt

# 허브 위치
HUBS = {
    "梅田": (34.702485, 135.495951),
    "難波": (34.668719, 135.500031),
    "天王寺": (34.645283, 135.513110),
    "本町": (34.685163, 135.501537),
    "京橋": (34.693994, 135.538238)
}

def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371000
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2)**2 + cos(lat1)*cos(lat2)*sin(dlon / 2)**2
    return 2 * R * asin(sqrt(a))  # meter


def get_bicycle_duration(origin_lat, origin_lng, dest_lat, dest_lng, api_key):
    url = "https://maps.googleapis.com/maps/api/distancematrix/json"
    params = {
        "origins": f"{origin_lat},{origin_lng}",
        "destinations": f"{dest_lat},{dest_lng}",
        "mode": "bicycling",
        "language": "ja",
        "region": "jp",
        "key": api_key,
    }
    response = requests.get(url, params=params)
    data = response.json()
    if data["status"] == "OK":
        element = data["rows"][0]["elements"][0]
        if element["status"] == "OK":
            return element["duration"]["value"] // 60  # 초 → 분
    return None

def run():
    print("🚲 Google API 자전거 시간 계산 시작")
    load_dotenv()
    GOOGLE_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")

    stations = StationInfo.objects.exclude(lat__isnull=True).exclude(lng__isnull=True)
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(BASE_DIR, "data", "bike_google_duration.csv")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    results = []

    for station in stations:
        for hub_name, (hub_lat, hub_lng) in HUBS.items():
            dist = haversine_distance(station.lat, station.lng, hub_lat, hub_lng)

            if dist > 5000:
                results.append([station.japanese, hub_name, round(dist), "too far"])
                print(f"❌ {station.japanese} → {hub_name}: {round(dist)}m - too far")
                continue

            time.sleep(0.2)
            minutes = get_bicycle_duration(station.lat, station.lng, hub_lat, hub_lng, GOOGLE_API_KEY)

            if minutes is not None:
                results.append([station.japanese, hub_name, round(dist), minutes])
                print(f"✅ {station.japanese} → {hub_name}: {minutes}분")
            else:
                results.append([station.japanese, hub_name, round(dist), "no data"])
                print(f"⚠️ {station.japanese} → {hub_name}: no data")

    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["역", "허브", "거리(m)", "자전거 예상시간(분)"])
        writer.writerows(results)

    print("✅ 완료:", output_path)
