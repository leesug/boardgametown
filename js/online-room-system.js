/**
 * 그레이트 킹덤 온라인 대전 - 9개 방 시스템
 * Supabase를 사용한 실시간 대전
 */

class OnlineRoomSystem {
    constructor(supabaseUrl, supabaseKey) {
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        this.sessionId = this.generateSessionId();
        this.playerName = '';
        this.currentRoom = null; // 현재 입장한 방 번호
        this.myColor = null; // 'blue' 또는 'orange'
        this.opponentSession = null;
        this.isOnlineMode = false;
        this.movePollingInterval = null;
        this.roomPollingInterval = null;
        this.heartbeatInterval = null;
        this.lastProcessedMoveId = null;
        this.isAIPlaying = false; // AI 대타 모드
        this.connectionWarningShown = false;
    }

    /**
     * 세션 ID 생성
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
     * 모든 방 상태 조회
     */
    async getAllRooms() {
        try {
            const rooms = await this.supabaseFetch('game_rooms?order=room_number.asc');
            return rooms || [];
        } catch (error) {
            console.error('[Room System] 방 조회 오류:', error);
            return [];
        }
    }

    /**
     * 방 입장
     */
    async joinRoom(roomNumber, playerName) {
        this.playerName = playerName || `플레이어${Math.floor(Math.random() * 1000)}`;

        try {
            // 방 정보 조회
            const rooms = await this.supabaseFetch(`game_rooms?room_number=eq.${roomNumber}`);

            if (!rooms || rooms.length === 0) {
                throw new Error('방을 찾을 수 없습니다');
            }

            const room = rooms[0];

            // 이미 2명이 차있는지 확인
            if (room.player1_session && room.player2_session) {
                throw new Error('방이 가득 찼습니다');
            }

            // 첫 번째 플레이어로 입장
            if (!room.player1_session) {
                await this.supabaseFetch(`game_rooms?room_number=eq.${roomNumber}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        player1_session: this.sessionId,
                        player1_name: this.playerName,
                        player1_connected: true,
                        status: 'waiting',
                        updated_at: new Date().toISOString()
                    })
                });

                this.currentRoom = roomNumber;
                this.myColor = 'blue'; // player1은 항상 파란색

                console.log('[Room System] 방 입장 (player1):', roomNumber);

                // 방 상태 모니터링 시작
                this.startRoomMonitoring();
                return {
                    roomNumber,
                    position: 'player1',
                    myColor: 'blue',
                    waiting: true
                };
            }

            // 두 번째 플레이어로 입장
            if (!room.player2_session) {
                await this.supabaseFetch(`game_rooms?room_number=eq.${roomNumber}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        player2_session: this.sessionId,
                        player2_name: this.playerName,
                        player2_connected: true,
                        status: 'ready', // 2명 모두 입장하면 ready
                        updated_at: new Date().toISOString()
                    })
                });

                this.currentRoom = roomNumber;
                this.myColor = 'orange'; // player2는 항상 주황색
                this.opponentSession = room.player1_session;

                console.log('[Room System] 방 입장 (player2):', roomNumber);

                // 방 상태 모니터링 시작
                this.startRoomMonitoring();
                return {
                    roomNumber,
                    position: 'player2',
                    myColor: 'orange',
                    waiting: false,
                    opponentName: room.player1_name
                };
            }

        } catch (error) {
            console.error('[Room System] 방 입장 오류:', error);
            throw error;
        }
    }

    /**
     * 방 상태 모니터링 시작
     */
    startRoomMonitoring() {
        // 하트비트 - 연결 상태 유지
        this.heartbeatInterval = setInterval(async () => {
            await this.sendHeartbeat();
        }, 3000); // 3초마다

        // 방 상태 폴링
        this.roomPollingInterval = setInterval(async () => {
            await this.checkRoomStatus();
        }, 1000); // 1초마다

        // 이동 폴링
        this.movePollingInterval = setInterval(async () => {
            await this.checkForNewMoves();
        }, 1000); // 1초마다

        this.isOnlineMode = true;
    }

    /**
     * 하트비트 전송
     */
    async sendHeartbeat() {
        if (!this.currentRoom) return;

        try {
            const isPlayer1 = this.myColor === 'blue';
            const updateData = isPlayer1 ? {
                player1_connected: true,
                updated_at: new Date().toISOString()
            } : {
                player2_connected: true,
                updated_at: new Date().toISOString()
            };

            await this.supabaseFetch(`game_rooms?room_number=eq.${this.currentRoom}`, {
                method: 'PATCH',
                body: JSON.stringify(updateData)
            });
        } catch (error) {
            console.error('[Room System] 하트비트 오류:', error);
        }
    }

    /**
     * 방 상태 확인
     */
    async checkRoomStatus() {
        if (!this.currentRoom) return;

        try {
            const rooms = await this.supabaseFetch(`game_rooms?room_number=eq.${this.currentRoom}`);

            if (!rooms || rooms.length === 0) return;

            const room = rooms[0];

            // ready 상태면 3초 후 게임 시작
            if (room.status === 'ready' && !room.game_started_at) {
                if (this.onRoomReady) {
                    this.onRoomReady(room);
                }
            }

            // 상대방 연결 끊김 확인
            const isPlayer1 = this.myColor === 'blue';
            const opponentConnected = isPlayer1 ? room.player2_connected : room.player1_connected;

            if (room.status === 'playing' && !opponentConnected) {
                // 상대방 연결 끊김 - 경고 표시
                if (!this.connectionWarningShown && this.onOpponentDisconnected) {
                    this.connectionWarningShown = true;
                    this.onOpponentDisconnected();
                }
            } else {
                this.connectionWarningShown = false;
            }

        } catch (error) {
            console.error('[Room System] 방 상태 확인 오류:', error);
        }
    }

    /**
     * 게임 시작
     */
    async startGame() {
        if (!this.currentRoom) return;

        try {
            await this.supabaseFetch(`game_rooms?room_number=eq.${this.currentRoom}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: 'playing',
                    game_started_at: new Date().toISOString(),
                    current_turn: 'blue',
                    updated_at: new Date().toISOString()
                })
            });

            console.log('[Room System] 게임 시작');
        } catch (error) {
            console.error('[Room System] 게임 시작 오류:', error);
        }
    }

    /**
     * 새로운 이동 확인 (폴링)
     */
    async checkForNewMoves() {
        if (!this.currentRoom) return;

        try {
            const moves = await this.supabaseFetch(
                `game_moves?room_number=eq.${this.currentRoom}&order=created_at.desc&limit=1`
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
            console.error('[Room System] 이동 확인 오류:', error);
        }
    }

    /**
     * 이동 전송
     */
    async sendMove(moveType, row, col, moveData = {}) {
        if (!this.currentRoom) {
            console.error('[Room System] 방이 없습니다');
            return;
        }

        try {
            const move = {
                room_number: this.currentRoom,
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
            await this.supabaseFetch(`game_rooms?room_number=eq.${this.currentRoom}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    current_turn: nextTurn,
                    updated_at: new Date().toISOString()
                })
            });

            console.log('[Room System] 이동 전송:', moveType, row, col);

        } catch (error) {
            console.error('[Room System] 이동 전송 오류:', error);
            throw error;
        }
    }

    /**
     * 방 나가기
     */
    async leaveRoom() {
        if (!this.currentRoom) return;

        try {
            const isPlayer1 = this.myColor === 'blue';
            const updateData = isPlayer1 ? {
                player1_session: null,
                player1_name: null,
                player1_connected: true,
                status: 'waiting',
                game_state: {},
                current_turn: 'blue',
                winner: null,
                game_started_at: null,
                updated_at: new Date().toISOString()
            } : {
                player2_session: null,
                player2_name: null,
                player2_connected: true,
                status: 'waiting',
                game_state: {},
                current_turn: 'blue',
                winner: null,
                game_started_at: null,
                updated_at: new Date().toISOString()
            };

            await this.supabaseFetch(`game_rooms?room_number=eq.${this.currentRoom}`, {
                method: 'PATCH',
                body: JSON.stringify(updateData)
            });

            console.log('[Room System] 방 나가기:', this.currentRoom);
            this.cleanup();

        } catch (error) {
            console.error('[Room System] 방 나가기 오류:', error);
        }
    }

    /**
     * 게임 종료
     */
    async endGame(winner) {
        if (!this.currentRoom) return;

        try {
            await this.supabaseFetch(`game_rooms?room_number=eq.${this.currentRoom}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: 'finished',
                    winner: winner,
                    updated_at: new Date().toISOString()
                })
            });

            console.log('[Room System] 게임 종료:', winner);

        } catch (error) {
            console.error('[Room System] 게임 종료 오류:', error);
        }
    }

    /**
     * AI 대타 모드 활성화
     */
    enableAISubstitute() {
        this.isAIPlaying = true;
        console.log('[Room System] AI 대타 모드 활성화');
    }

    /**
     * AI 대타 모드 비활성화
     */
    disableAISubstitute() {
        this.isAIPlaying = false;
        console.log('[Room System] AI 대타 모드 비활성화');
    }

    /**
     * 정리
     */
    cleanup() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        if (this.roomPollingInterval) {
            clearInterval(this.roomPollingInterval);
            this.roomPollingInterval = null;
        }

        if (this.movePollingInterval) {
            clearInterval(this.movePollingInterval);
            this.movePollingInterval = null;
        }

        this.isOnlineMode = false;
        this.currentRoom = null;
        this.myColor = null;
        this.opponentSession = null;
        this.lastProcessedMoveId = null;
        this.connectionWarningShown = false;
        this.isAIPlaying = false;
    }

    /**
     * 현재 턴 확인
     */
    async getCurrentTurn() {
        if (!this.currentRoom) return null;

        try {
            const rooms = await this.supabaseFetch(
                `game_rooms?room_number=eq.${this.currentRoom}&select=current_turn`
            );

            if (rooms && rooms.length > 0) {
                return rooms[0].current_turn;
            }
        } catch (error) {
            console.error('[Room System] 턴 확인 오류:', error);
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

    /**
     * 재경기 요청
     */
    async requestRematch(requestedBy) {
        if (!this.currentRoom) return;

        try {
            await this.supabaseFetch(`game_rooms?room_number=eq.${this.currentRoom}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    rematch_requested_by: requestedBy,
                    rematch_status: 'requested',
                    updated_at: new Date().toISOString()
                })
            });

            console.log('[Room System] 재경기 요청:', requestedBy);
        } catch (error) {
            console.error('[Room System] 재경기 요청 오류:', error);
            throw error;
        }
    }

    /**
     * 재경기 수락
     */
    async acceptRematch() {
        if (!this.currentRoom) return;

        try {
            await this.supabaseFetch(`game_rooms?room_number=eq.${this.currentRoom}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    rematch_status: 'accepted',
                    updated_at: new Date().toISOString()
                })
            });

            console.log('[Room System] 재경기 수락');
        } catch (error) {
            console.error('[Room System] 재경기 수락 오류:', error);
            throw error;
        }
    }

    /**
     * 재경기 거절
     */
    async declineRematch() {
        if (!this.currentRoom) return;

        try {
            await this.supabaseFetch(`game_rooms?room_number=eq.${this.currentRoom}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    rematch_status: 'declined',
                    rematch_requested_by: null,
                    updated_at: new Date().toISOString()
                })
            });

            console.log('[Room System] 재경기 거절');
        } catch (error) {
            console.error('[Room System] 재경기 거절 오류:', error);
            throw error;
        }
    }

    /**
     * 재경기 취소
     */
    async cancelRematch() {
        if (!this.currentRoom) return;

        try {
            await this.supabaseFetch(`game_rooms?room_number=eq.${this.currentRoom}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    rematch_status: 'none',
                    rematch_requested_by: null,
                    updated_at: new Date().toISOString()
                })
            });

            console.log('[Room System] 재경기 취소');
        } catch (error) {
            console.error('[Room System] 재경기 취소 오류:', error);
            throw error;
        }
    }

    /**
     * 재경기 상태 확인
     */
    async getRematchStatus() {
        if (!this.currentRoom) return null;

        try {
            const rooms = await this.supabaseFetch(
                `game_rooms?room_number=eq.${this.currentRoom}&select=rematch_status,rematch_requested_by`
            );

            if (rooms && rooms.length > 0) {
                return rooms[0];
            }
        } catch (error) {
            console.error('[Room System] 재경기 상태 확인 오류:', error);
        }

        return { rematch_status: 'none', rematch_requested_by: null };
    }

    /**
     * 재경기를 위한 게임 상태 리셋
     */
    async resetGameForRematch() {
        if (!this.currentRoom) return;

        try {
            // 이동 로그 삭제
            await this.supabaseFetch(`game_moves?room_number=eq.${this.currentRoom}`, {
                method: 'DELETE'
            });

            // 방 상태 초기화
            await this.supabaseFetch(`game_rooms?room_number=eq.${this.currentRoom}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    status: 'playing',
                    current_turn: 'blue',
                    game_state: {},
                    winner: null,
                    rematch_status: 'none',
                    rematch_requested_by: null,
                    game_started_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
            });

            // 이동 ID 리셋
            this.lastProcessedMoveId = null;

            console.log('[Room System] 재경기를 위한 게임 리셋 완료');
        } catch (error) {
            console.error('[Room System] 게임 리셋 오류:', error);
            throw error;
        }
    }
}

// 전역 변수로 export
window.OnlineRoomSystem = OnlineRoomSystem;
