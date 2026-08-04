#!/bin/bash
set -e

echo "=== Hactto Migration Script (RDS & S3 -> Local EC2) ==="

# 1. AWS S3 파일 다운로드
S3_BUCKET="hactto-board-attachments" # 기존 S3 버킷 이름
LOCAL_DIR="/var/hactto/attachments"

echo "1. S3 버킷에서 로컬 디렉토리로 파일 마이그레이션 중..."
sudo mkdir -p $LOCAL_DIR
sudo chown -R $USER:$USER $LOCAL_DIR
# AWS CLI가 설치되어 있고 자격 증명이 구성되어 있어야 합니다.
aws s3 sync s3://$S3_BUCKET $LOCAL_DIR

echo "S3 동기화 완료."

# 2. RDS 데이터베이스 백업 및 로컬 복원
RDS_HOST="your-rds-endpoint.amazonaws.com"
RDS_USER="ht_user"
RDS_PASS="your_rds_password"
DB_NAME="ht_db"

LOCAL_DB_USER="ht_user"
LOCAL_DB_PASS="user_password_placeholder"
LOCAL_DB_HOST="127.0.0.1"
LOCAL_DB_PORT="3306"

DUMP_FILE="rds_backup.sql"

echo "2. RDS 데이터베이스 덤프(백업) 중..."
mysqldump -h $RDS_HOST -u $RDS_USER -p$RDS_PASS $DB_NAME > $DUMP_FILE

echo "3. 로컬 MariaDB에 덤프 파일 복원 중..."
# 로컬 Docker 컨테이너의 MariaDB가 실행 중이어야 합니다 (docker-compose up -d mysql)
mysql -h $LOCAL_DB_HOST -P $LOCAL_DB_PORT -u $LOCAL_DB_USER -p$LOCAL_DB_PASS $DB_NAME < $DUMP_FILE

echo "복원 완료! 덤프 파일을 삭제합니다."
rm $DUMP_FILE

echo "=== 마이그레이션 완료 ==="
echo "이제 백엔드 API 컨테이너를 재시작하세요: docker-compose up -d --build"
