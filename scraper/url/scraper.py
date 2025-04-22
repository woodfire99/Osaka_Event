import psycopg2
from bs4 import BeautifulSoup
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

# DB 연결
conn = psycopg2.connect(
    host="db",              # docker-compose의 서비스 이름
    dbname="osaka_db",
    user="osaka_user",
    password="osaka_pw",
    port="5432"
)
cur = conn.cursor()

# 테이블 생성 + 컬럼 추가
cur.execute("""
    CREATE TABLE IF NOT EXISTS myapp_event (
        id SERIAL PRIMARY KEY,
        url TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_scraped BOOLEAN DEFAULT FALSE
    );
""")

# 기존 데이터 전체 삭제 (덮어쓰기 방식)
cur.execute("TRUNCATE TABLE myapp_event;")
conn.commit()

# 크롬 설정
options = uc.ChromeOptions()
options.add_argument("--headless=new")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")

driver = uc.Chrome(options=options)

base_url = "https://en.japantravel.com/events/osaka?type=event&p={}"
all_links = set()

for page in range(1, 8):
    driver.get(base_url.format(page))
    try:
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CLASS_NAME, "article-list-image"))
        )
        print(f"✅ {page} 페이지 - 요소 발견됨")
    except:
        print(f"❌ {page} 페이지 - 요소 없음")
        continue

    soup = BeautifulSoup(driver.page_source, "html.parser")
    links = soup.select('a.article-list-image')

    for link in links:
        href = link.get("href")
        if href:
            full_url = "https://en.japantravel.com" + href
            all_links.add(full_url)

driver.quit()

# DB 저장
for url in sorted(all_links):
    try:
        cur.execute(
            """
            INSERT INTO myapp_event (url, created_at, is_scraped)
            VALUES (%s, NOW(), FALSE)
            ON CONFLICT (url) DO NOTHING;
            """,
            (url,)
        )
        print(f"저장됨: {url}")
    except Exception as e:
        print(f"❌ 저장 실패: {url} - {e}")

conn.commit()
cur.close()
conn.close()
