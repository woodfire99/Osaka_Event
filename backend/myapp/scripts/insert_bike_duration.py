import csv
from myapp.models import BikeDuration
import os
from django.conf import settings  # BASE_DIR 사용

def run():
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(BASE_DIR, "data", "bike_google_duration_add.csv")
    with open(path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            station = row["역"]
            hub = row["허브"]
            distance = int(row["거리(m)"])
            duration = row["자전거 예상시간(분)"]
            duration_val = int(duration) if duration.isdigit() else None

            BikeDuration.objects.update_or_create(
                station=station,
                hub=hub,
                defaults={
                    "distance_m": distance,
                    "duration_min": duration_val,
                }
            )
    print("✅ 자전거 소요시간 삽입 완료")
