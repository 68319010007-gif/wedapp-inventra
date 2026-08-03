import { useEffect } from 'react';
import socket from '../services/socket';

// Subscribe to real-time stock changes broadcast from the backend.
// onUpdate receives (productId, quantity) whenever any stock movement,
// purchase receipt, sales order, or store checkout changes a product's stock.
export function useStockUpdates(onUpdate) {
  useEffect(() => {
    const handler = ({ productId, quantity }) => onUpdate(productId, quantity);
    socket.on('stock:updated', handler);
    return () => socket.off('stock:updated', handler);
  }, [onUpdate]);
}
