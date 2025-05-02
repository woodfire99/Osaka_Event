import csv
from myapp.models import StationInfo
import os

def run():
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(BASE_DIR, "data", "station_features.csv")

    stations = StationInfo.objects.filter(lat__isnull=False, lng__isnull=False).order_by("number")

    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Number", "Japanese", "Lat", "Lng"])
        for s in stations:
            writer.writerow([s.number, s.japanese, s.lat, s.lng])

    print("✅ station_coords.csv 저장 완료")


#near_park = models.BooleanField(default=False)           # 공원 근처
# shopping_street = models.BooleanField(default=False)     # 상점가 있음
# supermarket_dense = models.BooleanField(default=False)   # 마트 밀집
# safe = models.BooleanField(default=False)                # 치안 좋음