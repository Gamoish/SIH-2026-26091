const INR = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export const num = (n: number) => INR.format(Math.round(n));
export const inr = (n: number) => `₹${num(n)}`;
