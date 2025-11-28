export interface Player {
  playerId: string;
  nickname: string;
}

export interface PlayerJoinedData extends Player {
  message: string;
}