export function serializeOrder(order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    customerComment: order.customerComment,
    currency: order.currency,
    amount: Number(order.amount),
    status: order.status,
    items: order.items,
    liqpayStatus: order.liqpayStatus,
    paidAt: order.paidAt,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
}
