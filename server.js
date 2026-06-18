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
    
    socket.on('create_room', () => {
        const pin = generatePIN();
        gameRooms[pin] = {
            pin: pin,
            hostId: socket.id, // Armazena o ID do professor
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
        } else {
            socket.emit('room_error', 'Sala não encontrada');
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
        
        const player = { id: socket.id, name: name };
        gameRooms[pin].players.push(player);
        
        socket.join(pin);
        socket.emit('join_success', { pin, name });
        console.log(`[Aluno] ${name} entrou na sala ${pin}.`);
        
        io.to(pin).emit('update_players', { pin: pin, players: gameRooms[pin].players });
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
                console.log(`[Host] Professor desconectou. Fechando sala ${pin}.`);
                io.to(pin).emit('room_closed', 'O professor encerrou a sala.');
                delete gameRooms[pin];
                continue;
            }
            
            // 2. Se quem caiu foi um aluno
            const index = room.players.findIndex(p => p.id === socket.id);
            if (index !== -1) {
                const name = room.players[index].name;
                room.players.splice(index, 1);
                console.log(`[Aluno] ${name} desconectou da sala ${pin}.`);
                
                // 3. Apagar se ficar vazia
                if (room.players.length === 0) {
                    console.log(`[Sala] Todos os alunos saíram. Fechando sala ${pin} vazia.`);
                    io.to(pin).emit('room_closed', 'A sala foi encerrada por falta de jogadores.');
                    delete gameRooms[pin];
                } else {
                    io.to(pin).emit('update_players', { pin: pin, players: room.players });
                }
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`HexaClash Edu Server rodando na porta ${PORT}`);
});
