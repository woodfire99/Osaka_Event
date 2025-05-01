import os
import csv
import time
import re
from math import radians, cos, sin, asin, sqrt
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "your_project.settings")
django.setup()

from myapp.models import StationInfo

# ✅ 허브 위치
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
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
    return 2 * R * asin(sqrt(a))

def get_yahoo_duration(driver, from_station, to_station):
    url = f"https://transit.yahoo.co.jp/search/result?from={from_station}&to={to_station}&hour=7&minute=0"
    driver.get(url)

    try:
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".summary .time"))
        )

        soup = BeautifulSoup(driver.page_source, "html.parser")
        time_li = soup.select_one(".summary .time")

        if time_li:
            full_text = time_li.get_text(strip=True)
            match = re.search(r"(\d+)分", full_text)
            if match:
                return int(match.group(1))
    except Exception as e:
        print(f"❌ 크롤링 실패: {from_station} → {to_station}: {e}")
    return None

def run():
     # 🔽 저장 경로: scripts/data/yahoo_station_duration.csv
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(BASE_DIR, "data", "yahoo_station_duration.csv")

    stations = (
        StationInfo.objects
        .exclude(lat__isnull=True)
        .exclude(lng__isnull=True)
    )

    options = webdriver.ChromeOptions()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")

    service = Service("/usr/bin/chromedriver")  # ✅ 최신 방식
    driver = webdriver.Chrome(service=service, options=options)

    results = []

    for station in stations:
        for hub_name, (hub_lat, hub_lng) in HUBS.items():
            dist = round(haversine_distance(station.lat, station.lng, hub_lat, hub_lng))
            if dist > 10000:
                results.append([station.japanese, hub_name, dist, "too far"])
                print(f"❌ {station.japanese} → {hub_name}: too far")
                continue

            duration = get_yahoo_duration(driver, station.japanese + "駅", hub_name + "駅")
            time.sleep(1)  # Yahoo 차단 방지

            if duration is None:
                results.append([station.japanese, hub_name, dist, "no data"])
                print(f"⚠️ {station.japanese} → {hub_name}: no data")
            elif duration <= 20:
                results.append([station.japanese, hub_name, dist, duration])
                print(f"✅ {station.japanese} → {hub_name}: {duration}분")
            else:
                results.append([station.japanese, hub_name, dist, "too long"])
                print(f"❌ {station.japanese} → {hub_name}: {duration}분 - too long")

    driver.quit()

    # CSV 저장
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["역", "허브", "거리(m)", "소요시간(분)"])
        writer.writerows(results)

if __name__ == "__main__":
    run()
