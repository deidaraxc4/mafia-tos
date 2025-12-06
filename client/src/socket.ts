import { io, Socket } from 'socket.io-client';

// const SOCKET_SERVER_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001'; 
const hSOCKET_SERVER_URL = "https://mafia-tos.azurewebsites.net/"
const SOCKET_SERVER_URL = process.env.REACT_APP_API_URL
const SOCKET_URL = SOCKET_SERVER_URL?.trim();
console.log(`socket url is ${SOCKET_SERVER_URL}`)
console.log(`hsocket url is ${hSOCKET_SERVER_URL}`)
console.log(`url len is ${SOCKET_SERVER_URL?.length}`)
console.log(`hurl len is ${hSOCKET_SERVER_URL?.length}`)

export const socket: Socket = io(SOCKET_URL, {
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