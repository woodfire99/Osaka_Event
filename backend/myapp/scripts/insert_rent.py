def run():
    import csv
    from myapp.models import RentInfo
    from django.conf import settings
    import os

    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(BASE_DIR, 'data', 'rent_data.csv')

    count = 0
    with open(path, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        reader.fieldnames = [fn.strip().lstrip('\ufeff') for fn in reader.fieldnames]

        for row in reader:
            try:
                price_str = row['rent_price'].replace('万円', '').strip()
                rent_price = None if price_str == '-' else float(price_str)
                RentInfo.objects.update_or_create(
                    line=row['line'],
                    room_type=row['room_type'],
                    station=row['station'],
                    defaults={'rent_price': rent_price}
                )

                count += 1
            except Exception as e:
                print(f"⚠️ 에러 발생 (row={row}): {e}")

    print(f"✅ {count}건의 rent 데이터 삽입 완료")
