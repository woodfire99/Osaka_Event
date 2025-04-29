from openai import OpenAI
import psycopg2
import csv
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
    SELECT id, japanese, english, korean, station_code, ai_summary
    FROM myapp_stationinfo
    WHERE ai_summary IS NULL
    ORDER BY id
""")
stations = cur.fetchall()

# ChatGPT 호출 + ai_summary 생성

for id, japanese, english, korean, station_code, ai_summary in stations[:30]:

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
    # 최종 ai_summary 조립
    final_summary = f"""[주변 분위기]

{mood_summary}
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


# with open("ex-data.csv", newline='', encoding="utf-8-sig") as f:
#     reader = csv.DictReader(f)  # 'Number', 'Data' 컬럼 읽기
#     for row in reader:
#         station_id = int(row['Number'])    # Number를 id로 사용
#         ai_summary = row['Data'].strip()   # Data 내용을 가져옴

#         # DB 업데이트
#         cur.execute(
#             """
#             UPDATE myapp_stationinfo
#             SET ai_summary = %s
#             WHERE id = %s
#             """,
#             (ai_summary, station_id)
#         )
#         print(f"id={station_id} 업데이트 완료.")




conn.commit()  
cur.close()
conn.close()
