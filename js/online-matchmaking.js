/**
 * 그레이트 킹덤 온라인 매칭 시스템
 * Supabase Realtime을 사용한 실시간 대전
 */

class OnlineMatchmaking {
    constructor(supabaseUrl, supabaseKey) {
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        this.sessionId = this.generateSessionId();
        this.playerName = '';
        this.roomCode = null;
        this.myColor = null; // 'blue' 또는 'orange'
        this.opponentSession = null;
        this.isOnlineMode = false;
        this.realtimeChannel = null;
        this.moveSubscription = null;
        this.roomSubscription = null;
    }

    /**
     * 세션 ID 생성
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * 방 코드 생성 (6자리)
     */
    generateRoomCode() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
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
            const error = await response.text();
            throw new Error(`Supabase API error: ${response.status} - ${error}`);
        }

        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }

    /**
     * 대기방에 입장
     */
    async enterWaitingRoom(playerName) {
        this.playerName = playerName || `플레이어${Math.floor(Math.random() * 1000)}`;

        try {
            // 기존 대기 삭제
            await this.supabaseFetch(`waiting_room?session_id=eq.${this.sessionId}`, {
                method: 'DELETE'
            });

            // 새로 대기방 입장
            await this.supabaseFetch('waiting_room', {
                method: 'POST',
                body: JSON.stringify({
                    player_name: this.playerName,
                    session_id: this.sessionId,
                    status: 'waiting'
                })
            });

            console.log('[Matchmaking] 대기방 입장:', this.playerName);

            // 즉시 매칭 시도
            await this.tryMatchmaking();

            // 매칭 대기 (10초마다 재시도)
            this.matchingInterval = setInterval(async () => {
                await this.tryMatchmaking();
            }, 3000);

        } catch (error) {
            console.error('[Matchmaking] 대기방 입장 오류:', error);
            throw error;
        }
    }

    /**
     * 매칭 시도
     */
    async tryMatchmaking() {
        try {
            // 대기 중인 다른 플레이어 찾기
            const waitingPlayers = await this.supabaseFetch(
                `waiting_room?status=eq.waiting&session_id=neq.${this.sessionId}&order=created_at.asc&limit=1`
            );

            if (waitingPlayers && waitingPlayers.length > 0) {
                const opponent = waitingPlayers[0];
                console.log('[Matchmaking] 상대 발견:', opponent);

                // 매칭 성공 - 게임 방 생성
                await this.createGameRoom(opponent);

                // 대기 취소
                if (this.matchingInterval) {
                    clearInterval(this.matchingInterval);
                    this.matchingInterval = null;
                }
            }
        } catch (error) {
            console.error('[Matchmaking] 매칭 시도 오류:', error);
        }
    }

    /**
     * 게임 방 생성
     */
    async createGameRoom(opponent) {
        try {
            this.roomCode = this.generateRoomCode();

            // 선공/후공 결정 (먼저 대기한 사람이 선공)
            const isPlayer1 = opponent.created_at < new Date().toISOString();
            this.myColor = isPlayer1 ? 'orange' : 'blue';
            this.opponentSession = opponent.session_id;

            const roomData = isPlayer1 ? {
                room_code: this.roomCode,
                player1_session: opponent.session_id,
                player2_session: this.sessionId,
                player1_name: opponent.player_name,
                player2_name: this.playerName,
                current_turn: 'blue',
                game_state: {},
                status: 'active'
            } : {
                room_code: this.roomCode,
                player1_session: this.sessionId,
                player2_session: opponent.session_id,
                player1_name: this.playerName,
                player2_name: opponent.player_name,
                current_turn: 'blue',
                game_state: {},
                status: 'active'
            };

            // 게임 방 생성
            await this.supabaseFetch('game_rooms', {
                method: 'POST',
                body: JSON.stringify(roomData)
            });

            // 대기방에서 양쪽 모두 제거
            await this.supabaseFetch(`waiting_room?session_id=eq.${this.sessionId}`, {
                method: 'DELETE'
            });
            await this.supabaseFetch(`waiting_room?session_id=eq.${opponent.session_id}`, {
                method: 'DELETE'
            });

            console.log('[Matchmaking] 게임 방 생성 완료:', this.roomCode);

            // Realtime 구독 시작
            this.subscribeToGameRoom();

            return {
                roomCode: this.roomCode,
                myColor: this.myColor,
                opponentName: opponent.player_name
            };

        } catch (error) {
            console.error('[Matchmaking] 게임 방 생성 오류:', error);
            throw error;
        }
    }

    /**
     * Realtime 구독 (게임 방 & 이동)
     */
    subscribeToGameRoom() {
        console.log('[Realtime] 구독 시작:', this.roomCode);

        // 폴링 방식으로 게임 이동 감지 (Realtime 대신)
        this.movePollingInterval = setInterval(async () => {
            await this.checkForNewMoves();
        }, 1000); // 1초마다 확인

        this.isOnlineMode = true;
    }

    /**
     * 새로운 이동 확인 (폴링)
     */
    async checkForNewMoves() {
        if (!this.roomCode) return;

        try {
            const moves = await this.supabaseFetch(
                `game_moves?room_code=eq.${this.roomCode}&order=created_at.desc&limit=1`
            );

            if (moves && moves.length > 0) {
                const latestMove = moves[0];

                // 상대방의 이동만 처리
                if (latestMove.player_session !== this.sessionId) {
                    // 마지막 처리된 이동과 비교
                    if (!this.lastProcessedMoveId || this.lastProcessedMoveId !== latestMove.id) {
                        this.lastProcessedMoveId = latestMove.id;

                        // 게임에 이동 적용
                        if (this.onOpponentMove) {
                            this.onOpponentMove(latestMove);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[Realtime] 이동 확인 오류:', error);
        }
    }

    /**
     * 이동 전송
     */
    async sendMove(moveType, row, col, moveData = {}) {
        if (!this.roomCode) {
            console.error('[Online] 게임 방이 없습니다');
            return;
        }

        try {
            const move = {
                room_code: this.roomCode,
                player_session: this.sessionId,
                move_type: moveType,
                row_pos: row,
                col_pos: col,
                move_data: moveData
            };

            await this.supabaseFetch('game_moves', {
                method: 'POST',
                body: JSON.stringify(move)
            });

            // 게임 방 상태 업데이트
            const nextTurn = this.myColor === 'blue' ? 'orange' : 'blue';
            await this.supabaseFetch(`game_rooms?room_code=eq.${this.roomCode}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    current_turn: nextTurn,
                    updated_at: new Date().toISOString()
                })
            });

            console.log('[Online] 이동 전송:', moveType, row, col);

        } catch (error) {
            console.error('[Online] 이동 전송 오류:', error);
            throw error;
        }
    }

    /**
     * 게임 종료
     */
    async endGame(winner) {
        if (!this.roomCode) return;

        try {
            await this.supabaseFetch(`game_rooms?room_code=eq.${this.roomCode}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: 'finished',
                    winner: winner,
                    updated_at: new Date().toISOString()
                })
            });

            console.log('[Online] 게임 종료:', winner);
            this.cleanup();

        } catch (error) {
            console.error('[Online] 게임 종료 오류:', error);
        }
    }

    /**
     * 대기 취소
     */
    async cancelWaiting() {
        try {
            if (this.matchingInterval) {
                clearInterval(this.matchingInterval);
                this.matchingInterval = null;
            }

            await this.supabaseFetch(`waiting_room?session_id=eq.${this.sessionId}`, {
                method: 'DELETE'
            });

            console.log('[Matchmaking] 대기 취소');
        } catch (error) {
            console.error('[Matchmaking] 대기 취소 오류:', error);
        }
    }

    /**
     * 정리
     */
    cleanup() {
        if (this.matchingInterval) {
            clearInterval(this.matchingInterval);
            this.matchingInterval = null;
        }

        if (this.movePollingInterval) {
            clearInterval(this.movePollingInterval);
            this.movePollingInterval = null;
        }

        if (this.realtimeChannel) {
            this.realtimeChannel.unsubscribe();
            this.realtimeChannel = null;
        }

        this.isOnlineMode = false;
        this.roomCode = null;
        this.myColor = null;
        this.opponentSession = null;
        this.lastProcessedMoveId = null;
    }

    /**
     * 현재 턴 확인
     */
    async getCurrentTurn() {
        if (!this.roomCode) return null;

        try {
            const rooms = await this.supabaseFetch(
                `game_rooms?room_code=eq.${this.roomCode}&select=current_turn`
            );

            if (rooms && rooms.length > 0) {
                return rooms[0].current_turn;
            }
        } catch (error) {
            console.error('[Online] 턴 확인 오류:', error);
        }

        return null;
    }

    /**
     * 내 차례인지 확인
     */
    async isMyTurn() {
        const currentTurn = await this.getCurrentTurn();
        return currentTurn === this.myColor;
    }
}

// 전역 변수로 export
window.OnlineMatchmaking = OnlineMatchmaking;
