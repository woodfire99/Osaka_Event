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
from django.http import FileResponse, HttpResponse, HttpResponseNotFound
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
from .models import NearbyFacility, BikeDuration, TransitDuration
import requests
import os
from django.conf import settings
from openai import OpenAI
from django.views.decorators.http import require_GET
import hashlib
import base64

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))  
GOOGLE_PLACES_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
logger = logging.getLogger(__name__)
HUB_MAP = {
    "Umeda": "梅田",
    "Namba": "難波",
    "Tennoji": "天王寺",
    "Kyobashi": "京橋",
    "Hommachi": "本町"
}

FEATURE_FIELD_MAP = {
    '공원 근처': 'near_park',
    '상점가': 'shopping_street',
    '마트 근처': 'supermarket_dense',
    '치안 좋음': 'safe',
}

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

def trim_ai_summary(summary: str) -> str:
    if not summary:
        return ''
    return summary.split('[주변 주요 시설]')[0].strip()


def filter_by_routes(candidates, routes):
    if not routes:
        return candidates, {}

    filtered = []
    route_lookup = {}

    for station in candidates:
        valid = True
        station_lookup = {}

        for route in routes:
            hub_en = route.get("destination")
            hub_jp = HUB_MAP.get(hub_en)
            mode = route.get("transport")
            max_min = int(route.get("distance"))

            if not hub_jp:
                continue

            if mode == "bike":
                d = BikeDuration.objects.filter(station=station.japanese, hub=hub_jp).first()
            else:
                d = TransitDuration.objects.filter(station=station.japanese, hub=hub_jp).first()

            duration = d.duration_min if d else None
            station_lookup[hub_jp] = {
                'mode': mode,
                'duration': duration,
            }

            if duration is None or duration > max_min:
                valid = False
                break

        if valid:
            filtered.append(station)
            route_lookup[station.japanese] = station_lookup

    return filtered, route_lookup

def filter_by_rent(stations, room_size, rent_limit):
    candidates = []
    rent_lookup = {}

    for s in stations:
        rent_match = RentInfo.objects.filter(
            station=s.japanese,
            room_type=room_size,
            rent_price__lte=rent_limit
        ).first()

        if rent_match:
            candidates.append(s)  # ✅ 이제 순수 StationInfo만
            rent_lookup[s.japanese] = rent_match.rent_price

    return candidates, rent_lookup

def filter_by_features(stations, features):
    if not features:
        return stations

    def matches(station):
        for f in features:
            field = FEATURE_FIELD_MAP.get(f)
            if field and not getattr(station, field, False):
                return False
        return True

    return [s for s in stations if matches(s)]

def hash_photo_filename(ref):
    if not ref:
        return None
    return hashlib.md5(ref.encode()).hexdigest()

def image_base64_from_hash(ref: str, folder: str = 'station_photos'):
    hashed_filename = hashlib.md5(ref.encode()).hexdigest() + ".jpg"
    if folder == 'facility_photos':
        file_path = os.path.join(settings.FACILITY_PHOTO_ROOT, hashed_filename)
    else:
        
        file_path = os.path.join(settings.STATION_PHOTO_ROOT, hashed_filename)

    if not os.path.exists(file_path):
        logger.info(file_path)
        return None
    with open(file_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def get_photo_url(name: str, folder: str = 'facility_photos') -> str:
    safe_filename = name[:30].replace(' ', '_') + ".jpg"
    return f"/media/{folder}/{safe_filename}"

def get_nearby_facilities_from_google(station):
    api_key = os.getenv("GOOGLE_PLACES_API_KEY")
    if not api_key:
        logger.error("❌ GOOGLE_PLACES_API_KEY 환경변수가 없습니다")
        return

    lat, lng = station.lat, station.lng
    location = f"{lat},{lng}"
    radius = 500  # meters

    place_type = "tourist_attraction"  # 필요에 따라 변경 가능

    url = (
        f"https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        f"?location={location}"
        f"&radius={radius}"
        f"&type={place_type}"
        f"&language=ja"
        f"&key={api_key}"
    )

    response = requests.get(url)
    if response.status_code != 200:
        logger.warning(f"❌ Google Places API 요청 실패: {response.status_code}")
        return

    data = response.json()
    results = data.get("results", [])

    logger.info(f"🌍 주방 시장 {len(results)}개 검색됨")

    for place in results[:10]:  # 최대 10개까지만 저장
        name = place.get("name")
        address = place.get("vicinity")
        rating = place.get("rating", 0)
        photo_ref = None

        if place.get("photos"):
            photo_ref = place["photos"][0].get("photo_reference")

        if name and address:
            # 동일 이름 시장이 이미 있으면 중복 저장 하지 않음
            if not NearbyFacility.objects.filter(name=name, station=station).exists():
                NearbyFacility.objects.create(
                    name=name,
                    address=address,
                    rating=rating,
                    photo_reference=photo_ref,
                    station=station
                )
                logger.info(f"✅ 저장됨: {name}")

@csrf_exempt
def recommend_stations(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'POST만 지원됩니다.'}, status=405)
    try:
        data = json.loads(request.body)
        mood = data.get('mood')
        room_size = data.get('room_size')
        rent_limit = float(data.get('rent_limit'))
        features = data.get('features', [])
        routes = data.get('routes', [])
        logger.info(features)
        
        # 1. mood filter
        stations = StationInfo.objects.filter(mood__contains=[mood])
        logger.info(len(stations))
        # 2. rent filter
        candidates, rent_lookup = filter_by_rent(stations, room_size, rent_limit)
        logger.info(len(candidates))
        # 3. route filter
        candidates, route_lookup = filter_by_routes(candidates, routes)
        logger.info(len(candidates))
        # 4. features filter
        candidates = filter_by_features(candidates, features)
        logger.info(len(candidates))


        if not candidates:
            return JsonResponse({
                'results': [],
                'route_time': route_lookup,
                'message': '조건에 맞는 역이 없습니다.'
            })
        
        results = []
        for s in candidates:
            photo_base64 = image_base64_from_hash(s.station_photo)
            results.append({
                        'number' : s.number,
                        'japanese': s.japanese,
                        'english': s.english,
                        'korean': s.korean,
                        'lat': s.lat,
                        'lng': s.lng,
                        'station_code' : s.station_code,
                        'ai_summary' : trim_ai_summary(s.ai_summary),
                        'rent': rent_lookup.get(s.japanese),
                        'routes': route_lookup.get(s.japanese, {}),
                        'photo': photo_base64,
                    })
               
        return JsonResponse({
            'results': results,
            'message': None,
        })


    except Exception as e:
        logger.exception(f"GPT 추천 실패: {e}")
        return JsonResponse({'error': str(e)}, status=500)

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
        logger.info("🚫 photo_reference 빠짐 - 요청 거절")
        return JsonResponse({'error': 'photo_reference missing'}, status=400)

    try:
        # 🔍 1. DB 조회
        facility = NearbyFacility.objects.filter(photo_reference=photo_reference).first()

        if facility:
            if facility.photo:
                logger.info(f"📸 로컬 이미지 반환: {photo_reference}")
                return FileResponse(facility.photo.open('rb'), content_type='image/jpeg')
            else:
                logger.info(f"📦 DB에는 있지만 이미지 없음: {photo_reference}")
                return JsonResponse({'error': 'DB에 등록된 시설이지만 이미지가 없습니다'}, status=404)

        # 🌐 2. Google API 요청 (DB에 없을 경우만)
        logger.info(f"🌐 Google API 요청 시작: {photo_reference}")

        GOOGLE_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
        url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference={photo_reference}&key={GOOGLE_API_KEY}"
        response = requests.get(url, allow_redirects=True)

        if response.status_code == 200:
            facility = NearbyFacility.objects.create(photo_reference=photo_reference)
            filename = f"{photo_reference[:30]}.jpg"
            facility.photo.save(filename, ContentFile(response.content), save=True)
            logger.info(f"✅ Google 이미지 저장 성공: {photo_reference}")
            return FileResponse(facility.photo.open('rb'), content_type='image/jpeg')
        else:
            logger.warning(f"❌ Google API 실패 ({response.status_code}): {photo_reference}")
            return JsonResponse({'error': f'Google API status {response.status_code}'}, status=502)

    except Exception as e:
        import traceback
        traceback.print_exc()
        logger.exception(f"🔥 예외 발생: {photo_reference} - {str(e)}")
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
    if request.method != 'POST':
        return JsonResponse({'error': 'POST 요청만 허용됩니다'}, status=405)

    try:
        body = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'JSON 파싱 실패'}, status=400)

    station_name = body.get('station_name')
    if not station_name:
        return JsonResponse({'error': 'station_name 누락'}, status=400)

    try:
        station = StationInfo.objects.filter(japanese=station_name).first()
    except StationInfo.DoesNotExist:
        return JsonResponse({'error': 'Station not found'}, status=404)

    # 위도 경도 없으면 API로 채우기
    if not station.lat or not station.lng:
        lat, lng = get_lat_lng_from_station_name(station.japanese)
        if not lat or not lng:
            return JsonResponse({'error': '위치 정보를 찾을 수 없습니다'}, status=404)
        station.lat = lat
        station.lng = lng
        station.save()

    # 🔍 시설 DB에 없으면 API 호출해서 생성
    facilities = NearbyFacility.objects.filter(station=station).order_by('-rating')
    logger.info(facilities)
    if not facilities.exists():
        logger.info("🆕 DB에 시설 없음 → Google API에서 가져옵니다")
        get_nearby_facilities_from_google(station)  # 위도/경도 필요하므로 station은 lat/lng 있음

    # 🔁 다시 불러오기
    facilities = NearbyFacility.objects.filter(station=station).order_by('-rating')[:5]
    facilities_data = []

    for f in facilities:
        photo_url = None
        if f.photo_reference:
            safe_filename = f.name[:30].replace(' ', '_') + ".jpg"
            file_path = os.path.join(settings.MEDIA_ROOT, 'facility_photos', safe_filename)
            logger.info(file_path)
            if not f.photo or not os.path.exists(file_path):
                api_key = os.getenv('GOOGLE_PLACES_API_KEY')
                photo_api_url = (
                    f"https://maps.googleapis.com/maps/api/place/photo"
                    f"?maxwidth=400"
                    f"&photo_reference={f.photo_reference}"
                    f"&key={api_key}"
                )
                response = requests.get(photo_api_url)
                if response.status_code == 200:
                    os.makedirs(os.path.dirname(file_path), exist_ok=True)
                    with open(file_path, 'wb') as img_file:
                        img_file.write(response.content)
                    f.photo.name = f"facility_photos/{safe_filename}"
                    f.save()
                    logger.info(f"📷 저장됨: {f.name}")
                else:
                    logger.warning(f"❌ 사진 다운로드 실패: {f.name}")

            if f.photo:
                photo_url = f.photo.url

        facilities_data.append({
            'name': f.name,
            'address': f.address,
            'rating': f.rating,
            'photo_reference': f.photo_reference,
            'photo_url': photo_url,
        })

    logger.info(f"📦 시설 {len(facilities_data)}개 반환")
    return JsonResponse({'facilities': facilities_data})

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