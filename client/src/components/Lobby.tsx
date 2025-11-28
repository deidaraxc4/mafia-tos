import React, { useState } from 'react';
import styled from 'styled-components';

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

interface Player {
  id: string;
  nickname: string;
}

// Dummy data for player list and roles
const MOCK_PLAYERS: Player[] = [
  { id: 'p1', nickname: 'GameMaster' },
  { id: 'p2', nickname: 'Joker' },
  { id: 'p3', nickname: 'Sleeper' },
];

const STARTER_ROLES: Role[] = ['Mayor', 'Veteran', 'Doctor', 'Lookout', 'Sheriff', 'Godfather', 'Mafioso', 'Jester', 'Survivor'];
const roleOptions = ['Mayor', 'Escort', 'Transporter', 'Medium', 'Retributionist', 'Lookout', 'Sheriff', 'Veteran', 'Vigilante', 'Bodyguard', 'Doctor', 'Consigliere',
'Consort', 'Framer', 'Blackmailer', 'Godfather', 'Mafioso', 'Executioner', 'Jester', 'Survivor', 'Amnesiac', 'Serial Killer', 'Werewolf'];


// --- 1. Game Master (GM) View Component ---
interface GMViewProps {
  roomCode: string;
  players: Player[];
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
}

const GMView: React.FC<GMViewProps> = ({ roomCode, players, roles, setRoles }) => {
  const [newRole, setNewRole] = useState<Role>('Town');
  
  // Validation: Check if player count matches role count
  const playerCount = players.length;
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
      ? 'Need at least 2 players to start.' 
      : (playerCount !== roleCount 
        ? `Player Count (${playerCount}) ≠ Role Count (${roleCount})` 
        : 'Ready to Start!');
        
  const validationColor = canStartGame ? '#4CAF50' : '#FF9800';

  return (
    <div>
      <h3 style={{ marginBottom: '10px' }}>Room Code: <span style={{ color: '#FFEB3B' }}>{roomCode}</span></h3>
      
      <h4>Players ({playerCount})</h4>
      <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #5a5a7d', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
        {players.map(p => <div key={p.id}>{p.nickname}</div>)}
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
            console.log(r);
            return(<option value={r}>{r}</option>)
          })}
        </select>
        <button onClick={handleAddRole} style={{ padding: '10px', background: '#9C27B0' }}>Add Role</button>
      </div>
      
      {/* Start Game Validation and Button */}
      <p style={{ color: validationColor, fontWeight: 'bold' }}>{validationText}</p>
      <Button 
        style={{ backgroundColor: canStartGame ? '#4CAF50' : '#757575' }} 
        disabled={!canStartGame}
      >
        Start Game
      </Button>
    </div>
  );
};


// --- 2. Player View Component ---
interface PlayerViewProps {
  roomCode: string;
  players: Player[];
}

const PlayerView: React.FC<PlayerViewProps> = ({ roomCode, players }) => {
  return (
    <div>
      <h3 style={{ marginBottom: '20px' }}>Waiting in Room: <span style={{ color: '#FFEB3B' }}>{roomCode}</span></h3>
      <p>Waiting for the Game Master to start the game...</p>

      <h4>Players Joined ({players.length})</h4>
      <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #5a5a7d', padding: '10px', borderRadius: '5px' }}>
        {players.map(p => <div key={p.id}>{p.nickname}</div>)}
      </div>
    </div>
  );
};


// --- Main Lobby Component ---
export const Lobby: React.FC = () => {
  const [view, setView] = useState<ViewState>('initial');
  const [nickname, setNickname] = useState('');
  const [roomInput, setRoomInput] = useState('');
  
  // Dummy State for GM View
  const [currentRoles, setCurrentRoles] = useState<Role[]>(STARTER_ROLES);
  
  // In a real app, this would be determined by the backend
  const isGM = view === 'create'; 
  // const currentRoomCode = 'ABCD'; // Mock Room Code

  const handleJoinOrCreate = (action: 'create' | 'join') => {
    if (nickname.trim()) {
      setView(action);
      // NOTE: Here is where you would call socket.emit('createRoom') or socket.emit('joinRoom')
    }
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
            <Button className="create" onClick={() => handleJoinOrCreate('create')}>
              Create Room (GM)
            </Button>
            <Input 
              placeholder="Enter 4-Letter Room Code" 
              value={roomInput} 
              onChange={(e) => setRoomInput(e.target.value)}
              maxLength={4}
              style={{ marginTop: '20px' }}
            />
            <Button className="join" onClick={() => handleJoinOrCreate('join')} disabled={!roomInput.trim()}>
              Join Room
            </Button>
          </>
        )}

        {/* --- GM View --- */}
        {view === 'create' && (
          <GMView 
            roomCode={roomInput}
            players={MOCK_PLAYERS}
            roles={currentRoles}
            setRoles={setCurrentRoles}
          />
        )}
        
        {/* --- Standard Player View --- */}
        {view === 'join' && !isGM && (
          <PlayerView 
            roomCode={roomInput}
            players={MOCK_PLAYERS}
          />
        )}
        
        {/* Back Button */}
        {view !== 'initial' && (
          <button 
            onClick={() => setView('initial')} 
            style={{ marginTop: '20px', background: 'none', border: 'none', color: '#90CAF9', cursor: 'pointer' }}
          >
            &larr; Back
          </button>
        )}
        
      </LobbyCard>
    </LobbyContainer>
  );
};