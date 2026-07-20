import { useEffect, useState } from 'react';
import axiosClient from '../lib/axiosClient.js';

export function useHealthCheck() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    axiosClient
      .get('/health')
      .then((res) => {
        if (res.data?.success) {
          setStatus('connected');
        } else {
          setStatus('error');
        }
      })
      .catch(() => {
        setStatus('error');
      });
  }, []);

  return status;
}
