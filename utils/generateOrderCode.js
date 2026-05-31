const generateOrderCode = (prefix = 'ORD') => {
  const today = new Date();
  const dateString = today.toISOString().slice(2, 10).replace(/-/g, '');
  const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4 random digits
  return `${prefix}${dateString}${randomDigits}`;
};

module.exports = generateOrderCode;
