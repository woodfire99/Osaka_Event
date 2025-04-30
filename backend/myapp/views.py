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
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import RentInfo
from .serializers import RentInfoSerializer
from django.http import HttpResponse
from dotenv import load_dotenv
from .models import NearbyFacility
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import RentInfo
from .serializers import RentInfoSerializer
import json
from rest_framework.views import APIView
from django.core.files.base import ContentFile
from rest_framework.response import Response
from .models import StationInfo
from .serializers import StationInfoSerializer
from django.db.models import Q
from django.http import FileResponse, JsonResponse, HttpResponse
from django.core.files.base import ContentFile
from .models import NearbyFacility
import requests
import os

load_dotenv()  
GOOGLE_PLACES_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
logger = logging.getLogger(__name__)

class StationSearchView(APIView):
    def post(self, request):
        keyword = request.data.get('keyword', '')
        if not keyword:
            return Response([])

        stations = StationInfo.objects.filter(
            Q(japanese__icontains=keyword) |
            Q(english__icontains=keyword) |
            Q(korean__icontains=keyword)
        )
        serializer = StationInfoSerializer(stations, many=True)
        return Response(serializer.data)

class RentInfoByStationView(APIView):
    def post(self, request):
        try:
            body = json.loads(request.body)
            station_name = body.get('station')

            if not station_name:
                return Response({'error': 'No station name provided'}, status=status.HTTP_400_BAD_REQUEST)

            rents = RentInfo.objects.filter(station=station_name)
            serializer = RentInfoSerializer(rents, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
def recommend_stations(request):
    if request.method == 'POST':
        data = json.loads(request.body)

        # 🔍 조건 데이터
        mood = data.get('mood')
        room_size = data.get('room_size')
        rent_limit = data.get('rent_limit')
        features = data.get('features', [])
        routes = data.get('routes', [])

        # 🎯 mood 기준 필터링 (추가적으로 room_size, rent_limit도 적용 가능)
        stations = StationInfo.objects.filter(mood__contains=[mood])

        # TODO: room_size, rent_limit 등 추가 필터링 로직 작성

        # 🔁 결과 포맷 샘플
        result = []
        for s in stations:
            result.append({
                'japanese': s.japanese,
                'english': s.english,
                'ai_summary': s.ai_summary,
                'rent': 5.5,  # TODO: 실제 임대 정보 있으면 연결
                'tags': s.mood,  # mood 그대로 표시
            })

        return JsonResponse({'results': result})


def generate_prompt(mood, room_size, rent_limit, features, routes):
    prompt_parts = []

    # 분위기
    if mood:
        prompt_parts.append(f"지역 분위기는 '{mood}'입니다.")

    # 방 크기 + 월세
    if room_size and rent_limit:
        prompt_parts.append(f"방 크기는 '{room_size}'이고, 월세는 {rent_limit}만엔 이하입니다.")

    # 특징
    if features:
        feature_str = ', '.join(features)
        prompt_parts.append(f"다음과 같은 특징을 원합니다: {feature_str}.")

    # 이동 조건
    if routes:
        route_descriptions = []
        for route in routes:
            if route.get('destination') and route.get('transport') and route.get('distance'):
                desc = f"{route['destination']}까지 {route['transport']}로 {route['distance']}분 이내"
                route_descriptions.append(desc)
        if route_descriptions:
            joined = ' / '.join(route_descriptions)
            prompt_parts.append(f"이동 조건: {joined}.")

    return ' '.join(prompt_parts)


def photo_proxy(request):
    photo_reference = request.GET.get('photo_reference')

    if not photo_reference:
        return JsonResponse({'error': 'photo_reference missing'}, status=400)

    GOOGLE_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
    url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference={photo_reference}&key={GOOGLE_API_KEY}"

    try:
        facility = NearbyFacility.objects.filter(photo_reference=photo_reference).first()

        # ✅ 1. DB에 해당 facility가 없는 경우 방어
        if not facility:
            return JsonResponse({'error': 'No facility with given photo_reference'}, status=404)

        # ✅ 2. 이미지가 이미 저장돼 있으면 바로 반환
        if facility.photo:
            logger.info("📸 로컬 이미지 있음")
            return FileResponse(facility.photo.open('rb'), content_type='image/jpeg')
        else:
            logger.info("🌐 Google API 재요청 중...")


        # ✅ 3. Google에서 새로 가져오기
        response = requests.get(url, allow_redirects=True)

        if response.status_code == 200:
            filename = f"{facility.name[:30].replace(' ', '_')}.jpg"  # 이름 너무 길면 자르기
            facility.photo.save(filename, ContentFile(response.content), save=True)
            return FileResponse(facility.photo.open('rb'), content_type='image/jpeg')
        else:
            return JsonResponse({'error': f'Google API status {response.status_code}'}, status=502)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JsonResponse({'error': str(e)}, status=500)


# 위도 경도 구해서 넣기(있으면 발동안함)
def get_lat_lng_from_station_name(station_name):
    GOOGLE_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
    query = f"{station_name}駅"
    url = f"https://maps.googleapis.com/maps/api/geocode/json?address={query}&region=jp&key={GOOGLE_API_KEY}"

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

        if station.lat is None or station.lng is None:
            lat, lng = get_lat_lng_from_station_name(station.japanese)
            if lat is None or lng is None:
                return JsonResponse({'error': '위치 정보를 찾을 수 없습니다'}, status=404)
            station.lat = lat
            station.lng = lng
            station.save()

        lat, lng = station.lat, station.lng

        facilities = NearbyFacility.objects.filter(station=station).order_by('-rating')[:5]
        if facilities.exists():
            facilities_data = [
                {
                    'name': f.name,
                    'address': f.address,
                    'rating': f.rating,
                    'photo_reference': f.photo_reference,
                }
                for f in facilities[:5]
            ]
            return JsonResponse({'facilities': facilities_data})
        
        logger.info("데이터가 없으면 여기로옴")
        # Places API 호출
        GOOGLE_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
        url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat},{lng}&radius=1000&type=tourist_attraction&key={GOOGLE_API_KEY}"
        response = requests.get(url)
        places = response.json().get('results', [])

        # DB 저장 + 이미지 저장
        saved_facilities = []
        for place in places:
            name = place.get('name')
            address = place.get('vicinity')
            rating = place.get('rating')
            photo_ref = None
            photo_file = None

            if place.get('photos'):
                photo_ref = place['photos'][0].get('photo_reference')
                logger.info(photo_ref)
                # 🔥 이미지도 다운로드
                if photo_ref:
                    photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference={photo_ref}&key={GOOGLE_API_KEY}"
                    img_response = requests.get(photo_url)
                    if img_response.status_code == 200:
                        filename = f"{name[:30].replace(' ', '_')}.jpg"
                        photo_file = ContentFile(img_response.content, name=filename)

            facility = NearbyFacility(
                station=station,
                name=name,
                address=address,
                rating=rating,
                photo_reference=photo_ref or "",
            )

            if photo_file:
                facility.photo.save(photo_file.name, photo_file, save=True)
            else:
                facility.save()

            saved_facilities.append({
                'name': name,
                'address': address,
                'rating': rating,
                'photo_reference': photo_ref,
            })

        return JsonResponse({'facilities': saved_facilities})

# 이벤트 - 역 연동
@csrf_exempt
def fetch_events_by_station(request):
    if request.method == 'POST':
        body = json.loads(request.body)
        station_name = body.get('station_name')  # 예: "なんば駅"
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


