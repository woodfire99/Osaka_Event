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
from .models import NearbyFacility, BikeDuration, TransitDuration
import requests
import os
from openai import OpenAI

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

def clean_summary(summary):
    if "[주변 주요 시설]" in summary:
        return summary.split("[주변 주요 시설]")[0].strip()
    return summary.strip()


def make_station_prompt(candidates, features, routes):
    prompt = "당신은 역 추천 도우미입니다.\n\n"
    prompt += "사용자가 원하는 조건은 다음과 같습니다:\n"
    prompt += f"- 특징: {', '.join(features) if features else '선택 안됨'}\n"
    if routes:
        for r in routes:
            dest = r.get("destination")
            mode = r.get("transport")
            time = r.get("distance")
            if dest and mode and time:
                prompt += f"- {dest}까지 {mode}로 {time}분 이내\n"
    prompt += "\n아래는 후보 역과 설명입니다:\n"

    for i, pair in enumerate(candidates, 1):
        s, _ = pair
        summary = clean_summary(s.ai_summary or "정보 없음")
        prompt += f"{i}. {s.japanese} ({s.english}): {summary}\n"

    prompt += "\n이 중 사용자 조건에 가장 잘 맞는 5개 역을 골라주세요.\n"
    prompt += "⚠️ 단, 위의 조건(특징/거리 등)을 하나라도 만족하지 않는 역은 절대 포함하지 마세요.\n"
    prompt += "형식: - 역명 (영문명): 한 줄 이유\n"
    return prompt


def parse_gpt_response(response_text, rent_lookup):
    results = []
    for line in response_text.split('\n'):
        match = re.match(r"^- (.+?) \((.+?)\): (.+)$", line.strip())
        if match:
            japanese, english, reason = match.groups()
            rent_price = rent_lookup.get(japanese, "비공개")
            results.append({
                'japanese': japanese,
                'english': english,
                'ai_summary': reason,
                'rent': rent_price,
                'tags': [],
            })
    return results

def filter_by_routes(candidates, routes):
    if len(routes) <= 0:
        return candidates, {}  # 조건 없으면 그대로

    filtered = []
    route_lookup = {}

    for station, rent in candidates:
        valid = True
        station_lookup = {}

        for route in routes:
            hub_en = route.get("destination")
            hub_jp = HUB_MAP.get(hub_en)
            mode = route.get("transport")
            max_min = int(route.get("distance"))

            if not hub_jp:
                continue  # 허브 변환 실패 → 무시

            if mode == "bike":
                d = BikeDuration.objects.filter(station=station.japanese, hub=hub_jp).first()
            else:
                d = TransitDuration.objects.filter(station=station.japanese, hub=hub_jp).first()

            # 시간 기록용
            station_lookup[hub_jp] = d.duration_min if d else None

            if not d or d.duration_min is None or d.duration_min > max_min:
                valid = False
                break

        if valid:
            filtered.append((station, rent))
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
            candidates.append((s, rent_match))
            rent_lookup[s.japanese] = rent_match.rent_price

    return candidates, rent_lookup

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
        logger.info(routes)
        
        # 1. mood filter
        stations = StationInfo.objects.filter(mood__contains=[mood])
        logger.info(len(stations))
        # 2. rent filter
        candidates, rent_lookup = filter_by_rent(stations, room_size, rent_limit)
        logger.info(len(candidates))
        # 3. route filter
        candidates, route_lookup = filter_by_routes(candidates, routes)
        logger.info(len(candidates))


        # 10개로 줄이기
        candidates = candidates[:10]

        if not candidates:
            return JsonResponse({
                'results': [],
                'route_time': route_lookup,
                'message': '조건에 맞는 역이 없습니다.'
            })

        # prompt = make_station_prompt(candidates, features, routes)

        # response = client.chat.completions.create(
        #     model="gpt-3.5-turbo",
        #     messages=[
        #         {"role": "system", "content": "역 추천 전문가입니다."},
        #         {"role": "user", "content": prompt},
        #     ],
        #     temperature=0.3,
        # )

        # content = response.choices[0].message.content.strip()
        # parsed = parse_gpt_response(content, rent_lookup)

        return JsonResponse()

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
        station_name = body.get('station_name')

        if not station_name:
            return JsonResponse({'error': 'station_name 누락'}, status=400)

        try:
            station = StationInfo.objects.get(japanese=station_name)
        except StationInfo.DoesNotExist:
            return JsonResponse({'error': 'Station not found'}, status=404)

        # 좌표가 없는 경우 → Google에서 좌표 가져오기
        if station.lat is None or station.lng is None:
            lat, lng = get_lat_lng_from_station_name(station.japanese)
            if lat is None or lng is None:
                return JsonResponse({'error': '위치 정보를 찾을 수 없습니다'}, status=404)
            station.lat = lat
            station.lng = lng
            station.save()

        lat, lng = station.lat, station.lng

        # 1. DB에 있는 시설 우선 반환
        facilities = NearbyFacility.objects.filter(station=station).order_by('-rating')[:5]
        if facilities.exists():
            facilities_data = [
                {
                    'name': f.name,
                    'address': f.address,
                    'rating': f.rating,
                    'photo_reference': f.photo_reference,
                }
                for f in facilities
            ]
            logger.info(f"📦 DB에서 시설 {len(facilities)}개 반환")
            return JsonResponse({'facilities': facilities_data})

        # 2. Google Places API 호출
        logger.info("🌐 DB에 없으므로 Places API 요청 시작")
        GOOGLE_API_KEY = os.getenv('GOOGLE_PLACES_API_KEY')
        url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat},{lng}&radius=1000&type=tourist_attraction&key={GOOGLE_API_KEY}"
        response = requests.get(url)

        if response.status_code != 200:
            logger.warning(f"❌ Places API 실패: {response.status_code} - {response.text}")
            return JsonResponse({'error': 'Google Places API 호출 실패'}, status=502)

        places = response.json().get('results', [])
        saved_facilities = []

        for place in places:
            name = place.get('name')
            address = place.get('vicinity')
            rating = place.get('rating', 0.0)
            photo_ref = None
            photo_file = None

            # 중복된 photo_reference가 있으면 skip
            if place.get('photos'):
                photo_ref = place['photos'][0].get('photo_reference')
                if photo_ref:
                    if NearbyFacility.objects.filter(photo_reference=photo_ref).exists():
                        logger.info(f"⚠️ 중복 photo_reference 스킵: {photo_ref}")
                        continue

                    # 이미지 다운로드
                    photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference={photo_ref}&key={GOOGLE_API_KEY}"
                    img_response = requests.get(photo_url)
                    if img_response.status_code == 200:
                        filename = f"{name[:30].replace(' ', '_')}.jpg"
                        photo_file = ContentFile(img_response.content, name=filename)
                    else:
                        logger.warning(f"❌ 이미지 다운로드 실패: {photo_ref} - {img_response.status_code}")

            # DB에 저장
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

        logger.info(f"✅ 새 시설 {len(saved_facilities)}개 저장 완료")
        return JsonResponse({'facilities': saved_facilities})

    except Exception as e:
        logger.exception(f"🔥 예외 발생: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

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


