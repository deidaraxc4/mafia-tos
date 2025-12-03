import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { socket } from '../socket';
import { PlayerListItem } from './PlayerListItem';
import { GamePhaseScreen } from './GamePhaseScreen';
import { GMGameScreen } from './GMGameScreen';

const LobbyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-width: 50vw;
  padding: 20px;
  background-color: #1a1a2e; /* Dark background that fills the entire screen */
  color: white;
  text-align: center;
`;

const LobbyCard = styled.div`
  background-color: #2c2c54; /* The dark card color */
  padding: 30px 20px;
  border-radius: 12px;
  width: 100%; /* Take up full available width within padding */
  max-width: 450px; /* Slightly wider max-width for better use of space */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6); /* Slightly more prominent shadow */
`;

const Button = styled.button`
  /* ... (no changes needed for buttons) */
  width: 100%;
  padding: 15px 20px;
  margin: 10px 0;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease;
  
  &.create {
    background-color: #4CAF50; 
    &:hover {
      background-color: #45a049;
    }
  }

  &.join {
    background-color: #2196F3;
    &:hover {
      background-color: #0b7dda;
    }
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 12px; /* Increased padding slightly for better touch target */
  margin-bottom: 15px;
  border-radius: 5px;
  border: 2px solid #5a5a7d; /* A subtle, integrated border */
  background-color: #1a1a2e; /* Use a slightly darker background than the card */
  color: white;
  font-size: 1rem;
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: #2196F3; /* Highlight border on focus */
  }
`;

// ----------------------------------------------------
// Component Definitions
// ----------------------------------------------------

type ViewState = 'initial' | 'create' | 'join';
type Role = 'Mayor' | 'Escort' | 'Transporter' | 'Medium' | 'Retributionist' | 'Lookout' | 'Sheriff' | 'Veteran' | 'Vigilante' | 'Bodyguard' | 'Doctor' | 'Consigliere'
| 'Consort' | 'Framer' | 'Blackmailer' | 'Godfather' | 'Mafioso' | 'Executioner' | 'Jester' | 'Survivor' | 'Amnesiac' | 'Serial Killer' | 'Werewolf';

export interface Player {
  id: string;
  nickname: string;
  role: Role | null;
  isHost: boolean;
  target?: string | null;
  isAlive: boolean;
}

interface RoomState {
  hostId: string;
  status: 'LOBBY' | 'NIGHT' | 'DAY';
  roles: Role[];
  players: Player[];
}

const STARTER_ROLES: Role[] = ['Mayor', 'Veteran', 'Doctor', 'Lookout', 'Sheriff', 'Godfather', 'Mafioso', 'Jester', 'Survivor'];
const roleOptions = ['Mayor', 'Escort', 'Transporter', 'Medium', 'Retributionist', 'Lookout', 'Sheriff', 'Veteran', 'Vigilante', 'Bodyguard', 'Doctor', 'Consigliere',
'Consort', 'Framer', 'Blackmailer', 'Godfather', 'Mafioso', 'Executioner', 'Jester', 'Survivor', 'Amnesiac', 'Serial Killer', 'Werewolf'];


// --- 1. Game Master (GM) View Component ---
interface GMViewProps {
  roomCode: string;
  players: Player[];
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  gamePhase: 'LOBBY' | 'NIGHT' | 'DAY' | 'GAME_OVER';
  allPlayersWithRoles: Player[];
  handleStartGame: () => void;
  myNickname: string;
}

const GMView: React.FC<GMViewProps> = ({ roomCode, players, roles, setRoles, gamePhase, allPlayersWithRoles, handleStartGame, myNickname }) => {
  const [newRole, setNewRole] = useState<Role>('Mayor');
  
  // Validation: Check if player count matches role count
  const playerCount = players.length - 1; // we don't count GM as player
  const roleCount = roles.length;
  const canStartGame = playerCount === roleCount && playerCount >= 2; // Min players check

  const handleAddRole = () => {
    setRoles(prev => [...prev, newRole]);
  };

  const handleRemoveRole = (index: number) => {
    setRoles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Visual Feedback based on validation
  const validationText = 
    playerCount < 2 
      ? 'Need at least 7 players to start.' 
      : (playerCount !== roleCount 
        ? `Player Count (${playerCount}) ≠ Role Count (${roleCount})` 
        : 'Ready to Start!');
        
  const validationColor = canStartGame ? '#4CAF50' : '#FF9800';
  const inLobby = gamePhase === 'LOBBY';
  console.log(gamePhase)

  return (
    <div>
      {inLobby && (
        <>
          <h3 style={{ marginBottom: '10px' }}>Room Code: <span style={{ color: '#FFEB3B' }}>{roomCode}</span></h3>
          
          <h4>Players ({playerCount})</h4>
          <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #5a5a7d', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
            {/* {players.map(p => (
                <PlayerListItem key={p.id} player={p} />
            ))} */}
            {(gamePhase !== 'LOBBY' ? allPlayersWithRoles : players).map(p => (
              <div key={p.id}>
                  <PlayerListItem player={p} />
                  {gamePhase !== 'LOBBY' && (
                      <span style={{ color: '#90CAF9', fontSize: '0.9em', marginLeft: '5px' }}>
                          ({p.role}) {/* <-- Display Role for GM */}
                      </span>
                  )}
              </div>
            ))}
          </div>

          <h4>Role List ({roleCount})</h4>
          <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #5a5a7d', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
            {roles.map((role, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
                {role}
                <button onClick={() => handleRemoveRole(index)} style={{ background: 'none', border: 'none', color: '#f44336', cursor: 'pointer' }}>
                  &times;
                </button>
              </div>
            ))}
          </div>

          {/* Role Configuration Dropdown */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <select 
              value={newRole} 
              onChange={(e) => setNewRole(e.target.value as Role)}
              style={{ padding: '10px', flexGrow: 1, backgroundColor: '#1a1a2e', color: 'white' }}
            >
              {roleOptions.map((r, index) => {
                return(<option key={r} value={r}>{r}</option>)
              })}
            </select>
            <button onClick={handleAddRole} style={{ padding: '10px', background: '#9C27B0' }}>Add Role</button>
          </div>
          
          {/* Start Game Validation and Button */}
          <p style={{ color: validationColor, fontWeight: 'bold' }}>{validationText}</p>
          {gamePhase === 'LOBBY' && (
              <Button 
                  onClick={handleStartGame} // <-- Call the new handler
                  style={{ backgroundColor: canStartGame ? '#4CAF50' : '#757575' }} 
                  disabled={!canStartGame}
              >
                  Start Game
              </Button>
          )}
        </>
      )}

      {!inLobby && (
          <GMGameScreen 
              roomCode={roomCode}
              allPlayers={allPlayersWithRoles}
              gamePhase={gamePhase}
          />
      )}
      
      {/* Display the Game Screen if gamePhase is not LOBBY */}
      {/* {gamePhase !== 'LOBBY' && <GamePhaseScreen role={'GM'} allPlayers={allPlayersWithRoles} phase={gamePhase} myNickname={myNickname} />} */}
    </div>
  );
};


// --- 2. Player View Component ---
interface PlayerViewProps {
  roomCode: string;
  players: Player[];
  gamePhase: 'LOBBY' | 'NIGHT' | 'DAY' | 'GAME_OVER';
  myRole: Role | null;
  allPlayersWithRoles: Player[];
  myNickname: string;
}

const PlayerView: React.FC<PlayerViewProps> = ({ roomCode, players, gamePhase, myRole, allPlayersWithRoles, myNickname }) => {
  // Check if the game has started
  const gameHasStarted = gamePhase !== 'LOBBY';

  if (gameHasStarted) {
      return (
          <GamePhaseScreen 
              role={myRole} 
              phase={gamePhase} 
              allPlayers={allPlayersWithRoles} 
              myNickname={myNickname}
          />
      );
  }

  return (
    <div>
      <h3 style={{ marginBottom: '20px' }}>Waiting in Room: <span style={{ color: '#FFEB3B' }}>{roomCode.toUpperCase()}</span></h3>
      <p>Waiting for the Game Master to start the game...</p>

      <h4>Players Joined ({players.length - 1})</h4>
      <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #5a5a7d', padding: '10px', borderRadius: '5px' }}>
        {players.map(p => (
            <PlayerListItem key={p.id} player={p} />
        ))}
      </div>
    </div>
  );
};


// --- Main Lobby Component ---
export const Lobby: React.FC = () => {
  const [view, setView] = useState<ViewState>('initial');
  const [nickname, setNickname] = useState('');
  const [roomInput, setRoomInput] = useState('');

  // Game State from Server
  const [currentRoomCode, setCurrentRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [roomPlayers, setRoomPlayers] = useState<Player[]>([]);
  // const [roomRoles, setRoomRoles] = useState<Role[]>([]); // Roles state managed by GM

  const [gamePhase, setGamePhase] = useState<'LOBBY' | 'NIGHT' | 'DAY' | 'GAME_OVER'>('LOBBY');
  const [myRole, setMyRole] = useState<Role | null>(null);
  const [allPlayersWithRoles, setAllPlayersWithRoles] = useState<Player[]>([]); // For GM only
  
  // UI States
  const [joinError, setJoinError] = useState<string | null>(null);
  
  // List of roles selected for GM View
  const [currentRoles, setCurrentRoles] = useState<Role[]>(STARTER_ROLES);
  
  // In a real app, this would be determined by the backend
  const isGM = view === 'create'; 

  // --- Socket Event Handlers (Dynamic Player List) ---
  useEffect(() => {
    // Listener for when *any* player joins/leaves/updates in the current room
    const handlePlayerListUpdate = (players: Player[]) => {
      setRoomPlayers(players);

      const self = players.find(p => p.id === socket.id);

      if (self) {
        const newHostStatus = self.isHost;
        setIsHost(newHostStatus); 
        
        if (newHostStatus) {
          setView('create')
        }
      }
    };

    if (currentRoomCode) {
        // Start listening only when we are in a room
        socket.on('playerListUpdate', handlePlayerListUpdate);
    }

    return () => {
      socket.off('playerListUpdate', handlePlayerListUpdate);
    };
  }, [currentRoomCode, isHost]);

  // --- Listener for Private Role Assignment ---
  useEffect(() => {
      socket.on('roleAssigned', (data: { role: string, players: Player[] }) => {
          console.log(`you were assigned role ${data.role}`)
          setMyRole(data.role); // Set the player's own role securely
      });

      // Listener for Phase Change (used by GM and Players)
      socket.on('gamePhaseChange', (data: { status: 'NIGHT' | 'DAY' | 'GAME_OVER', dayNumber: number, allPlayersWithRoles?: Player[] }) => {
          setGamePhase(data.status);
          
          if (data.allPlayersWithRoles) {
              setAllPlayersWithRoles(data.allPlayersWithRoles);
          }
      });

      return () => {
          socket.off('roleAssigned');
          socket.off('gamePhaseChange');
      };
  }, []);

  // --- Event Emitters ---

  const handleStartGame = () => {
    socket.emit('startGame', { roomCode: currentRoomCode, finalRoles: currentRoles });
  };
  
  const handleCreateRoom = () => {
    setJoinError(null);
    if (!nickname.trim()) return;

    // Send the creation request and expect a callback response
    socket.emit('createRoom', { nickname: nickname.trim() }, (response: { success: boolean, roomCode?: string, room: RoomState }) => {
      if (response.success && response.roomCode) {
        // Success: Transition to the room
        setCurrentRoomCode(response.roomCode);
        setIsHost(true);
        setView('create');//sets GM view
        setRoomPlayers(response.room.players)
      } else {
        // Handle creation failure (unlikely but possible)
        setJoinError("Failed to create room.");
      }
    });
  };

  const handleJoinRoom = () => {
    setJoinError(null);
    if (!nickname.trim() || roomInput.length !== 4) {
      setJoinError("Please enter a nickname and a 4 character room code.");
      return;
    }

    // Send the join request and expect a callback response with validation result
    socket.emit('joinRoom', { roomCode: roomInput.toUpperCase(), nickname: nickname.trim() }, 
        (response: { success: boolean, message?: string, room?: RoomState }) => {
      if (response.success && response.room) {
        // Success: Transition to the room
        setCurrentRoomCode(roomInput.toUpperCase());
        setIsHost(response.room.hostId === socket.id);
        setRoomPlayers(response.room.players);
        setView('join');//sets player view
      } else {
        // Failure: Display the error message from the server
        setJoinError(response.message || "An unknown error occurred.");
      }
    });
  };

  const handleLeaveRoom = () => {
    if (currentRoomCode) {
        // 1. Tell the server we are leaving this specific room
        socket.emit('leaveRoom', { roomCode: currentRoomCode });
    }
    
    // 2. Reset local state to initial view
    setCurrentRoomCode('');
    setIsHost(false);
    setRoomPlayers([]);
    setRoomInput('');
    setView('initial');
  };

  return (
    <LobbyContainer>
      <LobbyCard>
        <h1>Mafia WebApp</h1>
        
        {/* --- Initial View: Nickname and Choice --- */}
        {view === 'initial' && (
          <>
            <Input 
              placeholder="Enter Nickname" 
              value={nickname} 
              onChange={(e) => setNickname(e.target.value)}
            />
            <Button className="create" onClick={handleCreateRoom} disabled={!nickname.trim()}>
              Create Room (GM)
            </Button>
            <Input 
              placeholder="Enter 4-Letter Room Code" 
              value={roomInput} 
              onChange={(e) => setRoomInput(e.target.value)}
              maxLength={4}
              style={{ marginTop: '20px', textTransform: 'uppercase' }}
            />
            <Button className="join" onClick={handleJoinRoom} disabled={!roomInput.trim() || !nickname.trim()}>
              Join Room
            </Button>
            {/* --- Error Message Display --- */}
            {joinError && (
              <p style={{ color: '#f44336', marginTop: '10px', fontSize: '0.9rem' }}>
                {joinError}
              </p>
            )}
          </>
        )}

        {/* --- GM View --- */}
        {view === 'create' && (
          <GMView 
            roomCode={currentRoomCode}
            players={roomPlayers}
            roles={currentRoles}
            setRoles={setCurrentRoles}
            gamePhase={gamePhase}
            allPlayersWithRoles={allPlayersWithRoles}
            handleStartGame={handleStartGame}
            myNickname={nickname}
          />
        )}
        
        {/* --- Standard Player View --- */}
        {view === 'join' && !isGM && (
          <PlayerView 
            roomCode={roomInput}
            players={roomPlayers}
            gamePhase={gamePhase}
            myRole={myRole}
            allPlayersWithRoles={allPlayersWithRoles}
            myNickname={nickname}
          />
        )}
        
        {/* Back Button */}
        {view !== 'initial' && (
          <button 
            onClick={handleLeaveRoom} 
            style={{ marginTop: '20px', background: 'none', border: 'none', color: '#90CAF9', cursor: 'pointer' }}
          >
            &larr; Leave Room
          </button>
        )}
        
      </LobbyCard>
    </LobbyContainer>
  );
};