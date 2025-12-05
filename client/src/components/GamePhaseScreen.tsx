import React from 'react';
import styled from 'styled-components';
import type { Player, RoleConfig } from './Lobby';

interface GamePhaseScreenProps {
    role: string | null;
    phase: 'NIGHT' | 'DAY' | 'GAME_OVER';
    allPlayers: Player[]; // Full list of players (name/status)
    myNickname: string;
    roleConfig: RoleConfig;
}

const PhaseContainer = styled.div`
    margin-top: 30px;
    padding: 20px;
    background-color: #1c1c38;
    border-radius: 10px;
`;

export const GamePhaseScreen: React.FC<GamePhaseScreenProps> = ({ role, phase, allPlayers, myNickname, roleConfig }) => {
    // Only show alive players for targeting/voting
    const alivePlayers = allPlayers.filter(p => p.isAlive && !p.isHost);
    const roleKey = role || "Game Master";
    const info = roleConfig[roleKey];

    return (
        <PhaseContainer>
            <h3 style={{ color: '#E0E0E0', marginBottom: '10px' }}>
                **{myNickname}**
            </h3>
            <h2>{phase === 'NIGHT' ? '🌑 Night Phase' : '☀️ Day Phase'}</h2>
            
            {/* <h3 style={{ color: '#FFEB3B' }}>Your Role: {role}</h3> */}
            {info && (
                <div style={{ padding: '10px', backgroundColor: '#3c3c5c', borderRadius: '5px', marginTop: '15px' }}>
                    <h4 style={{ color: '#FFEB3B', margin: '0 0 5px 0' }}>Your Role: {roleKey}</h4>
                    <p style={{ color: '#90CAF9', margin: '0 0 5px 0', fontWeight: 'bold' }}>
                        <strong>Alignment:</strong> {info.alignment}
                    </p>
                    <p style={{ color: '#6bd7c9ff', margin: '0' }}>
                        <strong>Abilities:</strong> {info.description}
                    </p>
                    <p style={{ color: '#00c60aff', margin: '0' }}>
                        <strong>Goal:</strong> {info.goal}
                    </p>
                </div>
            )}
            
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
                {allPlayers.map(p => {
                    if (!p.isHost) {
                        return(
                            <li key={p.id} style={{ opacity: p.isAlive ? 1 : 0.5, textDecoration: p.isAlive ? 'none' : 'line-through' }}>
                                {p.nickname}
                                {!p.isAlive && " (Deceased)"}
                            </li>
                        );
                    }
                })}
            </ul>
        </PhaseContainer>
    );
};