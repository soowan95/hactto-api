#!/bin/bash
# Nginx를 이용한 Blue/Green 무중단 배포 스크립트

APP_DIR="/home/ubuntu/hactto-api"
NGINX_INC_FILE="/etc/nginx/conf.d/service-url.inc"

cd $APP_DIR

# 현재 구동 중인 컨테이너 확인 (api-blue가 떠있는지 확인)
EXIST_BLUE=$(docker ps -f "name=hactto-api-blue" -f "status=running" -q)

if [ -z "$EXIST_BLUE" ]; then
    echo "Currently running: GREEN. Deploying to BLUE (Port 8080)..."
    TARGET_COLOR="blue"
    TARGET_PORT=8080
    CURRENT_COLOR="green"
else
    echo "Currently running: BLUE. Deploying to GREEN (Port 8081)..."
    TARGET_COLOR="green"
    TARGET_PORT=8081
    CURRENT_COLOR="blue"
fi

echo "1. Pulling latest image..."
docker compose pull api-${TARGET_COLOR}

echo "2. Starting ${TARGET_COLOR} container..."
docker compose up -d api-${TARGET_COLOR}

echo "3. Health Check for ${TARGET_COLOR}..."
HEALTH_CHECK_PASSED=false
for count in {1..15}
do
    echo "Checking health... ($count/15)"
    # 컨테이너가 켜졌는지 단순 포트 응답 대기 (NestJS 부팅 시간 고려)
    if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${TARGET_PORT}/ | grep -q '404\|200\|403'; then
        echo "Health check passed!"
        HEALTH_CHECK_PASSED=true
        break
    fi
    sleep 3
done

if [ "$HEALTH_CHECK_PASSED" = false ]; then
    echo "Health check failed. Aborting deployment."
    echo "Stopping failed ${TARGET_COLOR} container..."
    docker compose stop api-${TARGET_COLOR}
    docker compose rm -f api-${TARGET_COLOR}
    exit 1
fi

echo "4. Switching Nginx upstream to ${TARGET_COLOR}..."
echo "set \$service_url http://127.0.0.1:${TARGET_PORT};" | sudo tee $NGINX_INC_FILE

echo "5. Reloading Nginx..."
sudo systemctl reload nginx

echo "6. Stopping old container (${CURRENT_COLOR})..."
docker compose stop api-${CURRENT_COLOR}
docker compose rm -f api-${CURRENT_COLOR}

echo "Deployment to ${TARGET_COLOR} completed successfully!"
