const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Estado global do jogo em memória (Múltiplas salas)
const gameRooms = {};

// Utilitário para gerar PIN
function generatePIN() {
    let pin;
    do {
        pin = Math.floor(1000 + Math.random() * 9000).toString();
    } while (gameRooms[pin]);
    return pin;
}

io.on('connection', (socket) => {
    
    // ======== ROTEAMENTO DE DASHBOARD ========
    
    socket.on('create_room', (hostToken) => {
        const pin = generatePIN();
        gameRooms[pin] = {
            pin: pin,
            hostToken: hostToken,
            hostId: socket.id, // Armazena o ID do professor
            destructionTimer: null,
            players: [],
            gameState: {},
            questionBank: []
        };
        socket.join(pin);
        socket.emit('room_created', pin);
        console.log(`[Dashboard] Sala ${pin} criada. Host: ${socket.id}`);
    });
    
    socket.on('upload_csv', (data) => {
        const { pin, bank } = data;
        if (gameRooms[pin]) {
            gameRooms[pin].questionBank = bank;
            console.log(`[Dashboard] Banco com ${bank.length} questões injetado na sala ${pin}.`);
        }
    });
    
    // ======== ROTEAMENTO DE HOST (MAPA) ========
    
    socket.on('host_join', (pin) => {
        if (gameRooms[pin]) {
            socket.join(pin);
            console.log(`[Host] Projetor conectado na sala ${pin}`);
            // Envia os jogadores atuais pro host recém conectado
            socket.emit('update_players', { pin: pin, players: gameRooms[pin].players });
            if (gameRooms[pin].gameState && gameRooms[pin].gameState.status && gameRooms[pin].gameState.status !== 'lobby') {
                socket.emit('sync_state', gameRooms[pin].gameState);
            }
        } else {
            socket.emit('room_error', 'Sala não encontrada');
        }
    });

    socket.on('rejoin_host', (data) => {
        const { pin, hostToken } = data;
        const room = gameRooms[pin];
        if (room && room.hostToken === hostToken) {
            // Cancela destruição se houver
            if (room.destructionTimer) {
                clearTimeout(room.destructionTimer);
                room.destructionTimer = null;
            }
            room.hostId = socket.id;
            socket.join(pin);
            socket.emit('room_created', pin);
            socket.emit('update_players', { pin: pin, players: room.players });
            if (room.gameState && room.gameState.status && room.gameState.status !== 'lobby') {
                socket.emit('game_already_started', pin);
            }
            console.log(`[Host] Professor reconectado na sala ${pin}.`);
        }
    });
    
    // ======== ROTEAMENTO DE ALUNO ========
    
    socket.on('join_room', (data) => {
        const { pin, name } = data;
        
        if (!gameRooms[pin]) {
            socket.emit('join_error', 'Sala não encontrada.');
            return;
        }
        
        if (gameRooms[pin].players.length >= 6) {
            socket.emit('join_error', 'Sala lotada! Limite de 6 alunos.');
            return;
        }
        
        if (gameRooms[pin].players.find(p => p.name === name)) {
            socket.emit('join_error', 'Nome já em uso nesta sala.');
            return;
        }
        
        const playerToken = Math.random().toString(36).substring(2, 15);
        const player = { id: socket.id, name: name, token: playerToken, isOffline: false };
        gameRooms[pin].players.push(player);
        
        socket.join(pin);
        socket.emit('join_success', { pin, name, token: playerToken });
        console.log(`[Aluno] ${name} entrou na sala ${pin}.`);
        
        io.to(pin).emit('update_players', { pin: pin, players: gameRooms[pin].players });
    });

    socket.on('rejoin_player', (data) => {
        const { pin, token } = data;
        const room = gameRooms[pin];
        if (room) {
            const p = room.players.find(player => player.token === token);
            if (p) {
                p.id = socket.id;
                p.isOffline = false;
                socket.join(pin);
                socket.emit('rejoin_success', { pin, name: p.name });
                io.to(pin).emit('update_players', { pin: pin, players: room.players });
                
                // Se a partida estiver rodando, reenvia estado para este aluno
                if (room.gameState && room.gameState.status && room.gameState.status !== 'lobby') {
                    socket.emit('sync_state', room.gameState);
                }
                console.log(`[Aluno] ${p.name} reconectado na sala ${pin}.`);
                return;
            }
        }
        socket.emit('rejoin_error', 'Sessão não encontrada ou sala encerrada.');
    });
    
    // Broadcast state from one client to others
    socket.on('sync_state', (data) => {
        const { pin, state } = data;
        if (gameRooms[pin]) {
            gameRooms[pin].gameState = state; // Save it to memory
            console.log(`[Server Debug] Recebeu sync_state para sala ${pin}. Tipo de state: ${typeof state}`);
            if (state) console.log(`[Server Debug] Status do state: ${state.status}, Jogadores: ${state.players ? Object.keys(state.players).length : 'undefined'}`);
            socket.to(pin).emit('sync_state', state); // Broadcast to all OTHERS in the room
        }
    });
    
    // Botão Iniciar Partida apertado no Dashboard
    socket.on('start_game', (pin) => {
        if (gameRooms[pin]) {
            io.to(pin).emit('game_started');
            console.log(`[Game] Partida Iniciada na sala ${pin}`);
        }
    });

    socket.on('client_error', (data) => {
        console.error(`[Client Error - Sala ${data.pin}]: ${data.msg}\nStack: ${data.stack}`);
    });

    socket.on('disconnect', () => {
        for (const pin in gameRooms) {
            const room = gameRooms[pin];
            
            // 1. Se quem caiu foi o Host (Professor)
            if (room.hostId === socket.id) {
                console.log(`[Host] Professor desconectou da sala ${pin}. Iniciando timer de 5 min...`);
                room.destructionTimer = setTimeout(() => {
                    console.log(`[Host] Timeout! Fechando sala ${pin} permanentemente.`);
                    io.to(pin).emit('room_closed', 'O professor encerrou a sala.');
                    delete gameRooms[pin];
                }, 5 * 60 * 1000); // 5 minutos
                continue;
            }
            
            // 2. Se quem caiu foi um aluno
            const index = room.players.findIndex(p => p.id === socket.id);
            if (index !== -1) {
                const p = room.players[index];
                p.isOffline = true;
                console.log(`[Aluno] ${p.name} perdeu conexão na sala ${pin} (isOffline: true).`);
                
                io.to(pin).emit('update_players', { pin: pin, players: room.players });
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`HexaClash Edu Server rodando na porta ${PORT}`);
});
