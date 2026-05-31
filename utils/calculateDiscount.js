const calculateDiscount = (coupon, orderValue, carBrandName, carCategoryName) => {
  if (!coupon || !coupon.isActive) return 0;

  const now = new Date();
  if (coupon.startDate && new Date(coupon.startDate) > now) return 0;
  if (coupon.endDate && new Date(coupon.endDate) < now) return 0;

  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return 0;
  if (coupon.minOrderValue && orderValue < coupon.minOrderValue) return 0;

  // Optional Brand and Category check (string matches)
  if (coupon.applyBrand && carBrandName && coupon.applyBrand.toLowerCase() !== carBrandName.toLowerCase()) {
    return 0;
  }
  if (coupon.applyCategory && carCategoryName && coupon.applyCategory.toLowerCase() !== carCategoryName.toLowerCase()) {
    return 0;
  }

  let discount = 0;
  if (coupon.discountType === 'percent') {
    discount = (orderValue * coupon.discountValue) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  } else if (coupon.discountType === 'fixed') {
    discount = coupon.discountValue;
  }

  return discount > orderValue ? orderValue : discount;
};

module.exports = calculateDiscount;
