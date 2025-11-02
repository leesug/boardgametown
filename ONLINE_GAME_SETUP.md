# 🎮 그레이트 킹덤 온라인 대전 시스템 설치 가이드

## 📋 목차
1. [Supabase 테이블 설정](#1-supabase-테이블-설정)
2. [테스트 방법](#2-테스트-방법)
3. [주요 기능](#3-주요-기능)
4. [문제 해결](#4-문제-해결)

---

## 1. Supabase 테이블 설정

### 단계 1-1: Supabase 대시보드 접속
1. https://supabase.com/dashboard 접속
2. `boardgametown` 프로젝트 클릭

### 단계 1-2: SQL 실행
1. 좌측 메뉴 → **SQL Editor** 클릭
2. **New query** 버튼 클릭
3. `supabase-online-game.sql` 파일 열기
4. 전체 내용 복사 (Ctrl+A, Ctrl+C)
5. SQL Editor에 붙여넣기 (Ctrl+V)
6. **Run** 버튼 클릭 (또는 Ctrl+Enter)

### 단계 1-3: 성공 확인
✅ 다음 메시지가 표시되면 성공!
```
온라인 대전 시스템 테이블이 성공적으로 생성되었습니다!
- waiting_room: 대기방
- game_rooms: 게임 방
- game_moves: 게임 이동 로그
```

### 단계 1-4: 테이블 확인
1. 좌측 메뉴 → **Table Editor** 클릭
2. 3개의 테이블이 보여야 함:
   - `waiting_room` - 매칭 대기 중인 플레이어
   - `game_rooms` - 생성된 게임 방
   - `game_moves` - 게임 이동 기록

---

## 2. 테스트 방법

### 테스트 2-1: 브라우저 2개로 테스트

#### 브라우저 1 (플레이어 1)
1. **great-kingdom.html** 파일을 브라우저로 열기
2. **🌐 온라인 대전** 버튼 클릭
3. 플레이어 이름 입력 (예: "플레이어1")
4. 대기 화면 표시됨

#### 브라우저 2 (플레이어 2)
1. **새 브라우저 창** 또는 **시크릿 모드**로 같은 파일 열기
2. **🌐 온라인 대전** 버튼 클릭
3. 플레이어 이름 입력 (예: "플레이어2")
4. **✅ 매칭 성공!** 메시지 표시

#### 게임 시작
- 양쪽 브라우저에서 게임이 시작됨
- 플레이어 1: 🔵 파란색 (선공)
- 플레이어 2: 🟠 주황색 (후공)
- 차례대로 말을 놓으면 실시간으로 동기화됨!

### 테스트 2-2: 승리 세레모니 확인

게임을 진행하여 상대 말을 잡으면:
1. 🏆 **화려한 승리 모달** 표시
2. 🎆 **폭죽 효과** (150개의 색색깔 confetti)
3. 🎇 **불꽃놀이 효과** (5번 연속 폭발)
4. ✨ **금색 그라데이션 텍스트** 애니메이션
5. 💫 **글로우 효과** (2초마다 반짝임)

---

## 3. 주요 기능

### 3-1. 실시간 매칭 시스템
- ⏱️ **빠른 매칭**: 평균 3초 이내
- 🔄 **자동 매칭**: 대기 중인 플레이어 자동 연결
- 🚪 **대기방 UI**: 깔끔한 대기 화면 제공
- ❌ **취소 가능**: 언제든지 매칭 취소 가능

### 3-2. 실시간 게임 동기화
- 🎮 **즉시 반영**: 상대 수가 1초 이내 반영
- 🎯 **턴 관리**: 자동 턴 전환 및 표시
- 🔒 **턴 잠금**: 상대 턴에는 클릭 불가
- 📊 **실시간 상태**: 온라인 상태 실시간 표시
- ⏱️ **10초 시간제한**: 턴당 10초 제한, 초과 시 자동 패스

### 3-3. 화려한 승리 세레모니
- 🎉 **150개 폭죽**: 무지개 색상의 confetti
- 🎆 **불꽃놀이**: 5번 연속 폭발 효과
- ✨ **금색 텍스트**: 그라데이션 애니메이션
- 💫 **글로우 효과**: 반짝이는 승리 모달
- 🏆 **트로피 아이콘**: 회전하며 등장

### 3-4. 기타 기능
- 👥 **로컬 2인 모드**: 한 화면에서 2명이 플레이
- 🤖 **AI 대전**: 18단계 난이도 (9급 ~ 9단)
- 💾 **자동 저장**: 게임 기록 자동 저장
- 📱 **모바일 지원**: 반응형 디자인

---

## 4. 문제 해결

### 문제 4-1: 매칭이 안 됨
**증상**: 대기 화면에서 계속 로딩만 됨

**해결방법**:
1. Supabase 테이블이 생성되었는지 확인
   ```sql
   SELECT * FROM waiting_room;
   ```
2. F12 → Console 탭에서 오류 확인
3. SQL 스크립트를 다시 실행

### 문제 4-2: "Failed to fetch" 오류
**원인**: Supabase API 연결 실패

**해결방법**:
1. [great-kingdom.html:756-757](great-kingdom.html#L756-L757) 확인:
   ```javascript
   const SUPABASE_URL = 'https://hoszcmgjmjjximzxdfuk.supabase.co';
   const SUPABASE_KEY = 'eyJhbGci...';
   ```
2. URL과 KEY가 올바른지 확인
3. Supabase 프로젝트가 활성화되어 있는지 확인

### 문제 4-3: 게임이 동기화되지 않음
**증상**: 상대 수가 반영되지 않음

**해결방법**:
1. F12 → Console 탭 확인
2. 네트워크 연결 상태 확인
3. 브라우저 캐시 삭제 (Ctrl+Shift+Delete)
4. 페이지 새로고침 (Ctrl+F5)

### 문제 4-4: 세레모니 효과가 안 보임
**증상**: 승리 시 폭죽이나 불꽃놀이가 없음

**해결방법**:
1. 브라우저 하드웨어 가속 확인
   - Chrome: 설정 → 시스템 → "하드웨어 가속 사용" 체크
2. CSS 애니메이션 지원 확인
3. 다른 브라우저에서 테스트 (Chrome 권장)

### 문제 4-5: 대기방에서 멈춤
**증상**: 매칭 후 게임이 시작되지 않음

**해결방법**:
1. 양쪽 브라우저 모두 새로고침
2. Supabase 테이블 초기화:
   ```sql
   DELETE FROM waiting_room;
   DELETE FROM game_rooms;
   DELETE FROM game_moves;
   ```
3. 다시 매칭 시도

---

## 📊 Supabase 데이터 확인

### 현재 대기 중인 플레이어
```sql
SELECT * FROM waiting_room
WHERE status = 'waiting'
ORDER BY created_at ASC;
```

### 진행 중인 게임
```sql
SELECT * FROM game_rooms
WHERE status = 'active'
ORDER BY created_at DESC;
```

### 최근 게임 이동 기록
```sql
SELECT
  gr.room_code,
  gr.player1_name,
  gr.player2_name,
  gm.move_type,
  gm.row_pos,
  gm.col_pos,
  gm.created_at
FROM game_moves gm
JOIN game_rooms gr ON gm.room_code = gr.room_code
ORDER BY gm.created_at DESC
LIMIT 20;
```

### 게임 통계
```sql
SELECT
  status,
  COUNT(*) as game_count,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_duration_seconds
FROM game_rooms
GROUP BY status;
```

---

## 🎯 성능 최적화 팁

### 1. 폴링 주기 조정
기본값: 1초마다 확인
```javascript
// js/online-matchmaking.js:145
this.movePollingInterval = setInterval(async () => {
    await this.checkForNewMoves();
}, 1000); // 1000ms = 1초
```

**빠르게**: 500ms로 변경 (더 즉각적, 서버 부하 증가)
**느리게**: 2000ms로 변경 (서버 부하 감소, 지연 증가)

### 2. 세레모니 효과 조정
폭죽 개수 조정:
```javascript
// great-kingdom.html:1587
for (let i = 0; i < 150; i++) {  // 150개 → 100개로 줄이기
```

불꽃놀이 횟수 조정:
```javascript
// great-kingdom.html:1607
for (let i = 0; i < 5; i++) {  // 5번 → 3번으로 줄이기
```

---

## 💡 추가 개선 아이디어

1. **채팅 기능**: 게임 중 간단한 메시지 전송
2. **랭킹 시스템**: 승률 기록 및 순위표
3. **친구 대전**: 방 코드로 특정 친구와 매칭
4. **관전 모드**: 다른 사람 게임 관전
5. **재대결 기능**: 같은 상대와 바로 재대결

---

## ✅ 체크리스트

설정이 완료되었나요? 다음을 확인하세요:

- [ ] Supabase SQL 스크립트 실행 완료
- [ ] Table Editor에서 테이블 3개 확인
- [ ] great-kingdom.html에 Supabase URL/KEY 입력
- [ ] 브라우저 2개로 매칭 테스트 완료
- [ ] 실시간 동기화 작동 확인
- [ ] 승리 세레모니 효과 확인 (폭죽, 불꽃놀이)
- [ ] F12 Console에 오류 없음 확인

모든 항목이 체크되었다면 완료! 🎉

---

## 📞 도움이 필요하신가요?

- Supabase 공식 문서: https://supabase.com/docs
- 문제가 계속되면 F12 → Console의 오류 메시지를 확인하세요
