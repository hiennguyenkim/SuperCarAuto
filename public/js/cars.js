let currentFilters = {
  brand: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  condition: '',
  maxMileage: '',
  sort: 'newest',
  search: '',
  page: 1,
  limit: 6
};

document.addEventListener('DOMContentLoaded', () => {
  // Parse query params from URL
  const urlParams = new URLSearchParams(window.location.search);
  currentFilters.brand = urlParams.get('brand') || '';
  currentFilters.category = urlParams.get('category') || '';
  currentFilters.search = urlParams.get('search') || '';
  currentFilters.condition = urlParams.get('condition') || '';

  // Initialize page
  initCatalogFilters();
  fetchCatalogCars();
  setupCatalogEvents();
});

// Setup brands and categories in filters sidebar
async function initCatalogFilters() {
  try {
    // Populate brands select/checkboxes
    const brandRes = await fetch('/api/brands');
    const brandData = await brandRes.json();
    const brandContainer = document.getElementById('filter-brand-list');
    
    if (brandData.success && brandContainer) {
      let brandHTML = `
        <label class="checkbox-item">
          <input type="radio" name="brand" value="" ${currentFilters.brand === '' ? 'checked' : ''}>
          <span>Tất cả hãng xe</span>
        </label>
      `;
      brandData.data.forEach(b => {
        brandHTML += `
          <label class="checkbox-item">
            <input type="radio" name="brand" value="${b.slug}" ${currentFilters.brand === b.slug ? 'checked' : ''}>
            <span>${b.name}</span>
          </label>
        `;
      });
      brandContainer.innerHTML = brandHTML;
      
      // Add events to brand radios
      document.querySelectorAll('input[name="brand"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
          currentFilters.brand = e.target.value;
          currentFilters.page = 1;
          fetchCatalogCars();
        });
      });
    }

    // Populate categories checkboxes
    const catRes = await fetch('/api/categories');
    const catData = await catRes.json();
    const catContainer = document.getElementById('filter-category-list');
    
    if (catData.success && catContainer) {
      let catHTML = `
        <label class="checkbox-item">
          <input type="radio" name="category" value="" ${currentFilters.category === '' ? 'checked' : ''}>
          <span>Tất cả kiểu dáng</span>
        </label>
      `;
      catData.data.forEach(c => {
        catHTML += `
          <label class="checkbox-item">
            <input type="radio" name="category" value="${c.slug}" ${currentFilters.category === c.slug ? 'checked' : ''}>
            <span>${c.name}</span>
          </label>
        `;
      });
      catContainer.innerHTML = catHTML;

      // Add events to category radios
      document.querySelectorAll('input[name="category"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
          currentFilters.category = e.target.value;
          currentFilters.page = 1;
          fetchCatalogCars();
        });
      });
    }
  } catch (err) {
    console.error('Failed to initialize filters:', err.message);
  }
}

// Fetch cars from API based on active filters
async function fetchCatalogCars() {
  const gridContainer = document.getElementById('catalog-cars-grid');
  const countContainer = document.getElementById('catalog-cars-count');
  
  if (!gridContainer) return;
  
  gridContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--color-silver);">Đang tải dữ liệu xe...</div>';

  try {
    const queryParams = new URLSearchParams();
    Object.keys(currentFilters).forEach(key => {
      if (currentFilters[key]) {
        queryParams.append(key, currentFilters[key]);
      }
    });

    const res = await fetch(`/api/cars?${queryParams.toString()}`);
    const data = await res.json();

    if (data.success) {
      if (countContainer) {
        countContainer.textContent = `Hiển thị ${data.count} trên tổng số ${data.pagination.total} xe`;
      }

      if (data.data.length === 0) {
        gridContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--color-silver);">Không tìm thấy chiếc xe nào phù hợp với bộ lọc của bạn.</div>';
        renderPagination(data.pagination);
        return;
      }

      let gridHTML = '';
      data.data.forEach(car => {
        const carImg = car.images[0] || 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=600&q=80';
        
        let statusBadge = '';
        if (car.status === 'reserved') {
          statusBadge = '<span class="car-badge reserved">Đã Đặt Cọc</span>';
        } else if (car.status === 'sold') {
          statusBadge = '<span class="car-badge sold">Đã Bán</span>';
        } else if (car.status === 'coming_soon') {
          statusBadge = '<span class="car-badge">Sắp Về</span>';
        } else if (car.status === 'consignment') {
          statusBadge = '<span class="car-badge">Ký Gửi</span>';
        }

        gridHTML += `
          <a href="/views/car-detail.html?slug=${car.slug}" class="car-card" style="display: flex; text-decoration: none; color: inherit;">
            <div class="car-card-img">
              <img src="${carImg}" alt="${car.name}" loading="lazy">
              ${statusBadge}
              <button class="car-wishlist-btn" data-car-id="${car._id}" aria-label="Thêm vào yêu thích">
                <i class="far fa-heart"></i>
              </button>
            </div>
            <div class="car-card-body">
              <div class="car-card-brand">${car.brand ? car.brand.name : 'Supercar'}</div>
              <h3 class="car-card-title">${car.name}</h3>
              <div class="car-card-specs">
                <div class="car-card-spec-item"><i class="fas fa-calendar-alt"></i> ${car.year}</div>
                <div class="car-card-spec-item"><i class="fas fa-tachometer-alt"></i> ${car.mileage.toLocaleString()} km</div>
                <div class="car-card-spec-item"><i class="fas fa-bolt"></i> ${car.horsepower} hp</div>
                <div class="car-card-spec-item"><i class="fas fa-cog"></i> ${car.transmission.split(' ')[0]}</div>
              </div>
              <div class="car-card-footer">
                <div class="car-card-price">${formatCurrencyVND(car.price)}</div>
              </div>
            </div>
          </a>
        `;
      });
      gridContainer.innerHTML = gridHTML;

      // Sync wishlist buttons states
      updateWishlistButtonsState();
      setupWishlistEvents();
      renderPagination(data.pagination);
    } else {
      gridContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #d90429;">Lỗi: ${data.message}</div>`;
    }
  } catch (err) {
    gridContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #d90429;">Lỗi kết nối máy chủ.</div>';
  }
}

// Handle wishlist clicks in catalog
function setupWishlistEvents() {
  document.querySelectorAll('.car-wishlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const carId = btn.getAttribute('data-car-id');
      toggleWishlist(carId);
    });
  });
}

// Render pagination buttons
function renderPagination(meta) {
  const container = document.getElementById('catalog-pagination');
  if (!container || !meta) return;

  if (meta.totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  // Prev page
  if (meta.page > 1) {
    html += `<button class="page-btn" onclick="goToPage(${meta.page - 1})"><i class="fas fa-chevron-left"></i></button>`;
  }

  for (let i = 1; i <= meta.totalPages; i++) {
    html += `
      <button class="page-btn ${meta.page === i ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>
    `;
  }

  // Next page
  if (meta.page < meta.totalPages) {
    html += `<button class="page-btn" onclick="goToPage(${meta.page + 1})"><i class="fas fa-chevron-right"></i></button>`;
  }

  container.innerHTML = html;
}

window.goToPage = function(pageNum) {
  currentFilters.page = pageNum;
  fetchCatalogCars();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Setup filters form listeners
function setupCatalogEvents() {
  // Sort changes
  const sortSelect = document.getElementById('catalog-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentFilters.sort = e.target.value;
      currentFilters.page = 1;
      fetchCatalogCars();
    });
  }

  // Search input
  const searchInput = document.getElementById('catalog-search-input');
  if (searchInput) {
    let timeout = null;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        currentFilters.search = e.target.value.trim();
        currentFilters.page = 1;
        fetchCatalogCars();
      }, 500); // debounce search query
    });
  }

  // Price range filters
  const minPriceInput = document.getElementById('filter-min-price');
  const maxPriceInput = document.getElementById('filter-max-price');
  
  if (minPriceInput && maxPriceInput) {
    let priceTimeout = null;
    const handlePriceChange = () => {
      clearTimeout(priceTimeout);
      priceTimeout = setTimeout(() => {
        currentFilters.minPrice = minPriceInput.value ? Number(minPriceInput.value) * 1000000 : ''; // support million inputs
        currentFilters.maxPrice = maxPriceInput.value ? Number(maxPriceInput.value) * 1000000 : '';
        currentFilters.page = 1;
        fetchCatalogCars();
      }, 800);
    };

    minPriceInput.addEventListener('input', handlePriceChange);
    maxPriceInput.addEventListener('input', handlePriceChange);
  }

  // Condition dropdown
  const conditionRadios = document.querySelectorAll('input[name="condition"]');
  conditionRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      currentFilters.condition = e.target.value;
      currentFilters.page = 1;
      fetchCatalogCars();
    });
  });
}
