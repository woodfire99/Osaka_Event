from rest_framework.generics import ListAPIView
from .models import EventDetail
from .models import StationInfo
from .serializers import EventDetailSerializer
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

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



# @csrf_exempt
# def receive_idx(request):
#     if request.method == 'POST':
#         body = json.loads(request.body)
#         idx = body.get('idx')  # 여기서 받은 idx 꺼내기
#         print(f"받은 idx: {idx}")

#         # 필요한 로직 추가 (DB에서 역 찾기, 저장하기 등)

#         return JsonResponse({'message': f'받은 idx: {idx}'})
#     else:
#         return JsonResponse({'error': 'POST 요청만 지원합니다.'}, status=400)


class EventDetailListView(ListAPIView):
    queryset = EventDetail.objects.all().order_by('-saved_at')
    serializer_class = EventDetailSerializer


