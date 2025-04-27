from openai import OpenAI
import psycopg2
import os
from dotenv import load_dotenv
import time

load_dotenv()

# OpenAI 세팅
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# PostgreSQL 연결
conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    port=os.getenv("DB_PORT")
)
cur = conn.cursor()

# 역 데이터 불러오기
cur.execute("""
    SELECT id, japanese, english, korean, station_code
    FROM myapp_stationinfo
""")
stations = cur.fetchall()

# ChatGPT 호출 + ai_summary 생성
for id, japanese, english, korean, station_code in stations[56:]:
    # 한국어 역 이름
    station_name_with_eki = f"{korean}역"

    # 주변 분위기 설명 요청
    response_mood = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": f"""
오사카시에 있는 {station_name_with_eki}({japanese}駅) 주변 지역의 분위기를 500자 정도 한국어로 자연스럽게 설명해줘.
"""
            }
        ]
    )
    mood_summary = response_mood.choices[0].message.content.strip()
    time.sleep(20)
    # 주변 주요 시설 리스트업 요청
    response_facilities = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "user",
                "content": f"""
오사카시에 위치한 {station_name_with_eki}({japanese}駅) 주변의 주요 시설, 학교, 병원, 쇼핑시설 등을 5개 정도 한국어로 리스트업 해줘.
답변에서도 역 이름은 반드시 {station_name_with_eki}로 표현해줘.
"""
            }
        ]
    )
    facility_summary = response_facilities.choices[0].message.content.strip()
    time.sleep(20)
    # 최종 ai_summary 조립
    final_summary = f"""[주변 분위기]

{mood_summary}

[주변 주요 시설]

{facility_summary}

[지난 3년 월세 평균]

(데이터 준비 중입니다.)
"""

    print(id, final_summary)
    cur.execute(
        """
        UPDATE myapp_stationinfo
        SET ai_summary = %s
        WHERE id = %s
        """,
        (final_summary, id)
    )
conn.commit()  # DB 저장까지 하고 싶으면 이거 활성화
cur.close()
conn.close()
