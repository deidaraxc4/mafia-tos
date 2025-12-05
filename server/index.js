const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const httpServer = createServer(app);
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Initialize Socket.io server
const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigin,
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3001;
let connectedClients = 0;

const activeRooms = {};

const NIGHT_WAKEUP_ORDER = [
    'Transporter',
    'Escort',
    'Consort',
    'Consig',
    'Framer',
    'Blackmailer',
    'Medium',
    'Retributionist',
    'Doctor',
    'Bodyguard',
    'Mafioso',
    'Godfather',
    'Vigilante',
    'Veteran',
    'Serial Killer',
    'Werewolf',
    'Sheriff',
    'Lookout',
    'Survivor',
    'Amnesiac'
];

const ROLE_CONFIG = {
    "Doctor": {
        "alignment": "Town (Protective)",
        "description": "Each night choose 1 player to heal. If they are attacked, they survive. You cannot heal yourself on consecutive nights.",
        "goal": "Lynch every criminal and evildoer."
    },
    "Mayor": {
        "alignment": "Town (Support)",
        "description": "During the day you may reveal yourself as the Mayor. Once you do your votes count as 3, you may not be healed by the Doctor once revealed.",
        "goal": "Lynch every criminal and evildoer."
    },
    "Transporter": {
        "alignment": "Town (Support)",
        "description": "Choose 2 people to transport at night, you may transport yourself. Transporting 2 people swaps all targets against them.",
        "goal": "Lynch every criminal and evildoer."
    },
    "Escort": {
        "alignment": "Town (Support)",
        "description": "Distract someone each night, that person is unable to use their ability. If you target a serial killer they will attack you.",
        "goal": "Lynch every criminal and evildoer."
    },
    "Medium": {
        "alignment": "Town (Support)",
        "description": "Reveal the role of one dead person at night. You may only use your ability 3 times.",
        "goal": "Lynch every criminal and evildoer."
    },
    "Retributionist": {
        "alignment": "Town (Support)",
        "description": "Choose a person to revive at night. You may only use your ability once.",
        "goal": "Lynch every criminal and evildoer."
    },
    "Bodyguard": {
        "alignment": "Town (Protective)",
        "description": "Protect 1 person from death at night. If your target is attacked, both you and the attacker will die instead. Your counterattack ignores night immunity.",
        "goal": "Lynch every criminal and evildoer."
    },
    "Vigilante": {
        "alignment": "Town (Killing)",
        "description": "Choose to take justice in your own hands and shoot someone at night. If you shoot another Town member you will die of guilt the next day. You can only shoot your gun 3 times.",
        "goal": "Lynch every criminal and evildoer."
    },
    "Veteran": {
        "alignment": "Town (Killing)",
        "description": "Decide if you go on alert at night. While on alert you cannot die at night, anyone who visits you at night while on alert will be shot. You can only go on alert 3 times. You are immune to role blocks.",
        "goal": "Lynch every criminal and evildoer."
    },
    "Sheriff": {
        "alignment": "Town (Investigative)",
        "description": "Each night choose 1 player investigate. You will know if your target is suspicious (Mafia members or any Serial Killers or Werewolves on a full moon night), except for the Godfather.",
        "goal": "Lynch every criminal and evildoer."
    },
    "Lookout": {
        "alignment": "Town (Investigative)",
        "description": "Each night choose 1 player to stake out. You will be notified of all players who visited that player's house that night.",
        "goal": "Lynch every criminal and evildoer."
    },
    "Mafioso": {
        "alignment": "Mafia (Killing)",
        "description": "Carry out the Godfather's orders, you may target a player each night to kill.",
        "goal": "Kill anyone who will not submit to the mafia."
    },
    "Godfather": {
        "alignment": "Mafia (Killing)",
        "description": "You have night immunity, you cannot be killed at night. If there is a Mafioso he will attack the target of your choosing otherwise you kill a target at night. You will not appear suspicious to the Sheriff.",
        "goal": "Kill anyone who will not submit to the mafia."
    },
    "Consig": {
        "alignment": "Mafia (Support)",
        "description": "Check one person for their exact role each night. If there are no kill capable Mafia roles left you will become a Mafioso.",
        "goal": "Kill anyone who will not submit to the mafia."
    },
    "Consort": {
        "alignment": "Mafia (Support)",
        "description": "Distract someone each night, they are unable to use their ability. If there are no kill capable Mafia roles left you will become a Mafioso.",
        "goal": "Kill anyone who will not submit to the mafia."
    },
    "Framer": {
        "alignment": "Mafia (Support)",
        "description": "Choose someone to frame each night, if they are investigated they will appear as a member of the Mafia. If there are no kill capable Mafia roles left you will become a Mafioso.",
        "goal": "Kill anyone who will not submit to the mafia."
    },
    "Blackmailer": {
        "alignment": "Mafia (Support)",
        "description": "Choose one person each night to blackmail, blackmailed targets can not talk during the day. If there are no kill capable Mafia roles left you will become a Mafioso.",
        "goal": "Kill anyone who will not submit to the mafia."
    },
    "Werewolf": {
        "alignment": "Neutral (Killing)",
        "description": "Transform into a werewlf during the full moon (Even number nights). As a Werewolf you cannot be killed at night, you will attack your victim and anyone who visits them. Your attack goes through night immunity. You may choose to stay home and attack anyone who visits you.",
        "goal": "Kill everyone (Town and Mafia and serial killer) who would oppose you."
    },
    "Serial Killer": {
        "alignment": "Neutral (Killing)",
        "description": "Kill someone each night, if you are role blocked you will attack the role blocker in addition to your target.",
        "goal": "Kill everyone (Town and Mafia and Werewolf) who would oppose you."
    },
    "Executioner": {
        "alignment": "Neutral (Evil)",
        "description": "Trick the Town into lynching your target. If your target is killed at night you will become a Jester. Your target is always a Town member.",
        "goal": "Get your target lynched at any cost."
    },
    "Jester": {
        "alignment": "Neutral (Evil)",
        "description": "Trick the Town into voting to lynch you. If you are lynched you may haunt one of your guilty voters the following night and kill them.",
        "goal": "Get yourself lynched by any means necessary."
    },
    "Amnesiac": {
        "alignment": "Neutral (Benign)",
        "description": "Remember who you were by selecting a dead player and assuming their role. When you choose a role it will be announced to the Town the next day.",
        "goal": "Remember who you were and complete that roles objective."
    },
    "Survivor": {
        "alignment": "Neutral (Benign)",
        "description": "Put on a bulletproof vest at night, protecting you from attacks. You can only use the bulletproof vest 3 times.",
        "goal": "Live to the end of the game."
    },
}

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

function assignRoles(room) {
    const nonHostPlayers = room.players.filter(p => !p.isHost);
    // 1. Create a copy of the roles array for random assignment
    let availableRoles = [...room.roles]; 
    availableRoles.map(r => console.log(r));
    
    // 2. Shuffle the roles
    for (let i = availableRoles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableRoles[i], availableRoles[j]] = [availableRoles[j], availableRoles[i]];
    }

    // 3. Assign shuffled roles to players
    nonHostPlayers.forEach((player, index) => {
        player.role = availableRoles[index];
        player.isAlive = true; // Initialize life status
        player.target = null; // Initialize night action target
    });

    // 4. Ensure the Host has NO role assigned
    const hostPlayer = room.players.find(p => p.isHost);
    if (hostPlayer) {
        hostPlayer.role = null; 
        hostPlayer.isAlive = true; // GM is always alive for administration
    }

    // 5. Update room status
    room.status = 'DAY'; // Game starts immediately at night 0
    room.dayNumber = 1;
    room.currentNightRoleIndex = 0;
}

function getCurrentNightRole(room) {
    const index = room.currentNightRoleIndex;
    const cycleList = room.nightCycleRoles;

    if (index >= 0 && index < cycleList.length) {
        const roleName = cycleList[index];
        
        // Find all living players with this role to see if they need to wake up
        const activePlayers = room.players.filter(p => 
            p.isAlive && p.role === roleName
        );
        
        return {
            role: roleName,
            wakeUp: activePlayers.length > 0 // Only wake up if at least one living player has this role
        };
    }
    return null; // Night phase is complete
}

// --- Socket.io Event Handling ---

io.on('connection', (socket) => {
    connectedClients++;
    console.log(`User connected. Socket ID: ${socket.id}. Total connections: ${connectedClients}`);

    const sendGMUpdate = (roomCode) => {
        const room = activeRooms[roomCode];
        if (!room) return;
        
        const currentRoleData = getCurrentNightRole(room);
        
        // Broadcast to the GM only (using their hostId)
        io.to(room.hostId).emit('updateGMControl', {
            currentRole: currentRoleData,
            nightActions: room.nightActions
        });
    }
    
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
            currentNightRoleIndex: 0,
            nightActions: [],
            nightCycleRoles: [],
        };

        // 2. Add GM to the room's socket channel
        socket.join(roomCode);

        console.log(`Room created: ${roomCode} by ${nickname} (${socket.id})`);

        // 3. Send response back to the client using the callback
        // This is crucial for getting the new room code back to the GM client.
        callback({ success: true, roomCode: roomCode, room: activeRooms[roomCode] });
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

    // --- Handle Game Start Event ---
    socket.on('startGame', (data) => {
        const { roomCode, finalRoles } = data;
        const room = activeRooms[roomCode];

        // 1. Validation (Security Check)
        if (!room || room.hostId !== socket.id || room.status !== 'LOBBY') {
            return socket.emit('gameError', 'Cannot start game. Not host, or room not in lobby.');
        }

        // 2. Finalize Roles and Assign
        room.roles = finalRoles; // GM's final list of roles
        assignRoles(room);       // Shuffle and assign roles to players

        console.log(`Game started in room ${roomCode}. Roles assigned.`);
        //debug
        room.players.map(p => {
            console.log(`player ${p.nickname} has role ${p.role} and hoststatus is ${p.isHost}`)
        })

        // 3. Notify Clients of New Phase ('NIGHT') and Distribute Roles

        // A. Private Role Assignment (for every player)
        room.players.forEach(player => {
            // Emit to ONLY the specific player's socket ID
            io.to(player.id).emit('roleAssigned', { 
                role: player.role,
                players: room.players.map(p => ({
                    id: p.id,
                    nickname: p.nickname,
                    isHost: p.isHost,
                    isAlive: p.isAlive,
                    // GM gets full list. Others only get their own role.
                    // This is handled in the next step (B) by only sending the GM the full list.
                })),
                roleConfig: ROLE_CONFIG
            });
        });
        
        // B. Broadcast Phase/Lobby Update (for all players)
        // This tells everyone the game has moved out of the LOBBY phase.
        // It also sends the GM the full player list *with* roles.
        io.to(roomCode).emit('gamePhaseChange', { 
            status: room.status, // 'DAY'
            dayNumber: room.dayNumber, // 1
            // Send the entire player list (with roles) only to the host
            allPlayersWithRoles: room.players 
        });
    });

    // --- GM Control: Transition from DAY to NIGHT ---
    socket.on('gmStartNight', (data) => {
        const { roomCode } = data;
        const room = activeRooms[roomCode];

        if (!room || room.hostId !== socket.id || room.status !== 'DAY') return;

        // --- 1. BUILD THE DYNAMIC NIGHT CYCLE LIST ---
        const uniqueGameRoles = Array.from(new Set(room.roles));
        
        // Filter the static priority list to include only roles present in the game
        room.nightCycleRoles = NIGHT_WAKEUP_ORDER.filter(priorityRole => 
            uniqueGameRoles.includes(priorityRole)
        );

        // 2. Transition to Night
        room.status = 'NIGHT';
        room.currentNightRoleIndex = 0; // Reset role index for the start of the night
        
        // 3. Clear any previous night actions (optional, but good practice)
        room.nightActions = [];

        // 4. Notify all clients of the phase change
        io.to(roomCode).emit('gamePhaseChange', { 
            status: room.status, // 'NIGHT'
            dayNumber: room.dayNumber, 
            allPlayersWithRoles: room.players 
        });
        
        // 5. Send initial control state to GM
        sendGMUpdate(roomCode);
    });

    // --- GM Control: Cycle to Next Role (Night Only) ---
    socket.on('gmNextRole', (data) => {
        const { roomCode, targetPlayerIds } = data;
        const room = activeRooms[roomCode];

        if (!room || room.hostId !== socket.id || room.status !== 'NIGHT') return;

        // 1. LOG previous action (if any target was selected)
        if (targetPlayerIds && targetPlayerIds.length > 0) { // Check for array length > 0
            const previousRoleData = getCurrentNightRole(room); 
            if (previousRoleData) {
                const playerWithRole = room.players.find(p => p.role === previousRoleData.role && p.isAlive);
                
                // --- CONSTRUCT THE TARGET STRING ---
                const targetNames = targetPlayerIds.map(targetId => {
                    const player = room.players.find(p => p.id === targetId);
                    return player ? player.nickname : 'Unknown Player';
                }).join(', '); // Join multiple targets with a comma and space
                
                const actionText = `${playerWithRole ? playerWithRole.nickname : previousRoleData.role} (${previousRoleData.role}) targeted ${targetNames}.`;
                
                room.nightActions.push(actionText);
            }
        }
        
        // 2. Advance Role Index
        room.currentNightRoleIndex++;

        // 3. Send updated state back to the GM
        sendGMUpdate(roomCode);
    });

    // --- GM Control: Process Phase Actions (End Night/Begin Day) ---
    socket.on('processGamePhase', (data) => {
        // Now expecting 'playersKilled' array from the GM
        const { roomCode, phase, playersKilled } = data; 
        const room = activeRooms[roomCode];

        if (!room || room.hostId !== socket.id || room.status !== 'NIGHT') return;

        console.log(`Processing night actions and ${playersKilled.length} death(s) for room ${roomCode}...`);

        // --- 1. PROCESS MANUAL DEATHS ---
        let killedNames = [];
        
        if (Array.isArray(playersKilled) && playersKilled.length > 0) {
            room.players.forEach(player => {
                // If the player's ID is in the list sent by the GM
                if (playersKilled.includes(player.id)) {
                    player.isAlive = false; // Player is dead
                    killedNames.push(player.nickname);
                }
            });
        }
        
        // --- 2. GENERATE NIGHT REPORT ---
        let nightReport;
        if (killedNames.length > 0) {
            nightReport = `The town awakes to find that **${killedNames.join(' and ')}** ${killedNames.length === 1 ? 'was' : 'were'} killed overnight.`;
        } else {
            nightReport = "The town awakes. Fortunately, no one was killed overnight.";
        }
        
        // --- 3. TRANSITION STATE TO DAY ---
        if (phase === 'DAY') {
            room.status = 'DAY';
            room.dayNumber++; 
            
            // Clear night-specific tracking
            room.currentNightRoleIndex = 0;
            room.nightCycleRoles = []; 
        }
        
        // --- 4. NOTIFY ALL CLIENTS OF NEW PHASE ---
        io.to(roomCode).emit('gamePhaseChange', { 
            status: room.status, // 'DAY'
            dayNumber: room.dayNumber, 
            nightReport: nightReport, // New info for players
            allPlayersWithRoles: room.players // Send updated player status
        });

        // 5. Send final GM update for Day phase
        sendGMUpdate(roomCode);
    });

    // --- Initial State Request ---
    socket.on('requestGMControlState', (data) => {
        const room = activeRooms[data.roomCode];
        if (room && room.hostId === socket.id) {
            sendGMUpdate(data.roomCode);
        }
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