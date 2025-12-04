import React, { useState } from 'react';
import styled from 'styled-components';
import { socket } from '../socket'; 
import type { Player } from './Lobby';

interface GMGameScreenProps {
    roomCode: string;
    allPlayers: Player[]; // Full list with roles
    gamePhase: 'LOBBY' | 'NIGHT' | 'DAY' | 'GAME_OVER';
}

const ControlArea = styled.div`
    padding: 20px;
    background-color: #1c1c38;
    border-radius: 10px;
    margin-top: 20px;
`;

const LogArea = styled.div`
    margin-top: 20px;
    padding: 15px;
    background-color: #111122;
    border-radius: 8px;
    min-height: 100px;
    overflow-y: auto;
    font-size: 0.9rem;
    text-align: left;
    white-space: pre-wrap;
    font-family: monospace;
`;

const PlayerListArea = styled.div`
    margin-top: 20px;
    padding: 15px;
    background-color: #111122;
    border-radius: 8px;
    min-height: 100px;
    overflow-y: auto;
    font-size: 0.9rem;
    text-align: left;
    white-space: pre-wrap;
    font-family: monospace;
    text-align: center;
`;

export const GMGameScreen: React.FC<GMGameScreenProps> = ({ roomCode, allPlayers, gamePhase }) => {
    
    // --- Local State for Target Selection ---
    // const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
    const [currentRole, setCurrentRole] = useState<{ role: string, wakeUp: boolean } | null>(null);
    const [logEntries, setLogEntries] = useState<string[]>([]); // To display actions
    const [playersSelectedForDeath, setPlayersSelectedForDeath] = useState<string[]>([]);

    // Helper for display
    const currentWakingRole = currentRole?.role || "Awaiting Phase Start";
    const livingPlayers = allPlayers.filter(p => p.isAlive && !p.isHost);
    // Determine if the night phase role cycling is complete
    const nightCyclingComplete = currentRole === null;

    const handleToggleTargetSelection = (playerId: string) => {
        setSelectedTargetIds(prevIds => {
            if (prevIds.includes(playerId)) {
                // Remove if already selected
                return prevIds.filter(id => id !== playerId);
            } else {
                // Add if not selected
                return [...prevIds, playerId];
            }
        });
    };

    // --- Socket Listeners for GM Control Flow ---
    React.useEffect(() => {
        // Listener triggered by the server when the GM clicks Prev/Next
        socket.on('updateGMControl', (data: { currentRole: { role: string, wakeUp: boolean } | null, nightActions: string[] }) => {
            setCurrentRole(data.currentRole);
            setLogEntries(data.nightActions);
            setSelectedTargetIds([]); // Reset selection
        });
        
        // Initial setup for the first call
        socket.emit('requestGMControlState', { roomCode });

        return () => {
            socket.off('updateGMControl');
        };
    }, [roomCode]);

    // --- Handlers for GM Actions ---
    
    // 1. Cycle to the next role
    const handleNextRole = () => {
        socket.emit('gmNextRole', { 
            roomCode, 
            targetPlayerIds: selectedTargetIds // Send the current selection (null if none)
        });
        setSelectedTargetIds([]); // Clear selection on client side after sending
    };

    // 2. Start the Night Phase
    const handleStartNight = () => {
        // Send the new event to the server
        socket.emit('gmStartNight', { roomCode });
    }

    // 3. End Night / Begin Day
    const handleEndNightBeginDay = () => {
        // The server will update the 'isAlive' status based on this list.
        socket.emit('processGamePhase', { 
            roomCode, 
            phase: 'DAY',
            playersKilled: playersSelectedForDeath
        });
        setPlayersSelectedForDeath([]); // Reset state
    }

    // 4. Manual death selection
    const handleToggleDeathSelection = (playerId: string) => {
        setPlayersSelectedForDeath(prev => 
            prev.includes(playerId)
                ? prev.filter(id => id !== playerId) // Remove if already selected
                : [...prev, playerId]                  // Add if not selected
        );
    };

    return (
        <ControlArea>
            <h2>GM Controls: {gamePhase === 'NIGHT' ? '🌑 Night Phase' : '☀️ Day Phase'}</h2>
            
            {/* --- Phase Cycling Controls (NIGHT ONLY) --- */}
            {gamePhase === 'NIGHT' && (
                <>
                    {/* Waking Role Display */}
                    <h3>
                        {currentRole 
                            ? `Waking Role: ${currentRole.role}`
                            : 'Night Phase Complete.'
                        }
                    </h3>
                    
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                        {/* Only show NEXT button if cycling is not complete */}
                        {!nightCyclingComplete && (
                            <button 
                                onClick={handleNextRole} 
                                style={{ backgroundColor: '#4CAF50', width: '80%' }}
                            >
                                Next Role &rarr;
                            </button>
                        )}
                        
                        {/* Show BEGIN DAY button if cycling is complete */}
                        {/* {nightCyclingComplete && (
                            <button 
                                onClick={handleEndNightBeginDay} 
                                style={{ backgroundColor: '#ce9c05ff', width: '80%' }}
                            >
                                Begin Day ☀️
                            </button>
                        )} */}
                        {nightCyclingComplete && (
                        <div style={{ marginTop: '20px', padding: '15px', border: '2px solid #F44336', borderRadius: '8px' }}>
                            <h3 style={{ color: '#F44336', marginBottom: '15px' }}>
                                ☠️ Night Action Review ☠️
                            </h3>
                            <p style={{ marginBottom: '15px' }}>
                                Select the player(s) who will be announced dead this morning:
                            </p>
                            
                            {/* Checkbox List of Alive Players */}
                            <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '0 10px' }}>
                                {livingPlayers.map(p => (
                                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', margin: '8px 0', borderBottom: '1px solid #3c3c5c' }}>
                                        <input 
                                            type="checkbox" 
                                            id={`kill-${p.id}`}
                                            checked={playersSelectedForDeath.includes(p.id)}
                                            onChange={() => handleToggleDeathSelection(p.id)}
                                            style={{ marginRight: '10px', width: '20px', height: '20px', cursor: 'pointer' }}
                                        />
                                        <label htmlFor={`kill-${p.id}`} style={{ flexGrow: 1, cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{p.nickname}</span> 
                                            <span style={{ color: '#90CAF9', fontSize: '0.9em' }}>({p.role})</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Final Begin Day Button */}
                            <button 
                                onClick={handleEndNightBeginDay} 
                                style={{ backgroundColor: '#b88a00ff', width: '100%', marginTop: '20px' }}
                            >
                                Begin Day ☀️ (Announce {playersSelectedForDeath.length} Death(s))
                            </button>
                        </div>
                    )}
                    </div>

                    {/* --- Target Selection Checkbox List --- */}
                    {currentRole?.wakeUp && (
                        <div style={{ padding: '10px', border: '1px solid #5a5a7d', borderRadius: '5px', marginBottom: '20px' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                                Who is **{currentWakingRole}** targeting?
                            </p>
                            {livingPlayers.map(p => (
                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', margin: '5px 0' }}>
                                    <input 
                                        type="checkbox" 
                                        id={p.id}
                                        checked={selectedTargetIds.includes(p.id)}
                                        onChange={() => handleToggleTargetSelection(p.id)}
                                        style={{ marginRight: '10px', width: '20px', height: '20px' }}
                                    />
                                    <label htmlFor={p.id} style={{ flexGrow: 1, cursor: 'pointer' }}>
                                        {p.nickname} (<span style={{ color: '#90CAF9' }}>{p.role}</span>)
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* --- Action Log Area --- */}
            <h4>Game Log</h4>
            <LogArea>
                {logEntries.join('\n')}
            </LogArea>

            <h4>Players List</h4>
            <PlayerListArea>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                {allPlayers.map(p => {
                    if (!p.isHost) {
                        return(
                            <li key={p.id} style={{ opacity: p.isAlive ? 1 : 0.5, textDecoration: p.isAlive ? 'none' : 'line-through' }}>
                                {p.nickname} ({p.role})
                            </li>
                        )
                    }
                })}
                </ul>
            </PlayerListArea>

            {/* --- Day Phase Controls --- */}
            {gamePhase === 'DAY' && (
                <>
                    <p>Day is open for discussion. When ready to proceed to the night phase:</p>
                    <button onClick={handleStartNight} style={{ backgroundColor: '#2196F3' }}>
                        Begin Night 🌑
                    </button>
                </>
            )}
        </ControlArea>
    );
};