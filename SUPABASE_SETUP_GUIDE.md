# 🚀 Supabase 방문자 추적 설정 가이드

이 가이드는 초보자도 쉽게 따라할 수 있도록 작성되었습니다.

## 📋 목차
1. [Supabase 계정 만들기](#1-supabase-계정-만들기)
2. [프로젝트 생성](#2-프로젝트-생성)
3. [데이터베이스 테이블 만들기](#3-데이터베이스-테이블-만들기)
4. [API 키 가져오기](#4-api-키-가져오기)
5. [웹사이트에 적용하기](#5-웹사이트에-적용하기)
6. [테스트 방법](#6-테스트-방법)
7. [문제 해결](#7-문제-해결)

---

## 1. Supabase 계정 만들기

### 단계 1-1: 웹사이트 방문
1. 브라우저에서 https://supabase.com 접속
2. 우측 상단의 **"Start your project"** 버튼 클릭

### 단계 1-2: 가입하기
1. **"Continue with GitHub"** 클릭 (가장 쉬운 방법)
2. GitHub 계정으로 로그인
3. Supabase 권한 승인

> 💡 **팁**: GitHub 계정이 없다면 먼저 https://github.com 에서 무료로 만드세요!

---

## 2. 프로젝트 생성

### 단계 2-1: 새 프로젝트 만들기
1. 대시보드에서 **"New Project"** 클릭
2. Organization 선택 (기본값 사용)

### 단계 2-2: 프로젝트 정보 입력

| 항목 | 입력 값 | 설명 |
|------|---------|------|
| **Name** | `boardgametown` | 프로젝트 이름 (원하는 대로) |
| **Database Password** | 강력한 비밀번호 | **⚠️ 꼭 메모해두세요!** |
| **Region** | `Northeast Asia (Seoul)` | 한국과 가까운 서버 |
| **Pricing Plan** | `Free` | 무료 플랜 (월 500MB 무료) |

### 단계 2-3: 프로젝트 생성
1. **"Create new project"** 클릭
2. 1-2분 기다리기 (프로젝트 생성 중...)
3. 완료되면 대시보드가 보입니다

---

## 3. 데이터베이스 테이블 만들기

### 단계 3-1: SQL Editor 열기
1. 좌측 메뉴에서 **"SQL Editor"** (📝 아이콘) 클릭
2. 중앙 상단의 **"New query"** 버튼 클릭

### 단계 3-2: SQL 코드 실행
1. `supabase-setup.sql` 파일 열기
2. 전체 내용 복사 (Ctrl+A, Ctrl+C)
3. SQL Editor에 붙여넣기 (Ctrl+V)
4. 우측 하단의 **"Run"** 버튼 클릭 (또는 Ctrl+Enter)

### 단계 3-3: 성공 확인
✅ 성공 메시지가 보이면 완료!
```
Success. No rows returned
```

### 단계 3-4: 테이블 확인
1. 좌측 메뉴에서 **"Table Editor"** 클릭
2. 2개의 테이블이 보여야 함:
   - `daily_visitors` - 일일 방문자 수
   - `visit_logs` - 방문 상세 로그

---

## 4. API 키 가져오기

### 단계 4-1: 설정 페이지로 이동
1. 좌측 메뉴 하단의 **"Project Settings"** (⚙️ 아이콘) 클릭
2. **"API"** 메뉴 클릭

### 단계 4-2: API 정보 복사

다음 2가지 정보를 복사하세요:

#### 1) Project URL
```
https://xxxxxxxxxxxxxxxx.supabase.co
```
- **Configuration** → **URL** 섹션에 있음
- 이 URL을 복사하세요

#### 2) anon public key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
```
- **Project API keys** → **anon public** 섹션에 있음
- 매우 긴 문자열입니다 (100자 이상)
- 전체를 복사하세요

> ⚠️ **주의**:
> - `anon public` 키를 복사하세요 (service_role이 아님!)
> - 이 키는 공개해도 안전합니다 (클라이언트용)

---

## 5. 웹사이트에 적용하기

### 단계 5-1: index.html 수정
1. `index.html` 파일 열기
2. 약 744-745번째 줄 찾기:

```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

### 단계 5-2: API 정보 입력
복사한 정보로 교체:

```javascript
const SUPABASE_URL = 'https://xxxxxxxx.supabase.co';  // 4단계에서 복사한 URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6...';  // 4단계에서 복사한 anon key
```

### 단계 5-3: 파일 저장
- Ctrl+S로 저장

---

## 6. 테스트 방법

### 테스트 6-1: 로컬에서 테스트
1. `index.html` 파일을 브라우저로 열기
2. F12 키를 눌러 개발자 도구 열기
3. Console 탭 확인

**성공 시 메시지:**
```
[VisitorTracker] Visit logged successfully
[VisitorTracker] Visitor count incremented
[VisitorTracker] New visit tracked
```

**실패 시 메시지:**
```
⚠️ Supabase 설정이 필요합니다.
```
→ API 키를 다시 확인하세요!

### 테스트 6-2: Supabase에서 확인
1. Supabase 대시보드 → **Table Editor** 클릭
2. `daily_visitors` 테이블 선택
3. `visitor_count`가 **1**로 증가했는지 확인
4. `visit_logs` 테이블에 방문 기록이 있는지 확인

### 테스트 6-3: 방문자 수 표시 확인
웹사이트 통계 섹션에서 **"오늘 방문자"** 숫자가 보여야 합니다.

---

## 7. 문제 해결

### 문제 1: "Failed to fetch" 오류
**원인**: API URL이나 키가 잘못됨

**해결방법**:
1. Supabase → Project Settings → API 재확인
2. URL 끝에 `/`가 없는지 확인
3. anon key 전체가 복사되었는지 확인

### 문제 2: 방문자 수가 0으로 표시됨
**원인**: RLS (Row Level Security) 정책 문제

**해결방법**:
1. Supabase → SQL Editor 열기
2. 다음 SQL 실행:
```sql
-- 정책 확인
SELECT * FROM pg_policies WHERE tablename IN ('daily_visitors', 'visit_logs');
```
3. 정책이 없으면 `supabase-setup.sql` 다시 실행

### 문제 3: "Bot detected" 메시지
**원인**: 봇으로 감지됨 (정상 동작)

**해결방법**:
- 실제 브라우저에서 테스트 (Chrome, Firefox 등)
- 시크릿 모드는 피하기
- 개발자 도구를 닫고 다시 테스트

### 문제 4: 방문자 수가 계속 증가함
**원인**: 세션 ID가 매번 새로 생성됨

**해결방법**:
- 정상입니다! sessionStorage는 탭을 닫으면 초기화됩니다
- 같은 탭에서는 하루에 한 번만 카운트됩니다

---

## 📊 데이터 확인 방법

### 일일 방문자 수 확인
```sql
SELECT visit_date, visitor_count
FROM daily_visitors
ORDER BY visit_date DESC;
```

### 오늘 방문 로그 확인
```sql
SELECT *
FROM visit_logs
WHERE visit_date = CURRENT_DATE
ORDER BY created_at DESC;
```

### 봇 방문 비율 확인
```sql
SELECT
  is_bot,
  COUNT(*) as count
FROM visit_logs
GROUP BY is_bot;
```

---

## 🎯 봇 필터링 기능

다음 봇들이 자동으로 필터링됩니다:

### 검색엔진 봇
- Googlebot, Bingbot, Yandex
- DuckDuckBot, Baidu Spider

### 소셜 미디어 봇
- Facebook, Twitter, LinkedIn
- Pinterest, Reddit, Discord

### 기타 봇
- WhatsApp, Telegram
- Headless Chrome, Selenium
- WebDriver, PhantomJS

---

## 💡 추가 팁

### 방문자 통계 대시보드 만들기
Supabase → SQL Editor에서:

```sql
-- 최근 7일 방문자 추이
SELECT
  visit_date,
  visitor_count
FROM daily_visitors
WHERE visit_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY visit_date DESC;

-- 총 방문자 수
SELECT SUM(visitor_count) as total_visitors
FROM daily_visitors;

-- 평균 일일 방문자
SELECT AVG(visitor_count) as avg_daily_visitors
FROM daily_visitors;
```

### 데이터 백업
1. Table Editor → 테이블 선택
2. Export to CSV 버튼 클릭
3. 정기적으로 백업 권장

---

## 📞 도움이 필요하신가요?

- Supabase 공식 문서: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: 이 프로젝트의 Issues 탭

---

## ✅ 체크리스트

설정을 완료하셨나요? 다음 항목을 확인하세요:

- [ ] Supabase 계정 생성 완료
- [ ] 프로젝트 생성 완료
- [ ] `supabase-setup.sql` 실행 완료
- [ ] 테이블 2개 생성 확인 (`daily_visitors`, `visit_logs`)
- [ ] Project URL 복사 완료
- [ ] anon public key 복사 완료
- [ ] `index.html`에 API 정보 입력 완료
- [ ] 브라우저에서 테스트 완료
- [ ] Console에 성공 메시지 확인
- [ ] Supabase Table Editor에서 데이터 확인
- [ ] 웹사이트에 방문자 수 표시 확인

모든 항목이 체크되었다면 설정 완료! 🎉
