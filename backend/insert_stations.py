import csv
import os
import django

# Django 환경 세팅
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from myapp.models import StationInfo

with open('osaka_station_names.csv', newline='', encoding='utf-8-sig') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        # Station 필드를 리스트로 처리
        station_codes = [code.strip() for code in row['Station'].split(',') if code.strip()]
        # 여러개 있어도 첫 번째만 저장할지, 아니면 JSON처럼 다 저장할지 결정할 수 있어
        StationInfo.objects.update_or_create(
            number=row['Number'],  # 기준 필드 (중복 기준이 되는 고유값)
            defaults={
                'japanese': row['Japanese'],
                'english': row['English'],
                'korean': row['Korean'],
                'station_code': station_codes[0] if station_codes else None,
            }
        )

print("CSV 데이터 삽입 완료!")

