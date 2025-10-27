import { useMemo } from 'react';
import { OnlineOrder } from '../../types/pos';

interface OrderCounts {
  status: {
    pending_confirmation: number;
    confirmed: number;
    ready_for_pickup: number;
    for_payment: number;
    completed: number;
    cancelled: number;
  };
  orderType: {
    pickup: number;
    delivery: number;
    reservation: number;
  };
  total: number;
}

export const useOrderCounts = (orders: OnlineOrder[]): OrderCounts => {
  return useMemo(() => {
    const counts: OrderCounts = {
      status: {
        pending_confirmation: 0,
        confirmed: 0,
        ready_for_pickup: 0,
        for_payment: 0,
        completed: 0,
        cancelled: 0,
      },
      orderType: {
        pickup: 0,
        delivery: 0,
        reservation: 0,
      },
      total: orders.length,
    };

    orders.forEach(order => {
      // Count by status
      if (order.status in counts.status) {
        counts.status[order.status as keyof typeof counts.status]++;
      }

      // Count by order type
      if (order.order_type in counts.orderType) {
        counts.orderType[order.order_type as keyof typeof counts.orderType]++;
      }
    });

    return counts;
  }, [orders]);
};