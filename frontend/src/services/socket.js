import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
const SERVER_BASE = API_URL.replace(/\/api\/v1\/?$/, '');

// Single shared socket connection for the whole app
const socket = io(SERVER_BASE, {
  autoConnect: true,
  reconnection: true,
});

export default socket;
