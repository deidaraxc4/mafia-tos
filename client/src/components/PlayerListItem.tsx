import React from 'react';
import styled from 'styled-components';
import { socket } from '../socket';

interface Player {
  id: string;
  nickname: string;
  isHost: boolean;
}

interface PlayerItemProps {
  player: Player;
}

// Styled component to apply dynamic highlighting
const ListItem = styled.div<{ isSelf: boolean }>`
  padding: 8px 10px;
  margin-bottom: 5px;
  border-radius: 5px;
  background-color: ${props => props.isSelf ? '#384d38' : 'transparent'}; /* Darker background for self */
  border-left: ${props => props.isSelf ? '4px solid #4CAF50' : 'none'}; /* Green bar for self */
  transition: background-color 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NicknameSpan = styled.span<{ isHost: boolean }>`
  font-weight: ${props => props.isHost ? 'bold' : 'normal'};
  color: ${props => props.isHost ? '#FFEB3B' : 'white'}; /* Yellow for GM */
`;

export const PlayerListItem: React.FC<PlayerItemProps> = ({ player }) => {
  const isSelf = player.id === socket.id;

  return (
    <ListItem isSelf={isSelf}>
      <NicknameSpan isHost={player.isHost}>
        {player.nickname} 
        {player.isHost && <span style={{ color: '#FFEB3B' }}> (GM)</span>}
      </NicknameSpan>
      {isSelf && <span style={{ color: '#4CAF50', fontSize: '0.8rem' }}>(You)</span>}
    </ListItem>
  );
};