from rest_framework.generics import ListAPIView
from .models import EventDetail, FacilityInfo, StationInfo
from .serializers import EventDetailSerializer
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
import os
import requests
import re
import logging
from dotenv import load_dotenv

load_dotenv()  
GOOGLE_PLACES_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')

logger = logging.getLogger(__name__)

# 리스트클릭시 -> db 연결 -> 프론트
@csrf_exempt
def receive_idx(request):
    if request.method == 'POST':
        body = json.loads(request.body)
        idx=body.get('idx')
        
        try:
            idx=int(idx)
            station = StationInfo.objects.get(number=idx)  # 🔥 number로 검색
            station_data = {
                'number': station.number,
                'japanese': station.japanese,
                'english': station.english,
                'korean': station.korean,
                'station_code': station.station_code,
                'ai_summary': station.ai_summary,
            }
            return JsonResponse(station_data)  # 🔥 역 정보 전체를 JSON으로 응답
        except StationInfo.DoesNotExist:
            return JsonResponse({'error': 'Station not found'}, status=404)

    else:
        return JsonResponse({'error': 'POST 요청만 지원합니다.'}, status=400)




# 주요 시설 api 연동
@csrf_exempt
def fetch_facility_info(request):
    logger.debug("▶ fetch_facility_info 호출됨")
    if request.method == 'POST':
        body = json.loads(request.body)
        facility_name = re.sub(r'\d+\.', '', body.get('facility_name'))
        if not facility_name:
            return JsonResponse({'error': 'No facility name provided.'}, status=400)

        # 1. DB에서 먼저 찾아본다
        facility = FacilityInfo.objects.filter(name=facility_name).first()
        if facility:
            return JsonResponse({
                'name': facility.name,
                'address': facility.address,
                'rating': facility.rating,
                'photo_reference': facility.photo_reference,
                'lat': facility.lat,
                'lng': facility.lng,
            })

        # 2. 없으면 Places API로 요청
        endpoint = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
        params = {
            "input": facility_name,
            "inputtype": "textquery",
            "fields": "photos,formatted_address,name,rating,geometry",
            "key": GOOGLE_PLACES_API_KEY,
        }
        res = requests.get(endpoint, params=params)
        data = res.json()
        if data.get('status') != 'OK' or not data.get('candidates'):
            return JsonResponse({'error': 'No data found from Google Places API.'}, status=404)

        candidate = data['candidates'][0]
        photo_reference = candidate.get('photos', [{}])[0].get('photo_reference')

        # 3. DB에 저장 (get_or_create로 변경)
        facility_obj, created = FacilityInfo.objects.get_or_create(
            name=candidate['name'],
            defaults={
                'address': candidate.get('formatted_address'),
                'rating': candidate.get('rating'),
                'photo_reference': photo_reference,
                'lat': candidate['geometry']['location']['lat'],
                'lng': candidate['geometry']['location']['lng'],
            }
        )

        # 4. JSON 응답
        return JsonResponse({
            'name': facility_obj.name,
            'address': facility_obj.address,
            'rating': facility_obj.rating,
            'photo_reference': facility_obj.photo_reference,
            'lat': facility_obj.lat,
            'lng': facility_obj.lng,
        })

    return JsonResponse({'error': 'Invalid request method.'}, status=405)


class EventDetailListView(ListAPIView):
    queryset = EventDetail.objects.all().order_by('-saved_at')
    serializer_class = EventDetailSerializer


