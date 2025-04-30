import csv, os
from myapp.models import StationInfo
import django
from django.conf import settings
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

def insert_station_data():
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(BASE_DIR, 'data', 'osaka_station_names.csv')

    with open(csv_path, newline='', encoding='utf-8-sig') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            station_codes = [code.strip() for code in row['Station'].split(',') if code.strip()]
            StationInfo.objects.update_or_create(
                number=row['Number'],
                defaults={
                    'japanese': row['Japanese'],
                    'english': row['English'],
                    'korean': row['Korean'],
                    'station_code': ','.join(station_codes),
                }
            )
    print("CSV 데이터 삽입 완료!")

# 🔥 Django Extensions runscript가 찾을 함수
def run():
    insert_station_data()
