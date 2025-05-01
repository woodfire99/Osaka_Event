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
以下の情報に基づいて、「{station_name}駅」（緯度: {lat}, 経度: {lng}）周辺に以下の特徴があるかどうかを評価してください。
各項目について「はい」または「いいえ」で慎重に答えてください。曖昧な場合は「いいえ」としてください。

1. 公園が近い
2. 商店街がある
3. スーパーが多い
4. 治安が良い

以下のJSON形式で答えてください：
{{
  "near_park": true,
  "shopping_street": false,
  "supermarket_dense": false,
  "safe": true
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
    stations = StationInfo.objects.filter().order_by("number")

    for station in stations:
        time.sleep(1)
        result = ask_gpt(station)
        logger.info(result)
        if result:
            StationInfo.objects.filter(id=station.id).update(
                near_park=result.get("near_park", False),
                shopping_street=result.get("shopping_street", False),
                supermarket_dense=result.get("supermarket_dense", False),
                safe=result.get("safe", False)
            )
            print(f"✅ 저장 완료: {station.number} + {station.japanese}")
        else:
            print(f"⚠️ 건너뜀: {station.japanese}")

if __name__ == "__main__":
    run()
