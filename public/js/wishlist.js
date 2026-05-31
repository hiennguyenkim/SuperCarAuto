// Wishlist helper utilizing localStorage
const WISHLIST_KEY = 'supercar_luxury_wishlist';

function getWishlist() {
  const list = localStorage.getItem(WISHLIST_KEY);
  return list ? JSON.parse(list) : [];
}

function toggleWishlist(carId) {
  let list = getWishlist();
  const index = list.indexOf(carId);
  
  if (index === -1) {
    list.push(carId);
    showToast('Đã thêm xe vào danh sách yêu thích!', 'success');
  } else {
    list.splice(index, 1);
    showToast('Đã xóa xe khỏi danh sách yêu thích!', 'info');
  }
  
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  
  // Trigger UI button updates globally if available
  updateWishlistButtonsState();
}

function isInWishlist(carId) {
  const list = getWishlist();
  return list.includes(carId);
}

// Synchronise styling on car cards
function updateWishlistButtonsState() {
  const buttons = document.querySelectorAll('.car-wishlist-btn');
  buttons.forEach(btn => {
    const carId = btn.getAttribute('data-car-id');
    if (isInWishlist(carId)) {
      btn.classList.add('active');
      btn.innerHTML = '<i class="fas fa-heart"></i>';
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '<i class="far fa-heart"></i>';
    }
  });
}
