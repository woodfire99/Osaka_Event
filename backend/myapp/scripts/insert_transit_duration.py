import os
import csv
from django.conf import settings
from myapp.models import TransitDuration

def run():
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(BASE_DIR, "data", "yahoo_station_duration.csv")
    if not os.path.exists(path):
        print("❌ 파일이 존재하지 않습니다:", path)
        return

    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        inserted = 0
        for row in reader:
            station = row["역"]
            hub = row["허브"]
            distance = int(row["거리(m)"])
            duration = row["소요시간(분)"]
            duration_val = int(duration) if duration.isdigit() else None

            TransitDuration.objects.update_or_create(
                station=station,
                hub=hub,
                defaults={
                    "distance_m": distance,
                    "duration_min": duration_val,
                }
            )
            inserted += 1

    print(f"✅ 전철 소요시간 {inserted}개 삽입 완료")
