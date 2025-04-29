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
from django.http import HttpResponse
from dotenv import load_dotenv
from .models import NearbyFacility
load_dotenv()  
GOOGLE_PLACES_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')

logger = logging.getLogger(__name__)


@csrf_exempt
def photo_proxy(request):
    photo_reference = request.GET.get('photo_reference')

    if not photo_reference:
        return JsonResponse({'error': 'photo_reference missing'}, status=400)

    GOOGLE_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
    url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference={photo_reference}&key={GOOGLE_API_KEY}"

    try:
        response = requests.get(url, allow_redirects=True)  # 🔥 302 리다이렉트도 따라감
        return HttpResponse(response.content, content_type=response.headers.get('Content-Type', 'image/jpeg'))
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# 위도 경도 구해서 넣기(있으면 발동안함)
def get_lat_lng_from_station_name(station_name):
    GOOGLE_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
    url = f"https://maps.googleapis.com/maps/api/geocode/json?address={station_name}&region=jp&key={GOOGLE_API_KEY}"
    
    response = requests.get(url)
    if response.status_code == 200:
        results = response.json().get('results')
        if results:
            location = results[0]['geometry']['location']
            return location['lat'], location['lng']
    return None, None

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
def fetch_facilities(request):
    if request.method == 'POST':
        body = json.loads(request.body)
        station_name = body.get('station_name')

        try:
            station = StationInfo.objects.get(japanese=station_name)
        except StationInfo.DoesNotExist:
            return JsonResponse({'error': 'Station not found'}, status=404)

        # lat/lng이 없으면 구글에서 받아오기
        if station.lat is None or station.lng is None:
            lat, lng = get_lat_lng_from_station_name(station.japanese)
            if lat is None or lng is None:
                return JsonResponse({'error': '위치 정보를 찾을 수 없습니다'}, status=404)
            station.lat = lat
            station.lng = lng
            station.save()

        lat, lng = station.lat, station.lng

        # 🔥 먼저 NearbyFacility에서 찾는다
        facilities = NearbyFacility.objects.filter(station=station)
        if facilities.exists():
            facilities_data = [
                {
                    'name': f.name,
                    'address': f.address,
                    'rating': f.rating,
                    'photo_reference': f.photo_reference,  # 🔥 추가
                }
                for f in facilities
            ]
            return JsonResponse({'facilities': facilities_data})

        # 🔥 NearbyFacility 없으면 새로 구글 Places API 요청
        GOOGLE_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
        url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat},{lng}&radius=1000&type=tourist_attraction&key={GOOGLE_API_KEY}"
        response = requests.get(url)
        places = response.json().get('results', [])

        # 새로 받아온 데이터 DB 저장
        for place in places:
            photo_ref = None
            if place.get('photos'):
                photo_ref = place['photos'][0].get('photo_reference')

            NearbyFacility.objects.create(
                station=station,
                name=place.get('name'),
                address=place.get('vicinity'),
                rating=place.get('rating'),
                photo_reference=photo_ref
            )

        # 프론트로 보낼 데이터 준비
        facilities_data = [
            {
                'name': p.get('name'),
                'address': p.get('vicinity'),
                'rating': p.get('rating'),
                'photo_reference': p['photos'][0]['photo_reference'] if p.get('photos') else None,
            }
            for p in places
        ]
        return JsonResponse({'facilities': facilities_data})

# 이벤트 - 역 연동
@csrf_exempt
def fetch_events_by_station(request):
    if request.method == 'POST':
        body = json.loads(request.body)
        station_name = body.get('station_name')  # 예: "なんば駅"
        logger.info(station_name)
        if not station_name:
            return JsonResponse({'error': '역 이름이 필요합니다'}, status=400)

        events = EventDetail.objects.filter(nearest_station__contains=[station_name]).order_by('-saved_at')[:10]

        event_list = [
            {
                'title': e.title,
                'location': e.location,
                'date': e.date,
                'image': e.image,
                'url': e.url,
            }
            for e in events
        ]

        return JsonResponse({'events': event_list})
    else:
        return JsonResponse({'error': 'POST 요청만 지원됩니다'}, status=400)

class EventDetailListView(ListAPIView):
    queryset = EventDetail.objects.all().order_by('-saved_at')
    serializer_class = EventDetailSerializer


