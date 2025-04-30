from myapp.models import StationInfo
import os
import django

# Django 환경 세팅
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()


def extract_moods(summary):
    if not summary:
        return []

    moods = []
    if "조용" in summary or "한적" in summary:
        moods.append("조용함")
    if "활기" in summary or "상업지구" in summary or "붐빈다" in summary:
        moods.append("활기참")
    if "현지" in summary or "주민" in summary or "일상" in summary:
        moods.append("현지 느낌")
    if "신축" in summary or "새로운 아파트" in summary:
        moods.append("신축 위주")
    if "전통" in summary or "노포" in summary:
        moods.append("노포/전통 분위기")
    return list(set(moods))


def run():
    updated = 0
    for station in StationInfo.objects.all():
        moods = extract_moods(station.ai_summary)

        if moods:
            station.mood = moods
            station.save()
            updated += 1
    print(f"\n총 {updated}개 저장완료")

