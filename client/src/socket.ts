import { io, Socket } from 'socket.io-client';

const SOCKET_SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001'; 
let CLEANED_SOCKET_SERVER_URL = SOCKET_SERVER_URL.replace(/^["'`]|["'`]$/g, '').trim();

export const socket: Socket = io(CLEANED_SOCKET_SERVER_URL, {
    // Optional configuration
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

// 2. You can also listen for connection status globally here, 
// though it's often better to handle status display in a UI component.
socket.on('connect', () => {
    console.log('Central Socket: Connected!');
});

socket.on('disconnect', (reason) => {
    console.log(`Central Socket: Disconnected. Reason: ${reason}`);
});