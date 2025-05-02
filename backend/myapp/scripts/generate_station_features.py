import os
import time
import json
import django
from openai import OpenAI
from django.conf import settings
from myapp.models import StationInfo
from dotenv import load_dotenv
import logging


load_dotenv()
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "your_project.settings")
django.setup()
logger = logging.getLogger(__name__)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

PROMPT_TEMPLATE = """
以下の情報に基づいて、「{station_name}駅」（緯度: {lat}, 経度: {lng}）周辺に以下の特徴があるかを判断してください。
駅周辺の地域（住宅街・商業地など）を想像しても構いませんが、**駅名や位置情報だけで明確に推測できない場合は false としてください。**

✔️ 判定基準:
- 「公園が近い」→ 駅から徒歩5分圏内に公園があると明確に推測できる場合のみ true
- 「商店街がある」→ 商業施設や商店街が集まる地域であると明確にわかる場合のみ true
- 「スーパーが多い」→ 周辺に複数のスーパーが存在すると推測できる場合のみ true
- 「治安が良い」→ 住宅地であり、繁華が落ち着いた地域と判断できる場合のみ true

以下の JSON 形式でのみ出力してください：

{{
  "near_park": false,
  "shopping_street": false,
  "supermarket_dense": false,
  "safe": false
}}
"""



def ask_gpt(station):
    prompt = PROMPT_TEMPLATE.format(station_name=station.japanese, lat=station.lat, lng=station.lng)

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "あなたは都市情報に詳しいアシスタントです。"},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
        )
        content = response.choices[0].message.content.strip()
        print(f"\n📍 {station.japanese}:\n{content}\n")
        return json.loads(content)

    except Exception as e:
        print(f"❌ {station.japanese} GPT 오류: {e}")
        return None

def run():
    # problematic_numbers = [
    #     18, 42, 43, 52, 81, 121, 137, 138, 139, 149,
    #     151, 152, 154, 157, 161, 177, 179, 180, 183, 189
    # ]

    stations = StationInfo.objects.filter(
        # number__in=problematic_numbers,
    ).order_by("number")

    logger.info(len(stations))
    for station in stations:
        logger.info({
            'id': station.id,
            'japanese': station.japanese,
            'lat': station.lat,
            'lng': station.lng,
            'near_park': station.near_park,
            'shopping_street': station.shopping_street,
            'supermarket_dense': station.supermarket_dense,
            'safe': station.safe,
        })

    #     StationInfo.objects.filter(id=station.id).update(
    #         safe=False
    #     )


        # time.sleep(1)
        # result = ask_gpt(station)
        # logger.info(result)
        # if result:
        #     StationInfo.objects.filter(id=station.id).update(
        #         near_park=result.get("near_park", False),
        #         shopping_street=result.get("shopping_street", False),
        #         supermarket_dense=result.get("supermarket_dense", False),
        #         safe=result.get("safe", False)
        #     )
        #     print(f"✅ 저장 완료: {station.number} + {station.japanese}")
        # else:
        #     print(f"⚠️ 건너뜀: {station.japanese}")

if __name__ == "__main__":
    run()
