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

export const GMGameScreen: React.FC<GMGameScreenProps> = ({ roomCode, allPlayers, gamePhase }) => {
    
    // --- Local State for Target Selection ---
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [currentRole, setCurrentRole] = useState<{ role: string, wakeUp: boolean } | null>(null);
    const [logEntries, setLogEntries] = useState<string[]>([]); // To display actions

    // Helper for display
    const currentWakingRole = currentRole?.role || "Awaiting Phase Start";
    const livingPlayers = allPlayers.filter(p => p.isAlive && !p.isHost);
    
    // --- Socket Listeners for GM Control Flow ---
    React.useEffect(() => {
        // Listener triggered by the server when the GM clicks Prev/Next
        socket.on('updateGMControl', (data: { currentRole: { role: string, wakeUp: boolean } | null, nightActions: string[] }) => {
            setCurrentRole(data.currentRole);
            setLogEntries(data.nightActions);
            setSelectedPlayerId(null); // Reset selection
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
            targetPlayerId: selectedPlayerId // Send the current selection (null if none)
        });
        setSelectedPlayerId(null); // Clear selection on client side after sending
    };

    // 2. Start the Night Phase
    const handleStartNight = () => {
        // Send the new event to the server
        socket.emit('gmStartNight', { roomCode });
    }

    // 3. End Night / Begin Day
    const handleEndNightBeginDay = () => {
        // This will be the complex event that processes all night actions
        // and transitions to DAY
        socket.emit('processGamePhase', { roomCode, phase: 'DAY' }); 
    }

    // Determine if the night phase role cycling is complete
    const nightCyclingComplete = currentRole === null;

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
                        {nightCyclingComplete && (
                            <button 
                                onClick={handleEndNightBeginDay} 
                                style={{ backgroundColor: '#FFC107', width: '80%' }}
                            >
                                Begin Day ☀️
                            </button>
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
                                        checked={selectedPlayerId === p.id}
                                        onChange={() => setSelectedPlayerId(p.id === selectedPlayerId ? null : p.id)}
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