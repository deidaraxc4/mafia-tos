const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io server
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:3000", 
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;
let connectedClients = 0;

// --- Socket.io Event Handling ---

io.on('connection', (socket) => {
    connectedClients++;
    console.log(`User connected. Socket ID: ${socket.id}. Total connections: ${connectedClients}`);
    
    // 1. Simple Join/Leave Test: Emit the updated count to everyone
    io.emit('clientCountUpdate', connectedClients); 

    // Handle incoming 'joinRoom' event from the frontend (the actual user intent)
    socket.on('joinRoom', (data) => {
        const { roomCode, nickname } = data;
        
        // 2. Room Joining Logic
        socket.join(roomCode);
        console.log(`${nickname} (${socket.id}) joined room ${roomCode}`);

        // Notify everyone in the room (including the sender)
        io.to(roomCode).emit('playerJoined', { 
            playerId: socket.id, 
            nickname: nickname,
            message: `${nickname} has joined the game!`
        });

        // NOTE: In a real app, you would update the room's player list here.
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        connectedClients--;
        console.log(`User disconnected. Socket ID: ${socket.id}. Total connections: ${connectedClients}`);

        // Emit the updated count to everyone
        io.emit('clientCountUpdate', connectedClients); 
        
        // NOTE: In a real app, you would handle removing the player from their room state.
    });
});

// Simple Express route for sanity check
app.get('/', (req, res) => {
  res.send('Mafia Server is running.');
});

httpServer.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});