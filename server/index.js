const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io server
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173", 
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;
let connectedClients = 0;

const activeRooms = {};

function generateRoomCode() {
    let code;
    do {
        // Generate a 4-character alpha-numeric code (e.g., A1B2)
        code = Math.random().toString(36).substring(2, 6).toUpperCase();
    } while (activeRooms[code]); // Ensure the code is unique
    return code;
}

function handlePlayerCleanup(playerId) {
    let roomCodeToUpdate = null;
    let roomToUpdate = null;

    // 1. Iterate through all active rooms to find the player
    for (const [roomCode, room] of Object.entries(activeRooms)) {
        const playerIndex = room.players.findIndex(p => p.id === playerId);

        if (playerIndex !== -1) {
            roomCodeToUpdate = roomCode;
            roomToUpdate = room;

            // 2. Remove the player from the room's players array
            room.players.splice(playerIndex, 1);
            console.log(`Removed disconnected player ${playerId} from room ${roomCode}.`);
            
            // 3. Check for Host Cleanup
            if (room.hostId === playerId) {
                // If the host disconnects, the room must be handled.
                if (room.players.length > 0) {
                    // Assign new host to the first remaining player
                    room.hostId = room.players[0].id;
                    room.players[0].isHost = true;
                    console.log(`New host assigned to: ${room.players[0].nickname}`);
                } else {
                    // Room is now empty. Delete the room state.
                    delete activeRooms[roomCode];
                    console.log(`Room ${roomCode} is now empty and has been deleted.`);
                    return; // Exit cleanup since the room is gone
                }
            }

            // Since a player was found and removed, we can stop searching.
            break; 
        }
    }

    // 4. Notify remaining players in the room if a room was affected
    if (roomCodeToUpdate && roomToUpdate) {
        // Broadcast the new, updated player list to all sockets still in the room
        io.to(roomCodeToUpdate).emit('playerListUpdate', roomToUpdate.players);
    }
}

// --- Socket.io Event Handling ---

io.on('connection', (socket) => {
    connectedClients++;
    console.log(`User connected. Socket ID: ${socket.id}. Total connections: ${connectedClients}`);
    
    // Socket Events

    // --- 1. Handle Room Creation ---
    socket.on('createRoom', (data, callback) => {
        const { nickname } = data;
        const roomCode = generateRoomCode();

        // 1. Initialize Room State
        activeRooms[roomCode] = {
            hostId: socket.id,
            status: 'LOBBY',
            roles: [], // GM will configure this later
            players: [{ id: socket.id, nickname: nickname, isHost: true, role: null }],
            // Add initial vote/night action tracking if needed
        };

        // 2. Add GM to the room's socket channel
        socket.join(roomCode);

        console.log(`Room created: ${roomCode} by ${nickname} (${socket.id})`);

        // 3. Send response back to the client using the callback
        // This is crucial for getting the new room code back to the GM client.
        callback({ success: true, roomCode: roomCode });
    });

    // Handle incoming 'joinRoom' event from the frontend (the actual user intent), maybe delete
    socket.on('joinRoom', (data, callback) => {
        const { roomCode, nickname } = data;
        const room = activeRooms[roomCode];
        // 1. Validate roomcode if exists
        if (!room) {
            console.log(`Join failed: Room ${roomCode} does not exist.`);
            return callback({ success: false, message: 'The room does not exist.'});
        }

        // 2. Validation Check: Is the player already in the room? (optional, good practice)
        if (room.players.find(p => p.id === socket.id)) {
             return callback({ success: false, message: 'You are already in this room.' });
        }
        
        // 3. Add Player to Room State
        room.players.push({ id: socket.id, nickname: nickname, isHost: false, role: null });

        // 4. Add Player to the room's socket channel
        socket.join(roomCode);

        console.log(`${nickname} joined room ${roomCode}. Total players: ${room.players.length}`);

        // 5. Send success response back to the client using the callback
        callback({ success: true, room: room });

        // 6. Notify all players in that room about the new player
        io.to(roomCode).emit('playerListUpdate', room.players);
    });

    // --- Handle Manual Room Departure (e.g., Back button click) ---
    socket.on('leaveRoom', (data) => {
        const { roomCode } = data;
        
        // 1. Remove socket from the room channel
        socket.leave(roomCode);
        
        // 2. Reuse the cleanup logic to update the room state
        handlePlayerCleanup(socket.id); 
        
        console.log(`Player ${socket.id} manually left room ${roomCode}.`);
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        connectedClients--;
        console.log(`User disconnected. Socket ID: ${socket.id}. Total connections: ${connectedClients}`);
        
        handlePlayerCleanup(socket.id); 
    });
});

// Simple Express route for sanity check
app.get('/', (req, res) => {
  res.send('Mafia Server is running.');
});

httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});