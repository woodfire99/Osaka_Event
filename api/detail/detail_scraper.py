import psycopg2
import os
from bs4 import BeautifulSoup
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

# DB 연결 (외부 볼륨 ./pgdata 를 사용하는 PostgreSQL 컨테이너에 저장)
conn = psycopg2.connect(
    host=os.getenv("DB_HOST"),
    dbname=os.getenv("DB_NAME"),
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    port=os.getenv("DB_PORT")
)
cur = conn.cursor()

# 크롬 설정
options = uc.ChromeOptions()
options.add_argument("--headless=new")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
driver = uc.Chrome(options=options)

# 테이블 생성 (최초 실행 시)
cur.execute("""
CREATE TABLE IF NOT EXISTS event_details (
    id SERIAL PRIMARY KEY,
    url TEXT UNIQUE,
    title TEXT,
    location TEXT,
    date TEXT,
    image TEXT,
    content TEXT,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
""")
conn.commit()

# 아직 크롤링되지 않은 링크 조회
cur.execute("SELECT url FROM myapp_event WHERE is_scraped = FALSE;")
rows = cur.fetchall()
urls = [row[0] for row in rows]

for url in urls:
    try:
        driver.get(url)
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "h1"))
        )
        soup = BeautifulSoup(driver.page_source, "html.parser")

        title = soup.select_one("h1.title").text.strip() if soup.select_one("h1.title") else None
        location = soup.select_one(".venue-name").text.strip() if soup.select_one(".venue-name") else None
        date = soup.select_one(".event-time-overview").text.strip() if soup.select_one(".event-time-overview") else None

        # 대표 이미지
        image_tag = soup.select_one("img.cover") or soup.select_one(".article__content img")
        image = image_tag.get("src") if image_tag else None

        # 본문 내용 (p 태그 여러 개 합치기)
        paragraphs = soup.select(".article__content p")
        content = "\n".join([p.text.strip() for p in paragraphs]) if paragraphs else None

        print(f"✅ 저장: {title} | {date} | {location}")

        cur.execute("""
            INSERT INTO event_details (url, title, location, date, image, content)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (url) DO NOTHING;
        """, (url, title, location, date, image, content))

        cur.execute("UPDATE myapp_event SET is_scraped = TRUE WHERE url = %s;", (url,))
        conn.commit()

    except Exception as e:
        print(f"❌ 실패: {url} - {e}")
        conn.rollback()

# 마무리
cur.close()
conn.close()
driver.quit()
