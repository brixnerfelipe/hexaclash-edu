// js/logic.js

var gameState = {
    status: 'lobby', // 'LOBBY', 'TURN_START', 'DRAFT', 'ATTACK', 'GAMEOVER'
    players: {},
    territories: [],
    turn: 1,
    currentPlayerIndex: 0,
    draftArmies: 0,
    questionBank: [],
    actionLogs: []
};

function addGameLog(message) {
    if (!gameState.actionLogs) gameState.actionLogs = [];
    const time = new Date().toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit' });
    gameState.actionLogs.push({ time, message });
    if (gameState.actionLogs.length > 50) gameState.actionLogs.shift();
}

function initGame() {
    gameState.territories = JSON.parse(JSON.stringify(TERRITORIES));
    gameState.players = {};
    gameState.status = 'lobby';
    gameState.actionLogs = [];
    // Não limpa o questionBank aqui para não perder o CSV no restart
}

const PLAYER_COLORS = [
    '#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'
];

function addTestPlayer() {
    if (gameState.status !== 'lobby') return;
    
    const nextPlayerId = Object.keys(gameState.players).length + 1;
    const color = PLAYER_COLORS[(nextPlayerId - 1) % PLAYER_COLORS.length];
    
    gameState.players[nextPlayerId] = {
        id: nextPlayerId,
        name: `Player ${nextPlayerId}`,
        color: color,
        objective: null,
        territoriesCount: 0,
        totalArmies: 0,
        armiesNextTurn: 0,
        resolvedQuestions: [] // Memória de acertos
    };
}

function startGame() {
    const playerIds = Object.keys(gameState.players).map(Number);
    if (playerIds.length < 2) return;
    
    redistributeMap(playerIds);
    assignDynamicObjectives(playerIds);
    
    // Inicia o Turno 1
    gameState.turn = 1;
    gameState.currentPlayerIndex = 0;
    startTurn();
}

function redistributeMap(playerIds) {
    gameState.territories.forEach(t => {
        t.owner = null;
        t.armies = 0;
    });
    
    const shuffled = [...gameState.territories].sort(() => 0.5 - Math.random());
    const territoriesPerPlayer = Math.floor(shuffled.length / playerIds.length);
    let index = 0;
    
    // Auto-fill: 25 exércitos iniciais totais por jogador
    const TOTAL_INITIAL_ARMIES = 25;

    for (const pId of playerIds) {
        let playerTerritories = [];
        
        // Fase 1: Garante 1 exército base por território
        for (let i = 0; i < territoriesPerPlayer; i++) {
            const t = shuffled[index++];
            t.owner = pId;
            t.armies = 1;
            playerTerritories.push(t);
        }
        
        // Fase 2: Distribui as sobras
        let remainingArmies = TOTAL_INITIAL_ARMIES - territoriesPerPlayer;
        while(remainingArmies > 0) {
            const randomT = playerTerritories[Math.floor(Math.random() * playerTerritories.length)];
            randomT.armies++;
            remainingArmies--;
        }
    }
}

function assignDynamicObjectives(playerIds) {
    const totalPlayers = playerIds.length;
    const is2P = totalPlayers === 2;
    
    const impTarget = is2P ? 32 : Math.min(26, Math.floor(42 / totalPlayers) + Math.floor(42 * 0.3));
    const stratTarget = is2P ? 24 : Math.min(18, Math.floor(42 / totalPlayers) + 6);
    
    const geopoliticCombos = [
        ['Gamma', 'Epsilon'],
        ['Delta', 'Zeta'],
        ['Beta', 'Zeta'],
        ['Alpha', 'Zeta']
    ];
    
    playerIds.forEach(pId => {
        const p = gameState.players[pId];
        
        if (is2P) {
            p.objective = { 
                type: 'IMPERIALIST', 
                target: impTarget,
                description: `O Supremo: Conquistar e manter ${impTarget} territórios.` 
            };
        } else {
            const objType = Math.floor(Math.random() * 4); // 0, 1, 2, 3
            
            if (objType === 0) {
                p.objective = { 
                    type: 'IMPERIALIST', 
                    target: impTarget,
                    description: `O Imperialista: Conquistar e manter ${impTarget} territórios.` 
                };
            } else if (objType === 1) {
                const combo = geopoliticCombos[Math.floor(Math.random() * geopoliticCombos.length)];
                p.objective = { 
                    type: 'GEOPOLITIC', 
                    regions: combo,
                    description: `O Geopolítico: Ocupar 100% das regiões ${combo[0]} e ${combo[1]}.` 
                };
            } else if (objType === 2) {
                p.objective = { 
                    type: 'STRATEGIST', 
                    target: stratTarget,
                    description: `O Estrategista: Dominar ${stratTarget} territórios e manter no mínimo 2 exércitos em cada um deles.` 
                };
            } else {
                p.objective = { 
                    type: 'GLOBALIST', 
                    description: `O Globalista: Ter presença em todas as 6 regiões do mapa e dominar DUAS delas inteiramente.` 
                };
            }
        }
    });
}

function calculateNextTurnArmies(playerId) {
    const playerTerritories = gameState.territories.filter(t => t.owner === playerId);
    const count = playerTerritories.length;
    
    let baseArmies = Math.max(3, Math.floor(count / 2));
    let regionBonus = 0;
    
    for (const region of REGIONS) {
        const regionTerritories = gameState.territories.filter(t => t.region === region.name);
        const playerOwnsAll = regionTerritories.every(t => t.owner === playerId);
        if (playerOwnsAll && regionTerritories.length > 0) {
            regionBonus += region.bonus;
        }
    }
    
    return baseArmies + regionBonus;
}

function recalculateStats() {
    for (const pId in gameState.players) {
        const player = gameState.players[pId];
        const owned = gameState.territories.filter(t => t.owner === Number(pId));
        player.territoriesCount = owned.length;
        
        let totalArmies = 0;
        owned.forEach(t => { totalArmies += t.armies; });
        player.totalArmies = totalArmies;
        
        player.armiesNextTurn = calculateNextTurnArmies(Number(pId));
    }
}

// =======================
// FLUXO DO MOTOR DE TURNOS
// =======================

function getCurrentPlayerId() {
    const playerIds = Object.keys(gameState.players).map(Number);
    return playerIds[gameState.currentPlayerIndex];
}

function startTurn() {
    gameState.status = 'DRAFT';
    gameState.selectedOriginId = null;
    
    recalculateStats();
    
    const pId = getCurrentPlayerId();
    gameState.draftArmies = calculateNextTurnArmies(pId);
    
    const playerName = gameState.players[pId].name;
    addGameLog(`O jogador ${playerName} recebeu ${gameState.draftArmies} exércitos e começou seu turno.`);
    
    if (window.updateUIFull) window.updateUIFull();
}

function enterDraftPhase() {
    gameState.status = 'DRAFT';
    if (window.hideHotSeatModal) window.hideHotSeatModal();
    if (window.updateUIFull) window.updateUIFull();
}

function handleTerritoryClick(tId) {
    const currentPlayerId = getCurrentPlayerId();
    const t = gameState.territories.find(x => x.id === tId);
    if (!t) return;

    if (gameState.status === 'DRAFT') {
        if (t.owner === currentPlayerId && gameState.draftArmies > 0) {
            t.armies++;
            gameState.draftArmies--;
            recalculateStats();
            if (window.updateUIFull) window.updateUIFull();
            if (window.emitSync) window.emitSync();
        }
    } else if (gameState.status === 'ATTACK') {
        // Se clicar no origin de novo, deseleciona
        if (gameState.selectedOriginId === tId) {
            gameState.selectedOriginId = null;
            if (window.updateUIFull) window.updateUIFull();
            if (window.emitSync) window.emitSync();
            return;
        }

        // Seleção de Origem
        if (!gameState.selectedOriginId) {
            if (t.owner === currentPlayerId && t.armies > 1) {
                gameState.selectedOriginId = tId;
                if (window.updateUIFull) window.updateUIFull();
                if (window.emitSync) window.emitSync();
            }
        } else {
            // Seleção de Alvo
            const origin = gameState.territories.find(x => x.id === gameState.selectedOriginId);
            if (t.owner !== currentPlayerId && origin.neighbors.includes(tId)) {
                // Abre quiz se houver perguntas
                if (gameState.questionBank && gameState.questionBank.length > 0) {
                    if (window.showQuizModal) window.showQuizModal(origin.id, t.id);
                    if (window.socket && window.gameRoomPin) window.socket.emit('combat_visual_start', { pin: window.gameRoomPin, originId: origin.id, targetId: t.id });
                } else {
                    // Sem quiz, ataque direto!
                    if (window.submitQuizAnswer) window.submitQuizAnswer(true, origin.id, t.id, null);
                    if (window.socket && window.gameRoomPin) window.socket.emit('combat_visual_start', { pin: window.gameRoomPin, originId: origin.id, targetId: t.id });
                }
            } else if (t.owner === currentPlayerId && t.armies > 1) {
                // Troca origem se clicou em outro território próprio válido
                gameState.selectedOriginId = tId;
                if (window.updateUIFull) window.updateUIFull();
                if (window.emitSync) window.emitSync();
            }
        }
    }
}

function enterAttackPhase() {
    if (gameState.status !== 'DRAFT' || gameState.draftArmies > 0) return;
    gameState.status = 'ATTACK';
    if (window.updateUIFull) window.updateUIFull();
}

function checkWinCondition(playerId) {
    const p = gameState.players[playerId];
    if (!p || !p.objective) return false;
    
    const obj = p.objective;
    const playerTerritories = gameState.territories.filter(t => t.owner === playerId);
    
    if (obj.type === 'IMPERIALIST') {
        return playerTerritories.length >= obj.target;
    } 
    else if (obj.type === 'GEOPOLITIC') {
        const r1 = obj.regions[0];
        const r2 = obj.regions[1];
        const ownsAllR1 = gameState.territories.filter(t => t.region === r1).every(t => t.owner === playerId);
        const ownsAllR2 = gameState.territories.filter(t => t.region === r2).every(t => t.owner === playerId);
        return ownsAllR1 && ownsAllR2;
    }
    else if (obj.type === 'STRATEGIST') {
        if (playerTerritories.length < obj.target) return false;
        // Check se "todos" os territórios dele tem >= 2
        // A regra diz: Dominar X territórios e manter no mínimo 2 exércitos em cada um deles
        // Isso quer dizer que ele tem X territórios que possuem >= 2 exércitos
        const fortifiedCount = playerTerritories.filter(t => t.armies >= 2).length;
        return fortifiedCount >= obj.target;
    }
    else if (obj.type === 'GLOBALIST') {
        // Presença nas 6 regiões
        const regionsSet = new Set(playerTerritories.map(t => t.region));
        if (regionsSet.size < 6) return false;
        
        // E dominar 2 inteiras
        let dominatedCount = 0;
        for (const region of REGIONS) {
            const regionTerritories = gameState.territories.filter(t => t.region === region.name);
            const ownsAll = regionTerritories.every(t => t.owner === playerId);
            if (ownsAll) dominatedCount++;
        }
        return dominatedCount >= 2;
    }
    
    return false;
}

function endAttackPhase() {
    if (gameState.status !== 'ATTACK') return;
    gameState.selectedOriginId = null;
    
    // Juiz verifica objetivo de fortificação
    if (checkWinCondition(getCurrentPlayerId())) {
        gameState.status = 'GAMEOVER';
        if (window.showVictoryScreen) window.showVictoryScreen(getCurrentPlayerId());
        return;
    }
    
    nextTurn();
}

function parseCSVText(csvText) {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    const bank = [];
    
    function parseCSVLine(text) {
        const result = [];
        let startValueBnd = 0;
        let inQuotes = false;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (c === '"') {
                inQuotes = !inQuotes;
            } else if (c === ',' && !inQuotes) {
                result.push(text.substring(startValueBnd, i));
                startValueBnd = i + 1;
            }
        }
        result.push(text.substring(startValueBnd));
        
        // clean up quotes
        return result.map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    }
    
    lines.forEach((line, index) => {
        const cols = parseCSVLine(line);
        if (cols.length >= 5) {
            const q = cols[0];
            const c = cols[1];
            const w1 = cols[2];
            const w2 = cols[3];
            const w3 = cols[4];
            
            if (q && c && w1 && w2 && w3) {
                bank.push({
                    id: 'q_' + index,
                    question: q,
                    correctAnswer: c,
                    wrongAnswers: [w1, w2, w3]
                });
            }
        }
    });
    
    gameState.questionBank = bank;
    return bank.length;
}

function submitQuizAnswer(isCorrect, originId, targetId, questionId) {
    if (gameState.status !== 'ATTACK') return;
    
    if (isCorrect) {
        const currentPlayerId = getCurrentPlayerId();
        if (questionId) {
            gameState.players[currentPlayerId].resolvedQuestions.push(questionId);
        }
        executeCombat(originId, targetId);
    } else {
        if (window.showQuizFailureUI) window.showQuizFailureUI(originId, targetId);
    }
}

// Chamado apenas pelo Botão de Continuar na Falha
function applyQuizPenalty(originId) {
    const origin = gameState.territories.find(t => t.id === originId);
    const pName = gameState.players[origin.owner].name;
    if (origin.armies > 1) {
        origin.armies--;
        addGameLog(`💥 ${pName} falhou na estratégia e perdeu 1 exército em seu próprio território.`);
    } else {
        addGameLog(`💥 ${pName} falhou na estratégia.`);
    }
    gameState.selectedOriginId = null;
    recalculateStats();
    if (window.updateUIFull) window.updateUIFull();
    if (window.emitSync) window.emitSync();
    if (window.socket && window.gameRoomPin) window.socket.emit('combat_visual_end', { pin: window.gameRoomPin });
}

function executeCombat(originId, targetId) {
    const origin = gameState.territories.find(t => t.id === originId);
    const target = gameState.territories.find(t => t.id === targetId);
    
    const attackDiceCount = Math.min(origin.armies - 1, 3);
    const defenseDiceCount = Math.min(target.armies, 3);
    
    let attackRolls = [];
    for(let i=0; i<attackDiceCount; i++) attackRolls.push(Math.floor(Math.random()*6)+1);
    
    let defenseRolls = [];
    for(let i=0; i<defenseDiceCount; i++) defenseRolls.push(Math.floor(Math.random()*6)+1);
    
    attackRolls.sort((a,b) => b-a);
    defenseRolls.sort((a,b) => b-a);
    
    const comparisons = Math.min(attackRolls.length, defenseRolls.length);
    let attackLosses = 0;
    let defenseLosses = 0;
    
    // Calcula quem perde (apenas na matemática, ainda não salva no mapa)
    let attackLostIndexes = [];
    let defenseLostIndexes = [];
    
    for(let i=0; i<comparisons; i++) {
        if (attackRolls[i] > defenseRolls[i]) {
            defenseLosses++;
            defenseLostIndexes.push(i);
        } else {
            attackLosses++; // Empate é da defesa
            attackLostIndexes.push(i);
        }
    }
    
    let targetConquered = (target.armies - defenseLosses <= 0);
    
    // Dispara UI Assíncrona passando os dados brutos para o modal
    if (window.showBattleArena) {
        window.showBattleArena(
            attackRolls, defenseRolls, 
            attackLostIndexes, defenseLostIndexes, 
            attackLosses, defenseLosses, 
            targetConquered, attackDiceCount, 
            originId, targetId
        );
    }
}

// Chamado via botão Continuar no Battle Arena
function applyCombatResults(originId, targetId, attackLosses, defenseLosses, moveArmies, targetConquered) {
    const origin = gameState.territories.find(t => t.id === originId);
    const target = gameState.territories.find(t => t.id === targetId);
    
    const attackerName = gameState.players[origin.owner].name;
    const defenderName = (target.owner !== null && gameState.players[target.owner]) ? gameState.players[target.owner].name : "Forças Neutras";
    addGameLog(`⚔️ ${attackerName} atacou o território de ${defenderName}! ${attackerName} perdeu ${attackLosses} tropas e ${defenderName} perdeu ${defenseLosses}.`);
    
    origin.armies -= attackLosses;
    target.armies -= defenseLosses;
    
    if (targetConquered) {
        addGameLog(`🏆 VITÓRIA! ${attackerName} dominou um território de ${defenderName}.`);
        target.owner = origin.owner;
        origin.armies -= moveArmies;
        target.armies = moveArmies;
        gameState.selectedOriginId = null;
    }
    
    recalculateStats();
    if (window.updateUIFull) window.updateUIFull();
    
    // Juiz verifica expansão após combate
    if (targetConquered && checkWinCondition(origin.owner)) {
        gameState.status = 'GAMEOVER';
        gameState.winnerId = origin.owner;
        if (window.showVictoryScreen) window.showVictoryScreen(origin.owner);
    }
    
    if (window.emitSync) window.emitSync();
    if (window.socket && window.gameRoomPin) window.socket.emit('combat_visual_end', { pin: window.gameRoomPin });
}

function nextTurn() {
    const playerIds = Object.keys(gameState.players).map(Number);
    let loopProtect = 0;
    
    while (loopProtect < playerIds.length) {
        gameState.currentPlayerIndex++;
        
        if (gameState.currentPlayerIndex >= playerIds.length) {
            gameState.currentPlayerIndex = 0;
            gameState.turn++; // Nova rodada
        }
        
        const nextId = playerIds[gameState.currentPlayerIndex];
        if (!gameState.players[nextId].isEliminated) {
            break;
        }
        loopProtect++;
    }
    
    if (loopProtect >= playerIds.length) {
        gameState.status = 'GAMEOVER';
        if (window.showVictoryScreen) window.showVictoryScreen(null);
        return;
    }
    
    startTurn();
}

function kickPlayer(playerId) {
    if (!gameState.players[playerId]) return;
    
    // Marca como eliminado
    gameState.players[playerId].isEliminated = true;
    
    // Neutraliza territórios
    gameState.territories.forEach(t => {
        if (t.owner === Number(playerId)) {
            t.owner = null;
        }
    });
    
    addGameLog(`O jogador ${gameState.players[playerId].name} foi expulso da partida.`);
    
    // Se for o turno dele, pula a vez automaticamente
    if (getCurrentPlayerId() === Number(playerId)) {
        forceSkipTurn();
    } else {
        if (window.updateUIFull) window.updateUIFull();
        if (window.emitSync) window.emitSync();
    }
}

function forceSkipTurn() {
    addGameLog(`O turno foi pulado pelo professor.`);
    gameState.status = 'TURN_START';
    gameState.selectedOriginId = null;
    gameState.attackTimeRemaining = 0;
    nextTurn();
}

window.addTestPlayer = addTestPlayer;
window.startGame = startGame;
window.enterDraftPhase = enterDraftPhase;
window.handleTerritoryClick = handleTerritoryClick;
window.enterAttackPhase = enterAttackPhase;
window.endAttackPhase = endAttackPhase;
window.submitQuizAnswer = submitQuizAnswer;
window.applyQuizPenalty = applyQuizPenalty;
window.applyCombatResults = applyCombatResults;
window.getCurrentPlayerId = getCurrentPlayerId;
window.parseCSVText = parseCSVText;
window.kickPlayer = kickPlayer;
window.forceSkipTurn = forceSkipTurn;
window.gameState = gameState;

initGame();


