// src/hooks/useWorker.ts
import { useEffect, useState, useCallback } from 'react';

export const useWorker = () => {
  const [worker, setWorker] = useState<Worker | null>(null);

  useEffect(() => {
    const newWorker = new Worker('/workers/data.worker.js');
    setWorker(newWorker);
    
    return () => {
      newWorker.terminate();
    };
  }, []);

  const postMessage = useCallback((message: unknown) => {
    if (!worker) return;
    worker.postMessage(message);
  }, [worker]);

  return { worker, postMessage };
};