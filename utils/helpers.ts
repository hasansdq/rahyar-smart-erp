export const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
};

export const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
