// js/main.js

const socket = window.socket || io();
const urlParams = new URLSearchParams(window.location.search);
const roomPin = urlParams.get('room');

if (roomPin) {
    socket.emit('host_join', roomPin);
}

socket.on('update_players', (data) => {
    // Atualiza a visualização dos jogadores conectados
    // Esta parte será conectada futuramente com a UI de jogadores do lobby (Add Player nativo)
    // Por enquanto, apenas logamos
    console.log("Players na sala:", data.players);
});

socket.on('sync_state', (state) => {
    try {
        console.log("Recebeu sync_state!", state);
        
        // Sobrescreve o gameState global
        window.gameState = state;
        
        // Esconde lobby/waiting, mostra jogo se status não for lobby
        if (state.status !== 'lobby') {
            const loginScreen = document.getElementById('login-screen');
            const waitingScreen = document.getElementById('waiting-screen');
            const gameUI = document.getElementById('game-ui');
            if(loginScreen) loginScreen.style.display = 'none';
            if(waitingScreen) waitingScreen.style.display = 'none';
            if(gameUI) gameUI.style.display = 'block';
            
            const subtitle = document.getElementById('dashboard-subtitle');
            if (subtitle) subtitle.textContent = 'Painel do Jogador';
        }
        
        if(window.updateUIFull) window.updateUIFull();
        if(window.renderMap) window.renderMap();
    } catch (err) {
        socket.emit('client_error', { pin: window.gameRoomPin, msg: err.message, stack: err.stack });
    }
});

socket.on('game_started', () => {
    // Dashboard diz que começou. O sync_state vai renderizar o mapa logo a seguir.
    console.log("Partida iniciando...");
});

window.emitSync = function() {
    if (window.gameRoomPin && window.gameState) {
        socket.emit('sync_state', { pin: window.gameRoomPin, state: window.gameState });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    
    // Opcional: Se o PIN existir na URL, renderiza ele no canto da tela (legado do host.html)
    if (roomPin) {
        const pinDisplay = document.createElement('div');
        pinDisplay.style.position = 'fixed';
        pinDisplay.style.top = '10px';
        pinDisplay.style.left = '10px';
        pinDisplay.style.background = 'white';
        pinDisplay.style.padding = '10px';
        pinDisplay.style.border = '2px solid black';
        pinDisplay.style.fontSize = '24px';
        pinDisplay.style.fontWeight = 'bold';
        pinDisplay.style.zIndex = '9999';
        pinDisplay.textContent = `PIN: ${roomPin}`;
        document.body.appendChild(pinDisplay);
    }
    
    // Guardar PIN num objeto global para os emits
    window.gameRoomPin = roomPin; // Se entrou por URL
    
    const btnAddPlayer = document.getElementById('add-player-btn');
    const btnStartGame = document.getElementById('start-game-btn');
    const btnTakeControl = document.getElementById('take-control-btn');
    const btnConfirmDraft = document.getElementById('confirm-draft-btn');
    const btnEndAttack = document.getElementById('end-attack-btn');
    const csvUpload = document.getElementById('csv-upload');
    
    // CSV logic (Desativado no host se estiver online, pois o dashboard fará isso)
    // Mas mantemos por compatibilidade
    if (csvUpload) {
        csvUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(evt) {
                if (window.parseCSVText) {
                    window.parseCSVText(evt.target.result);
                    if (window.updateUIFull) window.updateUIFull();
                }
            };
            reader.readAsText(file);
        });
    }
    
    btnAddPlayer.addEventListener('click', () => {
        if(window.addTestPlayer) window.addTestPlayer();
        if(window.updateUIFull) window.updateUIFull();
    });
    
    btnStartGame.addEventListener('click', () => {
        // Agora o botão apenas avisa o servidor que o jogo começou
        if (roomPin) {
            socket.emit('start_game', roomPin);
        } else {
            // Modo local fallback
            if(window.startGame) window.startGame();
            if(window.renderMap) window.renderMap();
        }
    });
    
    btnTakeControl.addEventListener('click', () => {
        if(window.enterDraftPhase) {
            window.enterDraftPhase();
            if(window.emitSync) window.emitSync();
        }
    });
    
    btnConfirmDraft.addEventListener('click', () => {
        if(window.enterAttackPhase) {
            window.enterAttackPhase();
            if(window.emitSync) window.emitSync();
        }
    });
    
    btnEndAttack.addEventListener('click', () => {
        if(window.endAttackPhase) {
            window.endAttackPhase();
            if(window.emitSync) window.emitSync();
        }
    });
    
    const btnReturnLobby = document.getElementById('btn-return-lobby');
    if (btnReturnLobby) {
        btnReturnLobby.addEventListener('click', () => {
            const victoryModal = document.getElementById('victory-modal');
            const mapContainer = document.getElementById('map-container');
            
            victoryModal.style.display = 'none';
            mapContainer.classList.remove('blurred');
            
            // Recarrega o jogo
            if(window.initGame) {
                window.initGame();
                if(window.updateUIFull) window.updateUIFull();
            }
        });
    }
    
    // Initial Render
    if(window.updateUIFull) window.updateUIFull();
});
