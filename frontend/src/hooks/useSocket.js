import { useEffect } from 'react';
import getSocket, { updateSocketAuth } from '../lib/socketClient.js';

export function useSocket(userId) {
  useEffect(() => {
    if (!userId) return;

    const socket = getSocket();
    updateSocketAuth();

    const onConnect = () => {
      socket.emit('join:user', userId);
    };

    socket.on('connect', onConnect);

    if (!socket.connected) {
      socket.connect();
    } else {
      socket.emit('join:user', userId);
    }

    return () => {
      socket.off('connect', onConnect);
    };
  }, [userId]);
}
