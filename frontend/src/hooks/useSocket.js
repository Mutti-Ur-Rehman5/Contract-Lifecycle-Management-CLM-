import { useEffect } from 'react';
import getSocket from '../lib/socketClient.js';

export function useSocket(organizationId) {
  useEffect(() => {
    if (!organizationId) return;

    const socket = getSocket();
    socket.connect();
    socket.emit('join:org', organizationId);

    return () => {
      socket.disconnect();
    };
  }, [organizationId]);
}
