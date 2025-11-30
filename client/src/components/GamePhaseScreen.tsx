import React from 'react';
import styled from 'styled-components';
import type { Player } from './Lobby';

interface GamePhaseScreenProps {
    role: string | null;
    phase: 'NIGHT' | 'DAY' | 'GAME_OVER';
    allPlayers: Player[]; // Full list of players (name/status)
    myNickname: string;
}

const PhaseContainer = styled.div`
    margin-top: 30px;
    padding: 20px;
    background-color: #1c1c38;
    border-radius: 10px;
`;

export const GamePhaseScreen: React.FC<GamePhaseScreenProps> = ({ role, phase, allPlayers, myNickname }) => {
    // Only show alive players for targeting/voting
    const alivePlayers = allPlayers.filter(p => p.isAlive);

    return (
        <PhaseContainer>
            <h3 style={{ color: '#E0E0E0', marginBottom: '10px' }}>
                **{myNickname}**
            </h3>
            <h2>{phase === 'NIGHT' ? '🌑 Night Phase' : '☀️ Day Phase'}</h2>
            
            <h3 style={{ color: '#FFEB3B' }}>Your Role: {role}</h3>
            {/* TODO put faction allegiance and role description */}
            
            {phase === 'NIGHT' && (
                <p>
                    The town is asleep. Use your ability.
                    {/* Role-specific targeting logic would go here */}
                </p>
            )}

            {phase === 'DAY' && (
                <p>
                    Discuss who the Mafia/Killers are! You can now vote.
                </p>
            )}
            
            <h4>Living Players ({alivePlayers.length})</h4>
            {/* Display list of players who are still alive */}
            <ul style={{ listStyleType: 'none', padding: 0 }}>
                {alivePlayers.map(p => (
                    <li key={p.id} style={{ opacity: p.isAlive ? 1 : 0.5 }}>
                        {p.nickname}
                        {!p.isAlive && " (Deceased)"}
                    </li>
                ))}
            </ul>
        </PhaseContainer>
    );
};