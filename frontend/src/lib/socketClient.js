import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem('accessToken');
    socket = io(URL, {
      auth: { token },
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const updateSocketAuth = () => {
  if (socket) {
    const token = localStorage.getItem('accessToken');
    socket.auth = { token };
  }
};

export default getSocket;
