// js/ui.js

const SVG_NS = "http://www.w3.org/2000/svg";
const HEX_SIZE = 45; 
const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
const HEX_HEIGHT = 2 * HEX_SIZE;
const HEX_SIZE_UI = 44; 

function getHexPoints(centerX, centerY, size) {
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angle_deg = 60 * i - 30;
        const angle_rad = Math.PI / 180 * angle_deg;
        const x = centerX + size * Math.cos(angle_rad);
        const y = centerY + size * Math.sin(angle_rad);
        points.push(`${x},${y}`);
    }
    return points.join(' ');
}

function getPixelCoords(col, row) {
    const x = col * HEX_WIDTH + (row % 2) * (HEX_WIDTH / 2);
    const y = row * HEX_HEIGHT * 0.75;
    return { x, y };
}

function getRegionColor(regionName) {
    const r = REGIONS.find(rg => rg.name === regionName);
    return r ? r.color : '#ccc';
}

function renderMap() {
    const mapEl = document.getElementById('map-contents');
    if (!mapEl) return;
    mapEl.innerHTML = ''; 
    
    // Init pan-zoom se estiver no mobile e ainda n estiver instanciado
    if (window.innerWidth <= 768 && !window.panZoomInstance && typeof svgPanZoom !== 'undefined') {
        window.panZoomInstance = svgPanZoom('#game-map', {
            zoomEnabled: true,
            controlIconsEnabled: false,
            fit: true,
            center: true,
            minZoom: 0.5,
            maxZoom: 5
        });
    }
    
    const offsetX = 180;
    const offsetY = 100;
    const currentPlayerId = window.getCurrentPlayerId ? getCurrentPlayerId() : null;
    
    gameState.territories.forEach(t => {
        const coords = getPixelCoords(t.col, t.row);
        const x = coords.x + offsetX;
        const y = coords.y + offsetY;
        t.renderX = x;
        t.renderY = y;
        
        const g = document.createElementNS(SVG_NS, "g");
        g.setAttribute("class", "hex-group");
        
        // Verifica se é interativo para o draft ou attack
        let isInteractive = false;
        if (gameState.status === 'DRAFT') {
            isInteractive = (t.owner === currentPlayerId && gameState.draftArmies > 0);
        } else if (gameState.status === 'ATTACK') {
            if (!gameState.selectedOriginId) {
                isInteractive = (t.owner === currentPlayerId && t.armies > 1);
            } else {
                const origin = gameState.territories.find(x => x.id === gameState.selectedOriginId);
                // Pode clicar em vizinhos inimigos ou em outro território seu pra trocar a origem
                if ((t.owner !== currentPlayerId && origin.neighbors.includes(t.id)) || 
                    (t.owner === currentPlayerId && t.armies > 1)) {
                    isInteractive = true;
                }
            }
        }
        
        if (isInteractive) {
            g.classList.add('hex-interactive');
        }
        
        if (gameState.status === 'ATTACK' && gameState.selectedOriginId === t.id) {
            g.classList.add('hex-selected');
        }
        
        // Click Handler (Bind directly to UI element)
        g.addEventListener('click', () => {
            if (window.handleTerritoryClick) window.handleTerritoryClick(t.id);
        });
        
        const poly = document.createElementNS(SVG_NS, "polygon");
        poly.setAttribute("points", getHexPoints(x, y, HEX_SIZE_UI)); 
        poly.setAttribute("class", "hex-polygon");
        poly.setAttribute("fill", getRegionColor(t.region)); 
        
        g.appendChild(poly);

        if (t.owner) {
            const playerColor = gameState.players[t.owner].color;
            const token = document.createElementNS(SVG_NS, "circle");
            token.setAttribute("cx", x);
            token.setAttribute("cy", y);
            token.setAttribute("r", 15);
            token.setAttribute("fill", playerColor);
            token.setAttribute("stroke", "#111"); 
            token.setAttribute("stroke-width", "3");
            g.appendChild(token);
        }

        if (t.armies > 0) {
            const txtArmies = document.createElementNS(SVG_NS, "text");
            txtArmies.setAttribute("x", x);
            txtArmies.setAttribute("y", y + 2); 
            txtArmies.setAttribute("class", "hex-text-armies");
            txtArmies.setAttribute("style", "paint-order: stroke fill; fill: #fff; stroke: #111; stroke-width: 4px; font-weight: 900; font-size: 18px; text-anchor: middle; dominant-baseline: central;");
            
            // Highlight text se puder clicar
            if (isInteractive) {
                txtArmies.setAttribute("style", txtArmies.getAttribute("style") + " font-size: 20px;");
            }
            
            txtArmies.textContent = t.armies;
            g.appendChild(txtArmies);
        }

        mapEl.appendChild(g);
    });

    drawRegionLabels(mapEl);
}

function drawRegionLabels(mapEl) {
    const centers = {};
    const counts = {};
    
    gameState.territories.forEach(t => {
        if (!centers[t.region]) {
            centers[t.region] = { x: 0, y: 0 };
            counts[t.region] = 0;
        }
        centers[t.region].x += t.renderX;
        centers[t.region].y += t.renderY;
        counts[t.region]++;
    });
    
    const gLabels = document.createElementNS(SVG_NS, "g");
    gLabels.setAttribute("style", "pointer-events: none;");

    for (const regionName in centers) {
        const cx = centers[regionName].x / counts[regionName];
        const cy = centers[regionName].y / counts[regionName];
        
        const rData = REGIONS.find(rg => rg.name === regionName);
        const labelText = `${regionName.toUpperCase()} (+${rData.bonus})`;
        
        const width = labelText.length * 8 + 20;
        const height = 24;
        
        const rect = document.createElementNS(SVG_NS, "rect");
        rect.setAttribute("x", cx - width / 2);
        rect.setAttribute("y", cy - height / 2);
        rect.setAttribute("width", width);
        rect.setAttribute("height", height);
        rect.setAttribute("rx", 12); 
        rect.setAttribute("fill", "rgba(0,0,0,0.65)");
        
        const txt = document.createElementNS(SVG_NS, "text");
        txt.setAttribute("x", cx);
        txt.setAttribute("y", cy + 1);
        txt.setAttribute("fill", "#fff");
        txt.setAttribute("font-family", "sans-serif");
        txt.setAttribute("font-size", "11px");
        txt.setAttribute("font-weight", "bold");
        txt.setAttribute("text-anchor", "middle");
        txt.setAttribute("dominant-baseline", "central");
        txt.textContent = labelText;
        
        gLabels.appendChild(rect);
        gLabels.appendChild(txt);
    }
    
    mapEl.appendChild(gLabels);
}

function updateDashboard() {
    const listEl = document.getElementById('players-list');
    listEl.innerHTML = '';
    
    const playersArr = Object.values(gameState.players);
    const currentPlayerId = window.getCurrentPlayerId ? getCurrentPlayerId() : null;
    
    const btnAdd = document.getElementById('add-player-btn');
    const btnStart = document.getElementById('start-game-btn');
    const lobbyControls = document.getElementById('lobby-controls');
    const draftPanel = document.getElementById('draft-panel');
    const draftCounterText = document.getElementById('draft-counter-text');
    const btnConfirmDraft = document.getElementById('confirm-draft-btn');
    const attackPanel = document.getElementById('attack-panel');
    const csvCountText = document.getElementById('csv-count');
    
    if (csvCountText) {
        csvCountText.textContent = `Questões válidas: ${gameState.questionBank ? gameState.questionBank.length : 0}`;
    }
    
    if (gameState.status !== 'lobby') {
        lobbyControls.style.display = 'none';
        
        // Oculta painéis se não for a vez deste socket
        const isMyTurn = (typeof window.socket !== 'undefined' && window.socket.id === gameState.players[currentPlayerId].id);

        if (gameState.status === 'DRAFT' && isMyTurn) {
            draftPanel.style.display = 'block';
            attackPanel.style.display = 'none';
            draftCounterText.textContent = `Exércitos para distribuir: ${gameState.draftArmies}`;
            
            if (gameState.draftArmies === 0) {
                btnConfirmDraft.style.display = 'block';
                draftPanel.style.backgroundColor = '#2ecc71'; 
            } else {
                btnConfirmDraft.style.display = 'none';
                draftPanel.style.backgroundColor = '#f1c40f'; 
            }
        } else if (gameState.status === 'ATTACK' && isMyTurn) {
            draftPanel.style.display = 'none';
            attackPanel.style.display = 'block';
        } else {
            draftPanel.style.display = 'none';
            attackPanel.style.display = 'none';
        }
        
    } else {
        lobbyControls.style.display = 'block';
        const hasEnoughQuestions = gameState.questionBank && gameState.questionBank.length >= 10;
        btnStart.disabled = playersArr.length < 2 || !hasEnoughQuestions;
        draftPanel.style.display = 'none';
        attackPanel.style.display = 'none';
    }
    
    // --- LÓGICA MOBILE HUD ---
    const mobileBottomPanel = document.getElementById('mobile-bottom-panel');
    const mobileTurnBadge = document.getElementById('mobile-turn-badge');
    const mobileDraftBox = document.getElementById('mobile-draft-box');
    const mobileAttackBox = document.getElementById('mobile-attack-box');
    const mobileDraftText = document.getElementById('mobile-draft-text');
    const mobileBtnConfirmDraft = document.getElementById('mobile-btn-confirm-draft');
    
    if (gameState.status !== 'lobby') {
        const isMyTurn = (typeof window.socket !== 'undefined' && window.socket.id === gameState.players[currentPlayerId].id);
        
        if (mobileBottomPanel) {
            mobileBottomPanel.style.display = 'flex';
            mobileTurnBadge.style.display = isMyTurn ? 'block' : 'none';
            
            if (window.socket) {
                const me = Object.values(gameState.players).find(p => p.id === window.socket.id);
                if (me) {
                    document.getElementById('mobile-color-swatch').style.backgroundColor = me.color;
                    document.getElementById('mobile-player-name').textContent = me.name;
                    document.getElementById('mobile-stat-terr').textContent = `Territórios: ${me.territoriesCount}`;
                    document.getElementById('mobile-stat-armies').textContent = `Exércitos no Mapa: ${me.totalArmies}`;
                    document.getElementById('mobile-stat-bonus').textContent = `Ganhos Base/Bônus: +${me.armiesNextTurn}`;
                    document.getElementById('mobile-player-objective').textContent = me.objective ? me.objective.description : 'Objetivo Oculto';
                }
            }

            if (gameState.status === 'DRAFT' && isMyTurn) {
                mobileDraftBox.style.display = 'block';
                mobileAttackBox.style.display = 'none';
                mobileDraftText.textContent = `Exércitos para distribuir: ${gameState.draftArmies}`;
                
                if (gameState.draftArmies === 0) {
                    mobileBtnConfirmDraft.style.display = 'block';
                    mobileDraftBox.style.backgroundColor = '#2ecc71'; 
                } else {
                    mobileBtnConfirmDraft.style.display = 'none';
                    mobileDraftBox.style.backgroundColor = '#f1c40f'; 
                }
            } else if (gameState.status === 'ATTACK' && isMyTurn) {
                mobileDraftBox.style.display = 'none';
                mobileAttackBox.style.display = 'block';
            } else {
                mobileDraftBox.style.display = 'none';
                mobileAttackBox.style.display = 'none';
            }
        }
    } else {
        if (mobileBottomPanel) mobileBottomPanel.style.display = 'none';
        if (mobileTurnBadge) mobileTurnBadge.style.display = 'none';
    }
    // -------------------------

    
    for (const p of playersArr) {
        const card = document.createElement('div');
        card.className = 'player-card';
        
        // Destacar o jogador atual
        if (gameState.status !== 'lobby' && p.id === currentPlayerId) {
            card.classList.add('active-player');
        }
        
        let content = `
            <h2>
                <div class="player-color-swatch" style="background-color: ${p.color}"></div>
                ${p.name}
            </h2>
        `;
        
        if (gameState.status === 'lobby') {
            content += `<div class="player-stat">Aguardando no Lobby...</div>`;
        } else {
            let objectiveText = "Objetivo Oculto";
            if (typeof window.socket !== 'undefined' && window.socket.id === p.id) {
                objectiveText = p.objective ? p.objective.description : '';
            }
            content += `
                <div class="player-stat">Territórios: ${p.territoriesCount}</div>
                <div class="player-stat">Exércitos no Mapa: ${p.totalArmies}</div>
                <div class="player-stat">Ganhos Base/Bônus: +${p.armiesNextTurn}</div>
                <div class="player-objective"><strong>Objetivo:</strong><br>${objectiveText}</div>
            `;
        }
        
        card.innerHTML = content;
        listEl.appendChild(card);
    }
}

function updateInteractionOverlay() {
    if (gameState.status === 'lobby' || gameState.status === 'GAMEOVER') {
        const overlay = document.getElementById('turn-overlay');
        if (overlay) overlay.style.display = 'none';
        return;
    }
    
    const currentPlayerId = getCurrentPlayerId();
    const activePlayerSocket = gameState.players[currentPlayerId].id;
    const isMyTurn = (typeof window.socket !== 'undefined' && window.socket.id === activePlayerSocket);
    
    let overlay = document.getElementById('turn-overlay');
    if (!isMyTurn) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'turn-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
            overlay.style.zIndex = '900';
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';
            overlay.style.color = 'white';
            overlay.style.fontSize = '30px';
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
        const pName = gameState.players[currentPlayerId].name;
        overlay.innerHTML = `<h1>Aguardando a vez de: <span style="color:${gameState.players[currentPlayerId].color}">${pName}</span></h1>`;
    } else {
        if (overlay) overlay.style.display = 'none';
    }
}

// Globals exposed for logic.js to trigger UI updates
window.updateUIFull = () => {
    renderMap();
    updateDashboard();
    updateInteractionOverlay();
};

window.showHotSeatModal = () => {
    const modal = document.getElementById('hotseat-modal');
    const title = document.getElementById('hotseat-player-name');
    const mapContainer = document.getElementById('map-container');
    const pId = getCurrentPlayerId();
    const pName = gameState.players[pId].name;
    const pColor = gameState.players[pId].color;
    
    title.textContent = `Vez do: ${pName}!`;
    title.style.color = pColor;
    
    mapContainer.classList.add('blurred');
    modal.style.display = 'flex';
    
    updateDashboard();
};

window.hideHotSeatModal = () => {
    const modal = document.getElementById('hotseat-modal');
    const mapContainer = document.getElementById('map-container');
    
    mapContainer.classList.remove('blurred');
    modal.style.display = 'none';
};

let quizTimerInterval = null;

window.showQuizModal = (originId, targetId) => {
    const modal = document.getElementById('quiz-modal');
    const activeContent = document.getElementById('quiz-content-active');
    const failureContent = document.getElementById('quiz-content-failure');
    
    activeContent.style.display = 'block';
    failureContent.style.display = 'none';
    
    const questionEl = document.getElementById('quiz-question');
    const optionsEl = document.getElementById('quiz-options');
    const timerBar = document.getElementById('timer-bar');
    const currentPlayerId = window.getCurrentPlayerId ? window.getCurrentPlayerId() : null;
    let availableQuestions = gameState.questionBank;
    
    if (currentPlayerId) {
        const resolved = gameState.players[currentPlayerId].resolvedQuestions;
        availableQuestions = gameState.questionBank.filter(q => !resolved.includes(q.id));
        
        if (availableQuestions.length === 0) {
            // ZEROU O BANCO! Modo Revisão Ativado
            alert('🏆 VOCÊ ZEROU O BANCO! Modo Revisão Ativado!');
            gameState.players[currentPlayerId].resolvedQuestions = [];
            availableQuestions = gameState.questionBank;
        }
    }
    
    const questionData = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    
    questionEl.textContent = questionData.question;
    optionsEl.innerHTML = '';
    
    // Junta e Embaralha (Fisher-Yates)
    const options = [questionData.correctAnswer, ...questionData.wrongAnswers];
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    
    options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'btn-quiz-option';
        btn.textContent = opt;
        btn.onclick = () => {
            clearInterval(quizTimerInterval);
            const isCorrect = (opt === questionData.correctAnswer);
            if (isCorrect) {
                hideQuizModal();
            }
            if(window.submitQuizAnswer) window.submitQuizAnswer(isCorrect, originId, targetId, questionData.id);
        };
        optionsEl.appendChild(btn);
    });
    
    modal.style.display = 'flex';
    
    timerBar.style.transition = 'none';
    timerBar.style.width = '100%';
    void timerBar.offsetWidth; 
    
    timerBar.style.transition = 'width 20s linear';
    timerBar.style.width = '0%';
    
    let timeLeft = 20;
    quizTimerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(quizTimerInterval);
            if(window.submitQuizAnswer) window.submitQuizAnswer(false, originId, targetId);
        }
    }, 1000);
};

window.showQuizFailureUI = (originId, targetId) => {
    const activeContent = document.getElementById('quiz-content-active');
    const failureContent = document.getElementById('quiz-content-failure');
    const btnFailContinue = document.getElementById('btn-quiz-fail-continue');
    
    activeContent.style.display = 'none';
    failureContent.style.display = 'block';
    
    btnFailContinue.onclick = () => {
        hideQuizModal();
        if(window.applyQuizPenalty) window.applyQuizPenalty(originId);
    };
};

function hideQuizModal() {
    const modal = document.getElementById('quiz-modal');
    modal.style.display = 'none';
    if(quizTimerInterval) clearInterval(quizTimerInterval);
}
window.hideQuizModal = hideQuizModal;

let battleDiceInterval = null;

window.showBattleArena = (attackRolls, defenseRolls, attackLostIndexes, defenseLostIndexes, attackLosses, defenseLosses, targetConquered, moveArmies, originId, targetId) => {
    const modal = document.getElementById('battle-modal');
    const attackContainer = document.getElementById('battle-dice-attack');
    const defenseContainer = document.getElementById('battle-dice-defense');
    const resultsText = document.getElementById('battle-results-text');
    const btnContinue = document.getElementById('btn-battle-continue');
    
    attackContainer.innerHTML = '';
    defenseContainer.innerHTML = '';
    resultsText.innerHTML = '';
    btnContinue.style.display = 'none';
    
    // Cria os dados de ataque
    const attackDiceEls = [];
    for(let i=0; i<attackRolls.length; i++) {
        const d = document.createElement('div');
        d.className = 'dice dice-attack dice-shake';
        d.textContent = '?';
        attackContainer.appendChild(d);
        attackDiceEls.push(d);
    }
    
    // Cria os dados de defesa
    const defenseDiceEls = [];
    for(let i=0; i<defenseRolls.length; i++) {
        const d = document.createElement('div');
        d.className = 'dice dice-defense dice-shake';
        d.textContent = '?';
        defenseContainer.appendChild(d);
        defenseDiceEls.push(d);
    }
    
    modal.style.display = 'flex';
    
    // Animação fake
    battleDiceInterval = setInterval(() => {
        attackDiceEls.forEach(el => el.textContent = Math.floor(Math.random() * 6) + 1);
        defenseDiceEls.forEach(el => el.textContent = Math.floor(Math.random() * 6) + 1);
    }, 100);
    
    // Após 1.5s, para e mostra o real
    setTimeout(() => {
        clearInterval(battleDiceInterval);
        
        // Injeta os reais
        attackDiceEls.forEach((el, index) => {
            el.textContent = attackRolls[index];
            el.classList.remove('dice-shake');
            if (attackLostIndexes.includes(index)) {
                el.classList.add('dice-lost');
            }
        });
        
        defenseDiceEls.forEach((el, index) => {
            el.textContent = defenseRolls[index];
            el.classList.remove('dice-shake');
            if (defenseLostIndexes.includes(index)) {
                el.classList.add('dice-lost');
            }
        });
        
        // Mensagem de resultado
        let msg = `Atacante perdeu ${attackLosses} exército(s).<br>Defensor perdeu ${defenseLosses} exército(s).`;
        if (targetConquered) {
            msg += `<br><br><span style="color:#27ae60">VITÓRIA!</span> Território conquistado! ${moveArmies} exército(s) transferidos.`;
        }
        resultsText.innerHTML = msg;
        
        // Exibe botão pra concluir a mutação de estado
        btnContinue.style.display = 'inline-block';
        btnContinue.onclick = () => {
            modal.style.display = 'none';
            if(window.applyCombatResults) {
                window.applyCombatResults(originId, targetId, attackLosses, defenseLosses, moveArmies, targetConquered);
            }
        };
        
    }, 1500);
};

window.showVictoryScreen = (playerId) => {
    const modal = document.getElementById('victory-modal');
    const subtitle = document.getElementById('victory-subtitle');
    const objectiveText = document.getElementById('victory-objective');
    const confettiContainer = document.getElementById('confetti-container');
    const mapContainer = document.getElementById('map-container');
    
    const p = gameState.players[playerId];
    
    // Blur do mapa
    mapContainer.classList.add('blurred');
    
    // Textos
    subtitle.innerHTML = `O jogador <span style="color:${p.color}">${p.name}</span> dominou o mapa!`;
    objectiveText.innerHTML = p.objective.description;
    
    // Confetes
    confettiContainer.innerHTML = '';
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];
    
    for (let i = 0; i < 60; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.left = Math.random() * 100 + '%';
        piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
        piece.style.animationDelay = (Math.random() * 2) + 's';
        confettiContainer.appendChild(piece);
    }
    
    modal.style.display = 'flex';
};

