from rest_framework.generics import ListAPIView
from .models import EventDetail
from .serializers import EventDetailSerializer

class EventDetailListView(ListAPIView):
    queryset = EventDetail.objects.all().order_by('-saved_at')
    serializer_class = EventDetailSerializer
