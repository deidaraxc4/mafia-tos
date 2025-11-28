import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { io, Socket } from 'socket.io-client';
import './App.css'
import type { Player, PlayerJoinedData } from './types';

const SOCKET_SERVER_URL = 'http://localhost:3001'; 

// Use the generic Socket type from socket.io-client
const socket: Socket = io(SOCKET_SERVER_URL); 

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [nickname, setNickname] = useState<string>('');
  const [roomCode, setRoomCode] = useState<string>('TESTROOM');
  const [statusMessage, setStatusMessage] = useState<string>('Awaiting connection...');
  const [playerList, setPlayerList] = useState<Player[]>([]);
  const [clientCount, setClientCount] = useState<number>(0);

  useEffect(() => {
    // --- Socket Event Listeners ---
    
    socket.on('connect', () => {
      setIsConnected(true);
      setStatusMessage('✅ Connected to server!');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setStatusMessage('❌ Disconnected from server.');
    });

    // Receive the broadcasted total connection count
    socket.on('clientCountUpdate', (count: number) => {
        setClientCount(count);
    });

    // Receive player joining announcement
    socket.on('playerJoined', (data: PlayerJoinedData) => {
        console.log(data.message);
        setStatusMessage(data.message);
        
        // Simple logic to add the player to the list if they aren't already there
        setPlayerList(prevList => {
            if (!prevList.some(p => p.playerId === data.playerId)) {
                return [...prevList, { playerId: data.playerId, nickname: data.nickname }];
            }
            return prevList;
        });
    });

    // Cleanup function: remove all listeners when the component unmounts
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('clientCountUpdate');
      socket.off('playerJoined');
    };
  }, []); // Empty dependency array means this runs only once on mount

  const handleJoin = (): void => {
    if (nickname.trim() && roomCode.trim()) {
        // Emit the 'joinRoom' event to the server
        socket.emit('joinRoom', { 
            roomCode, 
            nickname: nickname.trim() 
        });
        
        // Optional: Disable the join fields after successful emission
        // (You may want to keep them active if the server can reject the join)
    } else {
        setStatusMessage('Please enter a nickname and room code.');
    }
  };

  return (
    <div className="app-container">
      <h2>🔮 Mafia App Lobby</h2>
      <p>Connection Status: **{statusMessage}**</p>
      <p>Total Server Connections: **{clientCount}**</p>
      
      <hr/>

      <div className="join-controls">
        <input 
          type="text"
          placeholder="Enter Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          disabled={!isConnected}
        />
        <input 
          type="text"
          placeholder="Room Code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          disabled={!isConnected}
        />
        <button onClick={handleJoin} disabled={!isConnected || !nickname.trim()}>
          Join Room
        </button>
      </div>
      
      <hr/>

      <h3>Players in {roomCode}</h3>
      <ul className="player-list">
        {playerList.map((player) => (
            <li key={player.playerId}>
                **{player.nickname}** <span className="socket-id">(ID: {player.playerId.substring(0, 4)}...)</span>
            </li>
        ))}
      </ul>
    </div>
  );
}

export default App;