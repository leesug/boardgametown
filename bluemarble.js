// 게임 상태
const gameState = {
    currentPlayer: 0, // 0: 플레이어, 1: AI
    players: [
        { name: '플레이어', money: 1000000, position: 0, properties: [], color: '#2196F3' },
        { name: 'AI', money: 1000000, position: 0, properties: [], color: '#f44336' }
    ],
    isGameOver: false,
    pendingPurchase: null,
    pendingUpgrade: null,
    pendingSell: null,
    sellSelection: {
        selectedProperties: [],
        neededMoney: 0,
        callback: null
    }
};

// 보드 설정 (20칸 - 빠른 게임을 위해)
const boardCells = [
    { id: 0, name: '시작', type: 'start', price: 0 },
    { id: 1, name: '서울', type: 'property', price: 50000, toll: 25000, level: 0 },
    { id: 2, name: '부산', type: 'property', price: 60000, toll: 30000, level: 0 },
    { id: 3, name: '황금열쇠', type: 'chance', price: 0 },
    { id: 4, name: '대구', type: 'property', price: 70000, toll: 35000, level: 0 },
    { id: 5, name: '인천', type: 'property', price: 80000, toll: 40000, level: 0 },
    { id: 6, name: '무인도', type: 'island', price: 0 },
    { id: 7, name: '광주', type: 'property', price: 90000, toll: 45000, level: 0 },
    { id: 8, name: '대전', type: 'property', price: 100000, toll: 50000, level: 0 },
    { id: 9, name: '황금열쇠', type: 'chance', price: 0 },
    { id: 10, name: '울산', type: 'property', price: 110000, toll: 55000, level: 0 },
    { id: 11, name: '수원', type: 'property', price: 120000, toll: 60000, level: 0 },
    { id: 12, name: '세금', type: 'tax', price: 0 },
    { id: 13, name: '창원', type: 'property', price: 130000, toll: 65000, level: 0 },
    { id: 14, name: '제주', type: 'property', price: 150000, toll: 75000, level: 0 },
    { id: 15, name: '황금열쇠', type: 'chance', price: 0 },
    { id: 16, name: '강릉', type: 'property', price: 170000, toll: 85000, level: 0 },
    { id: 17, name: '전주', type: 'property', price: 200000, toll: 100000, level: 0 },
    { id: 18, name: '경주', type: 'property', price: 250000, toll: 125000, level: 0 },
    { id: 19, name: '청주', type: 'property', price: 300000, toll: 150000, level: 0 }
];

// 황금열쇠 이벤트
const chanceCards = [
    { text: '은행 이자로 50,000원 받기', money: 50000 },
    { text: '과속 벌금 30,000원 내기', money: -30000 },
    { text: '복권 당첨! 100,000원 받기', money: 100000 },
    { text: '수리비 40,000원 내기', money: -40000 },
    { text: '보너스 받기 80,000원', money: 80000 },
    { text: '세금 납부 50,000원', money: -50000 }
];

// 게임 초기화
function initGame() {
    createBoard();
    updateUI();
    addEvent('게임이 시작되었습니다!');
    addEvent('플레이어 차례입니다. 주사위를 굴려주세요.');
    
    // 이벤트 리스너 등록
    setupEventListeners();
}

// 모든 이벤트 리스너 설정
function setupEventListeners() {
    // 주사위 굴리기 버튼
    document.getElementById('roll-dice-btn').addEventListener('click', rollDice);
    
    // 홈 버튼
    document.getElementById('home-btn').addEventListener('click', goHome);
    
    // 구매 모달 버튼
    document.getElementById('purchase-confirm-btn').addEventListener('click', () => confirmPurchase(true));
    document.getElementById('purchase-cancel-btn').addEventListener('click', () => confirmPurchase(false));
    
    // 업그레이드 모달 버튼
    document.getElementById('upgrade-confirm-btn').addEventListener('click', () => confirmUpgrade(true));
    document.getElementById('upgrade-cancel-btn').addEventListener('click', () => confirmUpgrade(false));
    
    // 판매 모달 버튼
    document.getElementById('sell-confirm-btn').addEventListener('click', () => confirmSell(true));
    document.getElementById('sell-cancel-btn').addEventListener('click', () => confirmSell(false));
    
    // 판매 선택 모달 버튼
    document.getElementById('sell-selection-confirm-btn').addEventListener('click', confirmSellSelection);
    document.getElementById('sell-selection-cancel-btn').addEventListener('click', cancelSellSelection);
    
    // 게임 오버 모달 버튼
    document.getElementById('game-over-restart-btn').addEventListener('click', () => location.reload());
    document.getElementById('game-over-home-btn').addEventListener('click', goHome);
}

// 보드 생성
function createBoard() {
    const board = document.getElementById('game-board');
    
    // 기존 셀들과 토큰만 제거 (버튼과 이벤트 메시지는 유지)
    const existingCells = board.querySelectorAll('.cell, .player-token');
    existingCells.forEach(el => el.remove());
    
    boardCells.forEach((cell, index) => {
        const cellDiv = document.createElement('div');
        cellDiv.className = 'cell';
        cellDiv.id = `cell-${cell.id}`;
        
        // 위치 설정
        const position = getCellPosition(index);
        Object.assign(cellDiv.style, position.style);
        cellDiv.className += ' ' + position.class;
        
        // 특수 칸 스타일
        if (cell.type === 'start') {
            cellDiv.classList.add('cell-start');
        } else if (cell.type !== 'property') {
            cellDiv.classList.add('cell-special');
        }
        
        // 내용 설정
        const nameDiv = document.createElement('div');
        nameDiv.className = 'cell-name';
        nameDiv.textContent = cell.name;
        cellDiv.appendChild(nameDiv);
        
        if (cell.price > 0) {
            const priceDiv = document.createElement('div');
            priceDiv.className = 'cell-price';
            priceDiv.textContent = `${(cell.price / 10000)}만원`;
            cellDiv.appendChild(priceDiv);
        }
        
        // 소유자 표시용 div
        const ownerDiv = document.createElement('div');
        ownerDiv.className = 'cell-owner';
        ownerDiv.id = `owner-${cell.id}`;
        cellDiv.appendChild(ownerDiv);
        
        // 건물 레벨 표시용 div (땅만)
        if (cell.type === 'property') {
            const levelDiv = document.createElement('div');
            levelDiv.className = 'building-level';
            levelDiv.id = `level-${cell.id}`;
            levelDiv.style.display = 'none';
            cellDiv.appendChild(levelDiv);
        }
        
        board.appendChild(cellDiv);
    });
    
    // 플레이어 토큰 생성
    gameState.players.forEach((player, index) => {
        const token = document.createElement('div');
        token.className = 'player-token';
        token.id = `player-${index}-token`;
        token.style.background = player.color;
        token.textContent = index === 0 ? '👤' : '🤖';
        board.appendChild(token);
        updatePlayerPosition(index);
    });
}

// 칸 위치 계산
function getCellPosition(index) {
    const cellSize = 100;
    const boardSize = 700;
    
    // 하단 (0-4)
    if (index <= 4) {
        return {
            style: {
                left: `${index * cellSize}px`,
                bottom: '0px'
            },
            class: 'cell-bottom'
        };
    }
    // 우측 (5-8)
    else if (index <= 8) {
        const pos = index - 5;
        return {
            style: {
                right: '0px',
                bottom: `${cellSize + pos * 96}px`
            },
            class: 'cell-right'
        };
    }
    // 상단 (9-13)
    else if (index <= 13) {
        const pos = index - 9;
        return {
            style: {
                right: `${cellSize + pos * cellSize}px`,
                top: '0px'
            },
            class: 'cell-top'
        };
    }
    // 좌측 (14-19)
    else {
        const pos = index - 14;
        return {
            style: {
                left: '0px',
                top: `${cellSize + pos * 96}px`
            },
            class: 'cell-left'
        };
    }
}

// 보드 중앙에 이벤트 메시지 표시
function showBoardMessage(message, type = 'default', duration = 2000) {
    const messageEl = document.getElementById('board-event-message');
    messageEl.textContent = message;
    
    // 타입별 스타일 적용
    messageEl.className = 'board-event-message';
    if (type === 'golden') {
        messageEl.classList.add('golden');
    } else if (type === 'tax') {
        messageEl.classList.add('tax');
    } else if (type === 'island') {
        messageEl.classList.add('island');
    }
    
    // 표시
    setTimeout(() => {
        messageEl.classList.add('show');
    }, 50);
    
    // 숨김
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, duration);
}

// 주사위 굴리기
function rollDice() {
    if (gameState.isGameOver) return;
    
    const btn = document.getElementById('roll-dice-btn');
    btn.disabled = true;
    
    const dice = Math.floor(Math.random() * 6) + 1;
    const player = gameState.players[gameState.currentPlayer];
    
    // 주사위 애니메이션 표시
    showDiceAnimation(dice);
    
    document.getElementById('dice-result').textContent = `🎲 ${dice} 나옴!`;
    addEvent(`${player.name}이(가) ${dice}를 굴렸습니다.`);
    
    setTimeout(() => {
        movePlayer(dice);
    }, 1500);
}

// 주사위 애니메이션 표시
function showDiceAnimation(number) {
    const overlay = document.getElementById('dice-overlay');
    const animation = document.getElementById('dice-animation');
    const cube = document.getElementById('dice-cube');
    
    overlay.classList.add('active');
    animation.classList.add('active');
    
    // 애니메이션 중 랜덤 숫자 표시
    let count = 0;
    const interval = setInterval(() => {
        cube.textContent = Math.floor(Math.random() * 6) + 1;
        count++;
        if (count > 6) {
            clearInterval(interval);
            cube.textContent = number;
        }
    }, 80);
    
    // 1.2초 후 애니메이션 종료
    setTimeout(() => {
        overlay.classList.remove('active');
        animation.classList.remove('active');
    }, 1200);
}

// 플레이어 이동
function movePlayer(steps) {
    const player = gameState.players[gameState.currentPlayer];
    const oldPosition = player.position;
    player.position = (player.position + steps) % boardCells.length;
    
    // 시작점 통과 시 급여
    if (player.position < oldPosition) {
        player.money += 100000;
        addEvent(`${player.name}이(가) 시작점을 지나 급여 100,000원을 받았습니다!`);
        showBoardMessage('🎊 시작점 통과! +100,000원', 'default', 2000);
    }
    
    updatePlayerPosition(gameState.currentPlayer);
    
    setTimeout(() => {
        handleLanding();
    }, 600);
}

// 플레이어 위치 업데이트
function updatePlayerPosition(playerIndex) {
    const player = gameState.players[playerIndex];
    const token = document.getElementById(`player-${playerIndex}-token`);
    const cell = document.getElementById(`cell-${player.position}`);
    
    if (cell && token) {
        const rect = cell.getBoundingClientRect();
        const boardRect = document.getElementById('game-board').getBoundingClientRect();
        
        token.style.left = `${rect.left - boardRect.left + 40 + playerIndex * 25}px`;
        token.style.top = `${rect.top - boardRect.top + 40}px`;
    }
}

// 착지 처리
function handleLanding() {
    const player = gameState.players[gameState.currentPlayer];
    const cell = boardCells[player.position];
    
    addEvent(`${player.name}이(가) ${cell.name}에 도착했습니다.`);
    
    switch (cell.type) {
        case 'property':
            handleProperty(cell);
            break;
        case 'chance':
            handleChance();
            break;
        case 'tax':
            handleTax();
            break;
        case 'island':
            handleIsland();
            break;
        default:
            nextTurn();
    }
}

// 땅 처리
function handleProperty(cell) {
    const player = gameState.players[gameState.currentPlayer];
    const owner = gameState.players.find(p => p.properties.includes(cell.id));
    
    if (!owner) {
        // 빈 땅 - 구매 가능
        if (player.money >= cell.price) {
            if (gameState.currentPlayer === 0) {
                // 플레이어 - 선택권 제공
                gameState.pendingPurchase = cell;
                showPurchaseModal(cell);
            } else {
                // AI - 자동 구매 (돈이 충분하면 70% 확률로 구매)
                if (Math.random() < 0.7) {
                    purchaseProperty(cell);
                } else {
                    addEvent(`AI가 ${cell.name} 구매를 포기했습니다.`);
                    nextTurn();
                }
            }
        } else {
            addEvent(`${player.name}의 돈이 부족하여 구매할 수 없습니다.`);
            nextTurn();
        }
    } else if (owner === player) {
        // 본인 땅 - 업그레이드 가능
        if (cell.level < 3) {
            const upgradeCost = cell.price * 0.5; // 업그레이드 비용은 땅 가격의 50%
            
            // 돈이 부족하면 판매 선택 모달
            if (player.money < upgradeCost) {
                if (gameState.currentPlayer === 0) {
                    // 플레이어 - 판매 선택 모달
                    showSellSelectionModal(upgradeCost, () => {
                        // 판매 후 다시 업그레이드 시도
                        if (player.money >= upgradeCost) {
                            upgradeProperty(cell, upgradeCost);
                        } else {
                            addEvent('자금이 부족하여 업그레이드할 수 없습니다.');
                            nextTurn();
                        }
                    });
                } else {
                    // AI - 자동 판매 시도
                    if (aiAutoSell(player, upgradeCost)) {
                        upgradeProperty(cell, upgradeCost);
                    } else {
                        addEvent('AI의 자금이 부족하여 업그레이드할 수 없습니다.');
                        nextTurn();
                    }
                }
            } else {
                // 돈이 충분하면 업그레이드 선택
                if (gameState.currentPlayer === 0) {
                    // 플레이어 - 선택권 제공
                    gameState.pendingUpgrade = cell;
                    showUpgradeModal(cell, upgradeCost);
                } else {
                    // AI - 자동 업그레이드 (50% 확률)
                    if (Math.random() < 0.5) {
                        upgradeProperty(cell, upgradeCost);
                    } else {
                        addEvent(`AI가 ${cell.name} 업그레이드를 포기했습니다.`);
                        nextTurn();
                    }
                }
            }
        } else {
            addEvent(`${player.name}의 소유지입니다. (최고 레벨)`);
            nextTurn();
        }
    } else {
        // 다른 플레이어의 땅 - 통행료 지불 (레벨에 따라 배수 증가)
        const tollMultiplier = [1, 2, 3, 4][cell.level]; // 레벨 0,1,2,3 = 1배,2배,3배,4배
        const actualToll = cell.toll * tollMultiplier;
        
        // 돈이 부족하면 판매 선택 모달
        if (player.money < actualToll) {
            if (gameState.currentPlayer === 0) {
                // 플레이어 - 판매 선택 모달
                showSellSelectionModal(actualToll, () => {
                    // 판매 후 다시 통행료 지불 시도
                    if (player.money >= actualToll) {
                        player.money -= actualToll;
                        owner.money += actualToll;
                        const levelText = cell.level > 0 ? ` (Lv.${cell.level}, ${tollMultiplier}배)` : '';
                        addEvent(`${player.name}이(가) ${owner.name}에게 통행료 ${actualToll.toLocaleString()}원을 지불했습니다.${levelText}`);
                        showBoardMessage(`💸 통행료 -${actualToll.toLocaleString()}원${levelText}`, 'tax', 2500);
                        updateUI();
                        nextTurn();
                    } else {
                        // 모든 땅을 팔아도 돈이 부족하면 파산
                        checkBankruptcy();
                    }
                });
            } else {
                // AI - 자동 판매 시도
                if (aiAutoSell(player, actualToll)) {
                    player.money -= actualToll;
                    owner.money += actualToll;
                    const levelText = cell.level > 0 ? ` (Lv.${cell.level}, ${tollMultiplier}배)` : '';
                    addEvent(`${player.name}이(가) ${owner.name}에게 통행료 ${actualToll.toLocaleString()}원을 지불했습니다.${levelText}`);
                    showBoardMessage(`💸 통행료 -${actualToll.toLocaleString()}원${levelText}`, 'tax', 2500);
                    updateUI();
                    nextTurn();
                } else {
                    // AI도 모든 땅을 팔아도 돈이 부족하면 파산
                    checkBankruptcy();
                }
            }
        } else {
            // 돈이 충분하면 통행료 지불
            player.money -= actualToll;
            owner.money += actualToll;
            const levelText = cell.level > 0 ? ` (Lv.${cell.level}, ${tollMultiplier}배)` : '';
            addEvent(`${player.name}이(가) ${owner.name}에게 통행료 ${actualToll.toLocaleString()}원을 지불했습니다.${levelText}`);
            showBoardMessage(`💸 통행료 -${actualToll.toLocaleString()}원${levelText}`, 'tax', 2500);
            updateUI();
            nextTurn();
        }
    }
}

// 구매 모달 표시
function showPurchaseModal(cell) {
    document.getElementById('purchase-text').textContent = 
        `${cell.name}을(를) ${cell.price.toLocaleString()}원에 구매하시겠습니까?`;
    document.getElementById('purchase-modal').classList.add('active');
}

// 업그레이드 모달 표시
function showUpgradeModal(cell, cost) {
    const buildingNames = ['🏠 집', '🏢 빌딩', '🏰 호텔'];
    const nextBuilding = buildingNames[cell.level];
    const tollMultiplier = cell.level + 2; // 다음 레벨의 배수
    
    document.getElementById('upgrade-text').innerHTML = 
        `${cell.name}에 ${nextBuilding}을(를) 건설하시겠습니까?<br>
        <strong>비용: ${cost.toLocaleString()}원</strong><br>
        <span style="color: #666; font-size: 0.9em;">통행료가 ${tollMultiplier}배로 증가합니다!</span>`;
    document.getElementById('upgrade-modal').classList.add('active');
}

// 구매 확인
function confirmPurchase(buy) {
    document.getElementById('purchase-modal').classList.remove('active');
    
    if (buy && gameState.pendingPurchase) {
        purchaseProperty(gameState.pendingPurchase);
    } else {
        addEvent('구매를 취소했습니다.');
        nextTurn();
    }
    
    gameState.pendingPurchase = null;
}

// 업그레이드 확인
function confirmUpgrade(upgrade) {
    document.getElementById('upgrade-modal').classList.remove('active');
    
    if (upgrade && gameState.pendingUpgrade) {
        const cost = gameState.pendingUpgrade.price * 0.5;
        upgradeProperty(gameState.pendingUpgrade, cost);
    } else {
        addEvent('업그레이드를 취소했습니다.');
        nextTurn();
    }
    
    gameState.pendingUpgrade = null;
}

// 땅 구매
function purchaseProperty(cell) {
    const player = gameState.players[gameState.currentPlayer];
    player.money -= cell.price;
    player.properties.push(cell.id);
    
    addEvent(`${player.name}이(가) ${cell.name}을(를) 구매했습니다!`);
    showBoardMessage(`🏠 ${cell.name} 구매 성공!`, 'default', 2000);
    
    // 소유자 표시
    updateOwnerDisplay(cell.id, player);
    
    updateUI();
    nextTurn();
}

// 건물 업그레이드
function upgradeProperty(cell, cost) {
    const player = gameState.players[gameState.currentPlayer];
    player.money -= cost;
    cell.level++;
    
    const buildingNames = ['🏠 집', '🏢 빌딩', '🏰 호텔'];
    const buildingName = buildingNames[cell.level - 1];
    
    addEvent(`${player.name}이(가) ${cell.name}에 ${buildingName}을(를) 건설했습니다! (Lv.${cell.level})`);
    showBoardMessage(`🏗️ ${buildingName} 건설 완료!`, 'default', 2000);
    
    // 건물 레벨 표시 업데이트
    updateBuildingDisplay(cell.id, cell.level, player);
    
    updateUI();
    nextTurn();
}

// 소유자 표시 업데이트
function updateOwnerDisplay(cellId, player) {
    const ownerDiv = document.getElementById(`owner-${cellId}`);
    if (ownerDiv) {
        ownerDiv.textContent = player.name;
        ownerDiv.style.background = player.color;
    }
}

// 건물 레벨 표시 업데이트
function updateBuildingDisplay(cellId, level, player) {
    const levelDiv = document.getElementById(`level-${cellId}`);
    if (levelDiv && level > 0) {
        const buildingIcons = ['🏠', '🏢', '🏰'];
        levelDiv.textContent = buildingIcons[level - 1];
        levelDiv.style.display = 'block';
        levelDiv.style.background = player.color;
    }
}

// 황금열쇠
function handleChance() {
    const player = gameState.players[gameState.currentPlayer];
    const card = chanceCards[Math.floor(Math.random() * chanceCards.length)];
    
    player.money += card.money;
    addEvent(`황금열쇠: ${card.text}`);
    
    // 보드 중앙에 황금열쇠 메시지 표시
    const moneyText = card.money > 0 ? `+${card.money.toLocaleString()}원` : `${card.money.toLocaleString()}원`;
    showBoardMessage(`🔑 황금열쇠\n${card.text}`, 'golden', 3000);
    
    checkBankruptcy();
    if (!gameState.isGameOver) {
        updateUI();
        setTimeout(nextTurn, 3000);
    }
}

// 세금
function handleTax() {
    const player = gameState.players[gameState.currentPlayer];
    const tax = 50000;
    player.money -= tax;
    
    addEvent(`${player.name}이(가) 세금 ${tax.toLocaleString()}원을 납부했습니다.`);
    showBoardMessage(`💰 세금 납부\n-${tax.toLocaleString()}원`, 'tax', 2500);
    
    checkBankruptcy();
    if (!gameState.isGameOver) {
        updateUI();
        setTimeout(nextTurn, 2500);
    }
}

// 무인도
function handleIsland() {
    addEvent(`무인도에 도착했습니다. (이번 턴만 쉬어갑니다)`);
    showBoardMessage('🏝️ 무인도에서 휴식\n(한 턴 쉬어갑니다)', 'island', 2500);
    setTimeout(nextTurn, 2500);
}

// 파산 확인
function checkBankruptcy() {
    const player = gameState.players[gameState.currentPlayer];
    
    if (player.money < 0) {
        gameState.isGameOver = true;
        const winner = gameState.players[1 - gameState.currentPlayer];
        showGameOver(winner);
    }
}

// 게임 종료
function showGameOver(winner) {
    document.getElementById('game-over-text').innerHTML = 
        `<div style="font-size: 48px; margin: 20px 0;">🏆</div>
        <div style="font-size: 24px; color: ${winner.color}; font-weight: bold;">${winner.name} 승리!</div>
        <div style="margin-top: 20px; font-size: 16px;">
            최종 자산: ${winner.money.toLocaleString()}원<br>
            보유 땅: ${winner.properties.length}개
        </div>`;
    document.getElementById('game-over-modal').classList.add('active');
    addEvent(`🎉 게임 종료! ${winner.name}이(가) 승리했습니다!`);
}

// 다음 턴
function nextTurn() {
    gameState.currentPlayer = 1 - gameState.currentPlayer;
    updateUI();
    
    const player = gameState.players[gameState.currentPlayer];
    addEvent(`${player.name}의 차례입니다.`);
    
    if (gameState.currentPlayer === 1 && !gameState.isGameOver) {
        // AI 턴
        document.getElementById('roll-dice-btn').disabled = true;
        setTimeout(() => {
            rollDice();
        }, 1500);
    } else {
        document.getElementById('roll-dice-btn').disabled = false;
    }
}

// UI 업데이트
function updateUI() {
    gameState.players.forEach((player, index) => {
        document.getElementById(`player${index + 1}-money`).textContent = player.money.toLocaleString();
        document.getElementById(`player${index + 1}-props`).textContent = player.properties.length;
        
        const infoDiv = document.getElementById(`player${index + 1}-info`);
        if (gameState.currentPlayer === index) {
            infoDiv.classList.add('active');
        } else {
            infoDiv.classList.remove('active');
        }
    });
}

// 이벤트 로그 추가
function addEvent(text) {
    const log = document.getElementById('event-log');
    const item = document.createElement('div');
    item.className = 'event-log-item';
    item.textContent = `• ${text}`;
    log.insertBefore(item, log.firstChild);
    
    // 최대 10개만 유지
    while (log.children.length > 10) {
        log.removeChild(log.lastChild);
    }
}

// 판매 선택 모달 표시
function showSellSelectionModal(neededMoney, callback) {
    const player = gameState.players[gameState.currentPlayer];
    
    if (player.properties.length === 0) {
        // 보유한 땅이 없으면 바로 파산
        addEvent('보유한 땅이 없어 판매할 수 없습니다.');
        checkBankruptcy();
        return;
    }
    
    gameState.sellSelection.neededMoney = neededMoney;
    gameState.sellSelection.callback = callback;
    gameState.sellSelection.selectedProperties = [];
    
    const deficit = neededMoney - player.money;
    document.getElementById('sell-select-text').innerHTML = 
        `현재 자금이 <strong style="color: #f44336;">${deficit.toLocaleString()}원</strong> 부족합니다.<br>
        판매할 땅을 선택해주세요. (클릭하여 선택/해제)`;
    
    const listDiv = document.getElementById('sell-select-list');
    listDiv.innerHTML = '';
    
    player.properties.forEach(propertyId => {
        const cell = boardCells[propertyId];
        const upgradeCost = cell.level * (cell.price * 0.5);
        const sellPrice = Math.floor((cell.price + upgradeCost) * 0.7);
        
        const buildingIcons = ['빈 땅', '🏠 집', '🏢 빌딩', '🏰 호텔'];
        const buildingText = buildingIcons[cell.level];
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'sell-select-item';
        itemDiv.dataset.propertyId = propertyId;
        itemDiv.dataset.sellPrice = sellPrice;
        
        itemDiv.innerHTML = `
            <div class="sell-select-info">
                <div class="sell-select-name">${cell.name} (${buildingText})</div>
                <div class="sell-select-price">판매가: ${sellPrice.toLocaleString()}원</div>
            </div>
        `;
        
        itemDiv.addEventListener('click', () => togglePropertySelection(itemDiv));
        listDiv.appendChild(itemDiv);
    });
    
    updateSellSelectionTotal();
    document.getElementById('sell-select-modal').classList.add('active');
}

// 땅 선택 토글
function togglePropertySelection(itemDiv) {
    const propertyId = parseInt(itemDiv.dataset.propertyId);
    const index = gameState.sellSelection.selectedProperties.indexOf(propertyId);
    
    if (index > -1) {
        // 선택 해제
        gameState.sellSelection.selectedProperties.splice(index, 1);
        itemDiv.classList.remove('selected');
    } else {
        // 선택
        gameState.sellSelection.selectedProperties.push(propertyId);
        itemDiv.classList.add('selected');
    }
    
    updateSellSelectionTotal();
}

// 선택한 땅 총 판매가 업데이트
function updateSellSelectionTotal() {
    let total = 0;
    const items = document.querySelectorAll('.sell-select-item.selected');
    
    items.forEach(item => {
        total += parseInt(item.dataset.sellPrice);
    });
    
    document.getElementById('sell-select-total').textContent = `${total.toLocaleString()}원`;
}

// 판매 선택 확인
function confirmSellSelection() {
    const player = gameState.players[gameState.currentPlayer];
    
    if (gameState.sellSelection.selectedProperties.length === 0) {
        alert('판매할 땅을 선택해주세요.');
        return;
    }
    
    // 선택한 땅들 판매
    let totalSellPrice = 0;
    gameState.sellSelection.selectedProperties.forEach(propertyId => {
        const cell = boardCells[propertyId];
        const upgradeCost = cell.level * (cell.price * 0.5);
        const sellPrice = Math.floor((cell.price + upgradeCost) * 0.7);
        
        executeSell(gameState.currentPlayer, propertyId, sellPrice);
        totalSellPrice += sellPrice;
    });
    
    addEvent(`${player.name}이(가) ${gameState.sellSelection.selectedProperties.length}개의 땅을 ${totalSellPrice.toLocaleString()}원에 판매했습니다.`);
    
    document.getElementById('sell-select-modal').classList.remove('active');
    
    // 콜백 실행
    if (gameState.sellSelection.callback) {
        gameState.sellSelection.callback();
    }
    
    // 초기화
    gameState.sellSelection.selectedProperties = [];
    gameState.sellSelection.callback = null;
}

// 판매 선택 취소
function cancelSellSelection() {
    document.getElementById('sell-select-modal').classList.remove('active');
    
    const player = gameState.players[gameState.currentPlayer];
    const neededMoney = gameState.sellSelection.neededMoney;
    
    gameState.sellSelection.selectedProperties = [];
    gameState.sellSelection.callback = null;
    gameState.sellSelection.neededMoney = 0;
    
    // 돈이 부족한 상태에서 취소한 경우
    if (player.money < neededMoney) {
        // 통행료나 필수 지불인 경우 파산 처리
        if (player.money < 0) {
            checkBankruptcy();
        } else {
            // 업그레이드 등 선택적인 경우 그냥 다음 턴으로
            addEvent(`${player.name}이(가) 거래를 취소했습니다.`);
            nextTurn();
        }
    } else {
        // 돈이 충분한 경우에도 다음 턴으로
        nextTurn();
    }
}

// 판매 실행 (내부 함수)
function executeSell(playerIndex, propertyId, sellPrice) {
    const player = gameState.players[playerIndex];
    const cell = boardCells[propertyId];
    
    // 소유권 제거
    player.properties = player.properties.filter(id => id !== propertyId);
    
    // 돈 받기
    player.money += sellPrice;
    
    // 건물 레벨 초기화
    cell.level = 0;
    
    // UI 업데이트
    const ownerDiv = document.getElementById(`owner-${propertyId}`);
    if (ownerDiv) {
        ownerDiv.textContent = '';
        ownerDiv.style.background = '';
    }
    
    const levelDiv = document.getElementById(`level-${propertyId}`);
    if (levelDiv) {
        levelDiv.style.display = 'none';
    }
    
    updateUI();
}

// AI 자동 판매 (파산 방지)
function aiAutoSell(aiPlayer, neededMoney) {
    // 소유한 땅이 없으면 판매 불가
    if (aiPlayer.properties.length === 0) return false;
    
    addEvent('AI가 자금 부족으로 땅 판매를 시작합니다...');
    
    // 가장 낮은 레벨의 땅부터 판매
    const sortedProperties = [...aiPlayer.properties].sort((a, b) => {
        return boardCells[a].level - boardCells[b].level;
    });
    
    let totalSold = 0;
    for (const propertyId of sortedProperties) {
        const cell = boardCells[propertyId];
        const upgradeCost = cell.level * (cell.price * 0.5);
        const sellPrice = Math.floor((cell.price + upgradeCost) * 0.7);
        
        // 판매 실행
        executeSell(1, propertyId, sellPrice);
        totalSold += sellPrice;
        addEvent(`AI가 ${cell.name}을(를) ${sellPrice.toLocaleString()}원에 판매했습니다.`);
        
        // 필요한 돈을 모았으면 중단
        if (aiPlayer.money >= neededMoney) {
            addEvent(`AI가 총 ${totalSold.toLocaleString()}원을 확보했습니다.`);
            return true;
        }
    }
    
    // 모든 땅을 팔았는데도 부족
    if (aiPlayer.money < neededMoney) {
        addEvent('AI가 모든 땅을 팔았지만 자금이 부족합니다.');
        return false;
    }
    
    return true;
}

// 홈으로
function goHome() {
    window.location.href = 'index.html';
}

// 게임 시작
window.onload = initGame;
