export const tags = {
  products: () => "products",
  product: (id: number) => `product:${id}`,
  stock: (id: number) => `stock:${id}`,
  userProfile: (userId: number) => `user:${userId}:profile`,
  userOrders: (userId: number) => `user:${userId}:orders`,
  userCart: (userId: number) => `user:${userId}:cart`,
  userNotifications: (userId: number) => `user:${userId}:notifications`,
};
