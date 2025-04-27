FROM python:3.10-slim

# 기본 패키지 설치
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉터리 설정
WORKDIR /app

# requirements 설치
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 코드 복사
COPY . .

CMD ["python", "update_event_geo.py"]
