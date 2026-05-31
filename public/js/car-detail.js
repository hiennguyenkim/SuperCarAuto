let activeCar = null;

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  if (slug) {
    fetchCarDetails(slug);
  } else {
    showToast('Đường dẫn không hợp lệ. Quay lại danh sách xe.', 'error');
    setTimeout(() => {
      window.location.href = '/views/cars.html';
    }, 2000);
  }
});

// Fetch vehicle specs by slug
async function fetchCarDetails(slug) {
  try {
    // Atomically increments viewCount via server route handler on slug lookup
    const res = await fetch(`/api/cars/slug/${slug}`);
    const data = await res.json();

    if (data.success && data.data) {
      activeCar = data.data;
      renderCarDetails(activeCar);
      fetchRelatedCars(activeCar.brand._id, activeCar._id);
    } else {
      showToast(data.message || 'Không tìm thấy chiếc xe này.', 'error');
      setTimeout(() => { window.location.href = '/views/cars.html'; }, 2000);
    }
  } catch (err) {
    showToast('Lỗi kết nối máy chủ khi lấy chi tiết xe.', 'error');
  }
}

function renderCarDetails(car) {
  // Update browser titles
  document.title = `${car.name} — SuperCar Luxury`;

  // Gallery
  const mainGallery = document.getElementById('car-gallery-main');
  const thumbsGallery = document.getElementById('car-gallery-thumbs');
  
  if (mainGallery && car.images && car.images.length > 0) {
    mainGallery.innerHTML = `<img src="${car.images[0]}" alt="${car.name}" id="main-view-image">`;
    
    if (thumbsGallery) {
      let thumbsHTML = '';
      // Limit to max 3 thumbnails (1 main + 2 thumbs)
      car.images.slice(0, 3).forEach((img, index) => {
        thumbsHTML += `
          <div class="gallery-thumb-item" onclick="swapMainImage('${img}')">
            <img src="${img}" alt="${car.name} thumbnail ${index + 1}">
          </div>
        `;
      });
      thumbsGallery.innerHTML = thumbsHTML;
    }
  }

  // Header and title info
  document.getElementById('car-title').textContent = car.name;
  document.getElementById('car-brand-name').textContent = car.brand ? car.brand.name : 'Siêu xe';
  document.getElementById('car-code').textContent = `Mã xe: ${car.code}`;
  document.getElementById('car-description').textContent = car.description || 'Không có mô tả chi tiết.';

  // General Specs
  const specsContainer = document.getElementById('car-specs-grid');
  if (specsContainer) {
    specsContainer.innerHTML = `
      <div class="spec-item"><span>Năm sản xuất</span><span>${car.year}</span></div>
      <div class="spec-item"><span>Số km đã đi</span><span>${car.mileage.toLocaleString()} km</span></div>
      <div class="spec-item"><span>Động cơ</span><span>${car.engine || 'Đang cập nhật'}</span></div>
      <div class="spec-item"><span>Dung tích</span><span>${car.engineCapacity || 'Đang cập nhật'}</span></div>
      <div class="spec-item"><span>Công suất</span><span>${car.horsepower} mã lực</span></div>
      <div class="spec-item"><span>Mô-men xoắn</span><span>${car.torque || 'Đang cập nhật'} Nm</span></div>
      <div class="spec-item"><span>Hộp số</span><span>${car.transmission || 'Đang cập nhật'}</span></div>
      <div class="spec-item"><span>Hệ dẫn động</span><span>${car.drivetrain || 'Đang cập nhật'}</span></div>
      <div class="spec-item"><span>Tăng tốc (0-100 km/h)</span><span>${car.acceleration || 'Đang cập nhật'}</span></div>
      <div class="spec-item"><span>Tốc độ tối đa</span><span>${car.maxSpeed || 'Đang cập nhật'}</span></div>
      <div class="spec-item"><span>Tình trạng pháp lý</span><span>${car.legalStatus || 'Sẵn sàng sang tên'}</span></div>
      <div class="spec-item"><span>Bảo hành</span><span>${car.warranty || 'Đang cập nhật'}</span></div>
    `;
  }

  // Price CTA Box configurations
  const priceTag = document.getElementById('cta-price');
  const oldPriceTag = document.getElementById('cta-old-price');
  const depositBox = document.getElementById('cta-deposit-amount');
  
  if (priceTag) priceTag.textContent = formatCurrencyVND(car.price);
  if (oldPriceTag) {
    if (car.oldPrice) {
      oldPriceTag.textContent = formatCurrencyVND(car.oldPrice);
      oldPriceTag.style.display = 'block';
    } else {
      oldPriceTag.style.display = 'none';
    }
  }
  
  if (depositBox) {
    depositBox.textContent = formatCurrencyVND(car.depositAmount || (car.price * 0.05));
  }

  // Manage Availability logic (Gating Booking/Reservations buttons)
  const appointmentBtn = document.getElementById('btn-book-appointment');
  const testDriveBtn = document.getElementById('btn-book-testdrive');
  const depositBtn = document.getElementById('btn-book-deposit');
  const noticeBox = document.getElementById('availability-notice-box');

  // Clear previous notices
  if (noticeBox) {
    noticeBox.style.display = 'none';
    noticeBox.className = 'cta-deposit-notice';
  }

  if (car.status !== 'available') {
    // Disable cashing (deposit) and test driving for reserved/sold/checking cars
    if (depositBtn) {
      depositBtn.disabled = true;
      depositBtn.textContent = 'Khóa Đặt Cọc';
      depositBtn.style.opacity = '0.5';
    }
    if (testDriveBtn) {
      testDriveBtn.disabled = true;
      testDriveBtn.textContent = 'Khóa Lái Thử';
      testDriveBtn.style.opacity = '0.5';
    }

    if (noticeBox) {
      noticeBox.style.display = 'block';
      if (car.status === 'reserved') {
        noticeBox.innerHTML = '⚠️ Xe này hiện <strong>Đã có khách đặt cọc giữ xe</strong>. Quý khách có thể đặt lịch tư vấn để biết thêm thông tin.';
        noticeBox.classList.add('warning');
      } else if (car.status === 'sold') {
        noticeBox.innerHTML = '🚫 Siêu xe này <strong>Đã được bàn giao (Đã bán)</strong>. Quý khách vui lòng tham khảo các dòng xe tương tự.';
        noticeBox.classList.add('error');
      } else {
        noticeBox.innerHTML = '🕒 Xe đang trong trạng thái <strong>Kiểm tra nội bộ</strong>. Đặt cọc và lái thử tạm thời đóng.';
        noticeBox.classList.add('info');
      }
    }
  } else {
    // Available car status check
    if (depositBtn) {
      depositBtn.href = `/views/deposit.html?carId=${car._id}`;
    }

    // Check allowTestDrive configuration
    if (car.allowTestDrive) {
      if (testDriveBtn) {
        testDriveBtn.href = `/views/test-drive.html?carId=${car._id}`;
      }
    } else {
      if (testDriveBtn) {
        testDriveBtn.disabled = true;
        testDriveBtn.textContent = 'Không hỗ trợ lái thử';
        testDriveBtn.style.opacity = '0.5';
        testDriveBtn.removeAttribute('href');
      }
    }
  }

  // Setup appointment booking link anyway (consultation is always allowed)
  if (appointmentBtn) {
    appointmentBtn.href = `/views/appointment.html?carId=${car._id}`;
  }
}

window.swapMainImage = function(imgSrc) {
  const mainImg = document.getElementById('main-view-image');
  if (mainImg) {
    mainImg.src = imgSrc;
  }
};

// Fetch related cars based on manufacturer
async function fetchRelatedCars(brandId, excludeCarId) {
  const relatedGrid = document.getElementById('related-cars-grid');
  if (!relatedGrid) return;

  try {
    const res = await fetch(`/api/cars?brand=${brandId}&limit=3`);
    const data = await res.json();

    if (data.success && data.data.length > 0) {
      const filtered = data.data.filter(c => c._id !== excludeCarId).slice(0, 3);
      if (filtered.length === 0) {
        relatedGrid.innerHTML = '<p style="color: var(--color-silver);">Không có xe liên quan cùng hãng.</p>';
        return;
      }

      let html = '';
      filtered.forEach(car => {
        html += `
          <a href="/views/car-detail.html?slug=${car.slug}" class="car-card" style="display: block; text-decoration: none; color: inherit;">
            <div class="car-card-img" style="padding-top: 55%;">
              <img src="${car.images[0] || 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=400&q=80'}" alt="${car.name}">
            </div>
            <div class="car-card-body" style="padding: 15px;">
              <h4 style="font-size: 1rem; margin-bottom: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--color-white);">${car.name}</h4>
              <p style="color: var(--color-gold); font-size: 0.9rem; font-weight: 600;">${formatCurrencyVND(car.price)}</p>
            </div>
          </a>
        `;
      });
      relatedGrid.innerHTML = html;
    } else {
      relatedGrid.innerHTML = '<p style="color: var(--color-silver);">Không có xe liên quan.</p>';
    }
  } catch (err) {
    console.error('Failed to load related cars:', err.message);
  }
}
