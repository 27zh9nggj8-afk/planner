#!/bin/bash
# 학점은행 플래너 실행 스크립트 (더블클릭용)
cd "$(dirname "$0")"
PORT=8000
# 이미 실행 중이면 브라우저만 열기
if lsof -i :$PORT > /dev/null 2>&1; then
  open "http://localhost:$PORT"
  exit 0
fi
open "http://localhost:$PORT" &
sleep 1
echo "학점은행 플래너 실행 중 — 이 창을 닫으면 앱이 꺼져요."
echo "브라우저에서 http://localhost:$PORT 로 접속됩니다."
python3 -m http.server $PORT
