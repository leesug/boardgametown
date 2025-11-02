/**
 * 방문자 추적 시스템
 * - Supabase를 사용하여 일일 방문자 수 추적
 * - 봇 필터링 기능 포함
 */

class VisitorTracker {
    constructor(supabaseUrl, supabaseKey) {
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        this.sessionId = this.getOrCreateSessionId();
    }

    /**
     * 세션 ID 생성 또는 가져오기
     */
    getOrCreateSessionId() {
        let sessionId = sessionStorage.getItem('visitor_session_id');
        if (!sessionId) {
            sessionId = this.generateUUID();
            sessionStorage.setItem('visitor_session_id', sessionId);
        }
        return sessionId;
    }

    /**
     * UUID 생성
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * 봇 감지 로직
     * @returns {boolean} 봇이면 true, 실제 사용자면 false
     */
    isBot() {
        const userAgent = navigator.userAgent.toLowerCase();

        // 1. User-Agent 기반 봇 감지
        const botPatterns = [
            'bot', 'crawler', 'spider', 'scraper', 'slurp', 'bingbot',
            'googlebot', 'yandexbot', 'duckduckbot', 'baiduspider',
            'facebookexternalhit', 'twitterbot', 'rogerbot', 'linkedinbot',
            'embedly', 'quora link preview', 'showyoubot', 'outbrain',
            'pinterest', 'slackbot', 'vkshare', 'w3c_validator',
            'redditbot', 'applebot', 'whatsapp', 'flipboard', 'tumblr',
            'bitlybot', 'skypeuripreview', 'nuzzel', 'discordbot',
            'qwantify', 'pinterestbot', 'bitrix', 'telegrambot',
            'headlesschrome', 'phantomjs', 'selenium', 'webdriver'
        ];

        for (const pattern of botPatterns) {
            if (userAgent.includes(pattern)) {
                console.log('[VisitorTracker] Bot detected via User-Agent:', pattern);
                return true;
            }
        }

        // 2. WebDriver 감지
        if (navigator.webdriver) {
            console.log('[VisitorTracker] Bot detected via WebDriver');
            return true;
        }

        // 3. Headless 브라우저 감지
        if (navigator.plugins.length === 0 && !navigator.maxTouchPoints) {
            console.log('[VisitorTracker] Possible headless browser detected');
            return true;
        }

        // 4. 언어 설정 확인 (봇은 보통 언어 설정이 없음)
        if (!navigator.language && !navigator.languages) {
            console.log('[VisitorTracker] Bot detected: no language settings');
            return true;
        }

        // 5. Chrome headless 감지
        if (navigator.userAgent.includes('HeadlessChrome')) {
            console.log('[VisitorTracker] HeadlessChrome detected');
            return true;
        }

        // 6. 플랫폼 확인
        if (!navigator.platform) {
            console.log('[VisitorTracker] Bot detected: no platform');
            return true;
        }

        return false;
    }

    /**
     * Supabase API 호출
     */
    async supabaseFetch(endpoint, options = {}) {
        const url = `${this.supabaseUrl}/rest/v1/${endpoint}`;
        const headers = {
            'apikey': this.supabaseKey,
            'Authorization': `Bearer ${this.supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
            ...options.headers
        };

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            throw new Error(`Supabase API error: ${response.status}`);
        }

        return response.json();
    }

    /**
     * 방문 로그 기록
     */
    async logVisit() {
        const isBot = this.isBot();

        if (isBot) {
            console.log('[VisitorTracker] Bot visit detected, not logging');
            return { isBot: true, logged: false };
        }

        try {
            const visitData = {
                session_id: this.sessionId,
                visit_date: new Date().toISOString().split('T')[0],
                user_agent: navigator.userAgent,
                is_bot: false,
                referrer: document.referrer || 'direct'
            };

            // 방문 로그 기록
            await this.supabaseFetch('visit_logs', {
                method: 'POST',
                body: JSON.stringify(visitData)
            });

            console.log('[VisitorTracker] Visit logged successfully');
            return { isBot: false, logged: true };
        } catch (error) {
            console.error('[VisitorTracker] Error logging visit:', error);
            return { isBot: false, logged: false, error: error.message };
        }
    }

    /**
     * 오늘 방문자 수 증가
     */
    async incrementTodayVisitors() {
        try {
            const today = new Date().toISOString().split('T')[0];

            // 1. 오늘 날짜의 레코드 확인
            const existing = await this.supabaseFetch(
                `daily_visitors?visit_date=eq.${today}&select=*`
            );

            if (existing && existing.length > 0) {
                // 2. 기존 레코드가 있으면 카운트 증가
                const currentCount = existing[0].visitor_count || 0;
                await this.supabaseFetch(
                    `daily_visitors?visit_date=eq.${today}`,
                    {
                        method: 'PATCH',
                        body: JSON.stringify({
                            visitor_count: currentCount + 1,
                            updated_at: new Date().toISOString()
                        })
                    }
                );
            } else {
                // 3. 신규 레코드 생성
                await this.supabaseFetch('daily_visitors', {
                    method: 'POST',
                    body: JSON.stringify({
                        visit_date: today,
                        visitor_count: 1
                    })
                });
            }

            console.log('[VisitorTracker] Visitor count incremented');
        } catch (error) {
            console.error('[VisitorTracker] Error incrementing visitor count:', error);
        }
    }

    /**
     * 오늘 방문자 수 가져오기
     */
    async getTodayVisitors() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const result = await this.supabaseFetch(
                `daily_visitors?visit_date=eq.${today}&select=visitor_count`
            );

            if (result && result.length > 0) {
                return result[0].visitor_count || 0;
            }
            return 0;
        } catch (error) {
            console.error('[VisitorTracker] Error getting visitor count:', error);
            return 0;
        }
    }

    /**
     * 중복 방문 체크 (오늘 이미 방문했는지)
     */
    async hasVisitedToday() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const result = await this.supabaseFetch(
                `visit_logs?session_id=eq.${this.sessionId}&visit_date=eq.${today}&select=id`
            );

            return result && result.length > 0;
        } catch (error) {
            console.error('[VisitorTracker] Error checking visit:', error);
            return false;
        }
    }

    /**
     * 방문 추적 초기화
     */
    async trackVisit() {
        // 봇 체크
        if (this.isBot()) {
            console.log('[VisitorTracker] Bot detected, skipping tracking');
            return { tracked: false, reason: 'bot' };
        }

        try {
            // 오늘 이미 방문했는지 확인
            const hasVisited = await this.hasVisitedToday();

            if (!hasVisited) {
                // 방문 로그 기록
                await this.logVisit();

                // 방문자 수 증가
                await this.incrementTodayVisitors();

                console.log('[VisitorTracker] New visit tracked');
                return { tracked: true, newVisit: true };
            } else {
                console.log('[VisitorTracker] Already visited today');
                return { tracked: false, reason: 'duplicate' };
            }
        } catch (error) {
            console.error('[VisitorTracker] Error tracking visit:', error);
            return { tracked: false, reason: 'error', error: error.message };
        }
    }

    /**
     * 방문자 수 UI 업데이트
     */
    async updateVisitorCountUI(elementId = 'todayVisitors') {
        const count = await this.getTodayVisitors();
        const element = document.getElementById(elementId);

        if (element) {
            // 애니메이션 효과
            this.animateCount(element, 0, count, 1000);
        }

        return count;
    }

    /**
     * 숫자 카운트 애니메이션
     */
    animateCount(element, start, end, duration) {
        const startTime = performance.now();
        const difference = end - start;

        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const current = Math.floor(start + difference * this.easeOutQuad(progress));
            element.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                element.textContent = end.toLocaleString();
            }
        };

        requestAnimationFrame(step);
    }

    /**
     * Easing 함수
     */
    easeOutQuad(t) {
        return t * (2 - t);
    }
}

// 전역 변수로 export
window.VisitorTracker = VisitorTracker;