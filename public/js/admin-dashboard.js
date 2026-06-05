let contactsPollInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  if (typeof renderSidebar === 'function') {
    renderSidebar();
  }
  verifyAdminAccess();
  setupTabNavigation();

  // Bind Form submits
  setupCarFormSubmit();
  setupBrandFormSubmit();
  setupCategoryFormSubmit();
  setupCollectionFormSubmit();
  setupCouponFormSubmit();
  setupHomepageSettingsForms();

  // Load initial tab data
  const urlParams = new URLSearchParams(window.location.search);
  const activeTab = urlParams.get('tab') || 'tab-overview';
  
  // Set active class on menu items and tabs
  const menuItems = document.querySelectorAll('.dashboard-menu-item[data-tab]');
  const tabs = document.querySelectorAll('.dashboard-content-tab');
  
  menuItems.forEach(mi => {
    if (mi.getAttribute('data-tab') === activeTab) mi.classList.add('active');
    else mi.classList.remove('active');
  });
  
  tabs.forEach(tab => {
    if (tab.id === activeTab) tab.classList.add('active');
    else tab.classList.remove('active');
  });

  loadAdminTabContent(activeTab);
});

async function verifyAdminAccess() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (!data.success || !data.user || data.user.role !== 'admin') {
      window.location.href = '/views/login.html';
      return;
    }
    
    const adminNameEl = document.getElementById('admin-sidebar-name');
    const adminRoleEl = document.getElementById('admin-sidebar-role');
    if (adminNameEl) adminNameEl.textContent = data.user.fullName;
    if (adminRoleEl) adminRoleEl.textContent = 'Quản Trị Viên';
  } catch (err) {
    window.location.href = '/views/login.html';
  }
}

function setupTabNavigation() {
  const menuItems = document.querySelectorAll('.dashboard-menu-item[data-tab]');
  const tabs = document.querySelectorAll('.dashboard-content-tab');

  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTabId = item.getAttribute('data-tab');

      // Update URL query parameter
      window.history.replaceState(null, '', '?tab=' + targetTabId);

      menuItems.forEach(mi => mi.classList.remove('active'));
      item.classList.add('active');

      tabs.forEach(tab => {
        if (tab.id === targetTabId) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });

      loadAdminTabContent(targetTabId);
    });
  });
}

function loadAdminTabContent(tabId) {
  if (contactsPollInterval) {
    clearInterval(contactsPollInterval);
    contactsPollInterval = null;
  }

  if (tabId === 'tab-overview') {
    fetchAdminOverviewStats();
  } else if (tabId === 'tab-cars') {
    fetchAdminCars();
  } else if (tabId === 'tab-brands') {
    fetchAdminBrands();
  } else if (tabId === 'tab-categories') {
    fetchAdminCategories();
  } else if (tabId === 'tab-collections') {
    fetchAdminCollections();
  } else if (tabId === 'tab-appointments') {
    fetchAdminAppointments();
  } else if (tabId === 'tab-test-drives') {
    fetchAdminTestDrives();
  } else if (tabId === 'tab-deposits') {
    fetchAdminDeposits();
  } else if (tabId === 'tab-orders') {
    fetchAdminOrders();
  } else if (tabId === 'tab-coupons') {
    fetchAdminCoupons();
  } else if (tabId === 'tab-accounts') {
    fetchAdminAccounts();
  } else if (tabId === 'tab-reviews') {
    fetchAdminReviews();
  } else if (tabId === 'tab-contacts') {
    fetchAdminContacts();
    contactsPollInterval = setInterval(() => fetchAdminContacts(true), 5000);
  } else if (tabId === 'tab-audit-logs') {
    fetchAdminAuditLogs();
  } else if (tabId === 'tab-homepage-settings') {
    loadHomepageSettings();
  }
}

// 1. Overview Tab
async function fetchAdminOverviewStats() {
  try {
    const carRes = await fetch('/api/cars?all=true');
    const carData = await carRes.json();
    const accRes = await fetch('/api/accounts');
    const accData = await accRes.json();
    const ordRes = await fetch('/api/orders');
    const ordData = await ordRes.json();

    if (carData.success && accData.success && ordData.success) {
      document.getElementById('stat-total-cars').textContent = carData.pagination.total;
      document.getElementById('stat-total-accounts').textContent = accData.count;

      const completedOrders = ordData.data.filter(o => o.orderStatus === 'completed');
      const revenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
      document.getElementById('stat-total-revenue').textContent = formatCurrencyVND(revenue);
    }
  } catch (err) {
    console.error('Failed to load admin overview:', err.message);
  }
}

// 2. Cars Management CRUD
async function fetchAdminCars() {
  const tbody = document.getElementById('admin-cars-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Đang tải danh sách xe...</td></tr>';

  try {
    const res = await fetch('/api/cars?all=true');
    const data = await res.json();
    
    // Load brands list to populate car creation dropdown
    const brandRes = await fetch('/api/brands');
    const brandData = await brandRes.json();
    const carBrandSelect = document.getElementById('car-brand');
    if (brandData.success && carBrandSelect) {
      let options = '<option value="">-- Chọn Hãng Xe --</option>';
      brandData.data.forEach(b => {
        options += `<option value="${b._id}">${b.name}</option>`;
      });
      carBrandSelect.innerHTML = options;
    }

    // Load categories list to populate car creation dropdown
    const catRes = await fetch('/api/categories');
    const catData = await catRes.json();
    const carCatSelect = document.getElementById('car-category');
    if (catData.success && carCatSelect) {
      let options = '<option value="">-- Chọn Kiểu Dáng --</option>';
      catData.data.forEach(c => {
        options += `<option value="${c._id}">${c.name}</option>`;
      });
      carCatSelect.innerHTML = options;
    }

    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Không có xe nào trong kho hàng.</td></tr>';
        return;
      }

      let html = '';
      data.data.forEach(car => {
        const brandName = car.brand ? car.brand.name : '—';
        const price = formatCurrencyVND(car.price);
        
        let actions = `
          <div class="action-btn-group">
            <button class="action-btn" onclick="openEditCarModal('${car._id}')" title="Sửa thông tin xe"><i class="fas fa-edit"></i></button>
            <button class="action-btn" onclick="toggleFeaturedCar('${car._id}', ${!car.isFeatured})" title="Nổi bật (Hiện tại: ${car.isFeatured})">
              <i class="fa${car.isFeatured ? 's' : 'r'} fa-star" style="color: ${car.isFeatured ? 'var(--color-gold)' : '#fff'};"></i>
            </button>
            <button class="action-btn btn-danger-hover" onclick="deleteCarItem('${car._id}')" title="Xóa xe"><i class="fas fa-trash-alt"></i></button>
          </div>
        `;

        html += `
          <tr>
            <td><strong>${car.code}</strong></td>
            <td>${car.name}</td>
            <td>${brandName}</td>
            <td>${price}</td>
            <td><span class="badge-status ${car.status}">${car.status}</span></td>
            <td>${car.viewCount}</td>
            <td>${actions}</td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #d90429;">Lỗi tải dữ liệu.</td></tr>';
  }
}

function setupCarFormSubmit() {
  const form = document.getElementById('admin-create-car-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const code = document.getElementById('car-code-input').value.trim();
    const name = document.getElementById('car-name-input').value.trim();
    const brandId = document.getElementById('car-brand').value;
    const categoryId = document.getElementById('car-category').value;
    const price = document.getElementById('car-price-input').value;
    const depositAmount = document.getElementById('car-deposit-input').value;
    const model = document.getElementById('car-model-input').value.trim();
    const year = document.getElementById('car-year-input').value;
    const horsepower = document.getElementById('car-horsepower-input').value;
    const transmission = document.getElementById('car-transmission').value;
    const description = document.getElementById('car-desc-input').value.trim();
    const imageInput = document.getElementById('car-image-upload');
    const allowTestDrive = document.getElementById('car-allowTestDrive').checked;

    if (!code || !name || !brandId || !categoryId || !price || !depositAmount) {
      showToast('Vui lòng nhập các thông tin xe bắt buộc!', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('code', code);
    formData.append('name', name);
    formData.append('brand', brandId);
    formData.append('category', categoryId);
    formData.append('price', Number(price));
    formData.append('depositAmount', Number(depositAmount));
    formData.append('model', model);
    formData.append('year', Number(year));
    formData.append('horsepower', Number(horsepower));
    formData.append('transmission', transmission);
    formData.append('description', description);
    formData.append('allowTestDrive', allowTestDrive);

    // If Unsplash URL is pasted instead of file upload
    const urlImage = document.getElementById('car-image-url').value.trim();
    if (urlImage) {
      formData.append('images', urlImage);
    } else if (imageInput && imageInput.files.length > 0) {
      for (let i = 0; i < imageInput.files.length; i++) {
        formData.append('images', imageInput.files[i]);
      }
    }

    try {
      const res = await fetch('/api/cars', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Thêm siêu xe mới vào hệ thống thành công!', 'success');
        form.reset();
        fetchAdminCars();
      } else {
        showToast(data.message || 'Lỗi thêm xe.', 'error');
      }
    } catch (err) {
      showToast('Lỗi kết nối máy chủ.', 'error');
    }
  });
}

window.toggleFeaturedCar = async function(carId, isFeatured) {
  try {
    const res = await fetch(`/api/cars/${carId}/featured`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFeatured })
    });
    if (res.ok) {
      showToast('Đã cập nhật trạng thái xe nổi bật!', 'success');
      fetchAdminCars();
    }
  } catch (e) {
    showToast('Lỗi máy chủ.', 'error');
  }
};

window.deleteCarItem = function(carId) {
  showModal('Xóa Siêu Xe Khỏi Hệ Thống', 'Bạn có chắc chắn muốn xóa xe này vĩnh viễn? Hành động này không thể hoàn tác.', async () => {
    try {
      const res = await fetch(`/api/cars/${carId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Xóa xe thành công!', 'success');
        fetchAdminCars();
      } else {
        showToast('Xóa xe thất bại.', 'error');
      }
    } catch (e) {
      showToast('Lỗi kết nối.', 'error');
    }
  });
};

// 3. Brands Management CRUD
async function fetchAdminBrands() {
  const tbody = document.getElementById('admin-brands-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Đang tải danh sách hãng...</td></tr>';

  try {
    const res = await fetch('/api/brands?all=true');
    const data = await res.json();

    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Không có hãng xe nào.</td></tr>';
        return;
      }

      let html = '';
      data.data.forEach(brand => {
        const logo = brand.logo ? `<img src="${brand.logo}" class="proof-thumbnail" style="width: 50px; height: 35px; object-fit: contain;">` : 'Không có';
        
        let actions = `
          <div class="action-btn-group">
            <button class="action-btn" onclick="openEditBrandModal('${brand._id}')" title="Sửa hãng xe"><i class="fas fa-edit"></i></button>
            <button class="action-btn btn-danger-hover" onclick="deleteBrandItem('${brand._id}')" title="Xóa hãng"><i class="fas fa-trash-alt"></i></button>
          </div>
        `;

        html += `
          <tr>
            <td>${brand.name}</td>
            <td>${logo}</td>
            <td>${brand.country}</td>
            <td><span class="badge-status ${brand.isActive ? 'confirmed' : 'cancelled'}">${brand.isActive ? 'Active' : 'Locked'}</span></td>
            <td>${actions}</td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #d90429;">Lỗi tải dữ liệu.</td></tr>';
  }
}

function setupBrandFormSubmit() {
  const form = document.getElementById('admin-create-brand-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('brand-name-input').value.trim();
    const country = document.getElementById('brand-country-input').value.trim();
    const description = document.getElementById('brand-desc-input').value.trim();
    const logoInput = document.getElementById('brand-logo-upload');

    if (!name || !country) {
      showToast('Vui lòng nhập tên hãng và quốc gia!', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('country', country);
    formData.append('description', description);
    
    const urlLogo = document.getElementById('brand-logo-url').value.trim();
    if (urlLogo) {
      formData.append('logo', urlLogo);
    } else if (logoInput && logoInput.files[0]) {
      formData.append('logo', logoInput.files[0]);
    }

    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        showToast('Thêm hãng xe thành công!', 'success');
        form.reset();
        fetchAdminBrands();
      } else {
        showToast('Thêm hãng xe thất bại.', 'error');
      }
    } catch (e) {
      showToast('Lỗi máy chủ.', 'error');
    }
  });
}

window.deleteBrandItem = function(brandId) {
  showModal('Xóa Hãng Xe', 'Bạn có chắc chắn muốn xóa hãng xe này? Toàn bộ xe thuộc hãng này có thể bị mất mối liên kết.', async () => {
    try {
      const res = await fetch(`/api/brands/${brandId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Xóa thương hiệu xe thành công!', 'success');
        fetchAdminBrands();
      } else {
        showToast('Xóa thất bại.', 'error');
      }
    } catch (e) {
      showToast('Lỗi máy chủ.', 'error');
    }
  });
};

// 4. Coupons Management CRUD
async function fetchAdminCoupons() {
  const tbody = document.getElementById('admin-coupons-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Đang tải mã giảm giá...</td></tr>';

  try {
    const res = await fetch('/api/coupons');
    const data = await res.json();

    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Chưa lập mã ưu đãi nào.</td></tr>';
        return;
      }

      let html = '';
      data.data.forEach(c => {
        const val = c.discountType === 'percent' ? `${c.discountValue}%` : formatCurrencyVND(c.discountValue);
        const limitStr = c.usageLimit ? `${c.usedCount} / ${c.usageLimit}` : `${c.usedCount} / ∞`;
        const expDate = c.endDate ? new Date(c.endDate).toLocaleDateString('vi-VN') : 'Vô hạn';
        
        let actions = `
          <div class="action-btn-group">
            <button class="action-btn" onclick="openEditCouponModal('${c._id}')" title="Sửa mã giảm giá"><i class="fas fa-edit"></i></button>
            <button class="action-btn btn-danger-hover" onclick="deleteCouponItem('${c._id}')" title="Xóa mã"><i class="fas fa-trash-alt"></i></button>
          </div>
        `;

        html += `
          <tr>
            <td><strong>${c.code}</strong></td>
            <td>${c.name}</td>
            <td>${val}</td>
            <td>${limitStr}</td>
            <td>${expDate}</td>
            <td>${actions}</td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #d90429;">Lỗi tải dữ liệu.</td></tr>';
  }
}

function setupCouponFormSubmit() {
  const form = document.getElementById('admin-create-coupon-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const code = document.getElementById('coupon-code-input').value.toUpperCase().trim();
    const name = document.getElementById('coupon-name-input').value.trim();
    const discountType = document.getElementById('coupon-type').value;
    const discountValue = document.getElementById('coupon-value-input').value;
    const minOrderValue = document.getElementById('coupon-min-input').value || 0;
    const usageLimit = document.getElementById('coupon-limit-input').value || 1;
    const endDate = document.getElementById('coupon-end-date').value;

    if (!code || !name || !discountValue) {
      showToast('Vui lòng nhập đầy đủ các thông tin mã giảm giá!', 'error');
      return;
    }

    const couponData = {
      code,
      name,
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue),
      usageLimit: Number(usageLimit),
      endDate: endDate || undefined
    };

    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(couponData)
      });
      if (res.ok) {
        showToast('Tạo mã giảm giá mới thành công!', 'success');
        form.reset();
        fetchAdminCoupons();
      } else {
        showToast('Tạo mã thất bại. Code có thể bị trùng.', 'error');
      }
    } catch (e) {
      showToast('Lỗi máy chủ.', 'error');
    }
  });
}

window.deleteCouponItem = function(couponId) {
  showModal('Xóa Mã Ưu Đãi', 'Bạn có chắc chắn muốn xóa mã giảm giá này vĩnh viễn?', async () => {
    try {
      const res = await fetch(`/api/coupons/${couponId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Xóa mã giảm giá thành công!', 'success');
        fetchAdminCoupons();
      }
    } catch (e) {
      showToast('Lỗi máy chủ.', 'error');
    }
  });
};

// 5. Account and Permissions Management
async function fetchAdminAccounts() {
  const tbody = document.getElementById('admin-accounts-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Đang tải danh sách tài khoản...</td></tr>';

  try {
    const res = await fetch('/api/accounts');
    const data = await res.json();

    if (data.success) {
      let html = '';
      data.data.forEach(acc => {
        let lockAction = '';
        if (acc.isActive) {
          lockAction = `<button class="action-btn btn-danger-hover" onclick="lockUserAccount('${acc._id}')" title="Khóa tài khoản"><i class="fas fa-lock"></i></button>`;
        } else {
          lockAction = `<button class="action-btn" onclick="unlockUserAccount('${acc._id}')" style="background: #55a630;" title="Mở khóa"><i class="fas fa-lock-open"></i></button>`;
        }

        let roleSelectHTML = `
          <select onchange="changeUserRole('${acc._id}', this.value)" style="background: #222; border: 1px solid #444; color: #fff; padding: 4px; border-radius: 4px;">
            <option value="user" ${acc.role === 'user' ? 'selected' : ''}>Khách hàng</option>
            <option value="staff" ${acc.role === 'staff' ? 'selected' : ''}>Staff</option>
            <option value="admin" ${acc.role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
        `;

        let actions = `
          <div class="action-btn-group">
            ${lockAction}
            <button class="action-btn btn-danger-hover" onclick="deleteUserAccount('${acc._id}')" title="Xóa tài khoản"><i class="fas fa-user-minus"></i></button>
          </div>
        `;

        html += `
          <tr>
            <td>${acc.fullName} <br><small>${acc.username}</small></td>
            <td>${acc.email}</td>
            <td>${acc.phone || '—'}</td>
            <td>${roleSelectHTML}</td>
            <td><span class="badge-status ${acc.isActive ? 'confirmed' : 'cancelled'}">${acc.isActive ? 'Active' : 'Locked'}</span></td>
            <td>${actions}</td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #d90429;">Lỗi tải tài khoản.</td></tr>';
  }
}

window.lockUserAccount = async function(accId) {
  try {
    const res = await fetch(`/api/accounts/${accId}/lock`, { method: 'PUT' });
    const data = await res.json();
    if (res.ok) {
      showToast('Đã khóa tài khoản!', 'success');
      fetchAdminAccounts();
    } else {
      showToast(data.message || 'Lỗi khóa tài khoản.', 'error');
    }
  } catch (e) {
    showToast('Lỗi máy chủ.', 'error');
  }
};

window.unlockUserAccount = async function(accId) {
  try {
    const res = await fetch(`/api/accounts/${accId}/unlock`, { method: 'PUT' });
    const data = await res.json();
    if (res.ok) {
      showToast('Đã mở khóa tài khoản thành công!', 'success');
      fetchAdminAccounts();
    } else {
      showToast(data.message || 'Lỗi mở khóa.', 'error');
    }
  } catch (e) {
    showToast('Lỗi kết nối.', 'error');
  }
};

window.changeUserRole = async function(accId, role) {
  try {
    const res = await fetch(`/api/accounts/${accId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Thay đổi chức vụ thành công!', 'success');
      fetchAdminAccounts();
    } else {
      showToast(data.message || 'Lỗi thay đổi chức vụ.', 'error');
      fetchAdminAccounts(); // Re-render state to previous select option
    }
  } catch (e) {
    showToast('Lỗi máy chủ.', 'error');
  }
};

window.deleteUserAccount = function(accId) {
  showModal('Xóa Tài Khoản Người Dùng', 'Bạn có chắc chắn muốn xóa tài khoản này vĩnh viễn? Điều này sẽ xóa toàn bộ lịch sử tư vấn và hóa đơn liên quan.', async () => {
    try {
      const res = await fetch(`/api/accounts/${accId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showToast('Xóa tài khoản thành công!', 'success');
        fetchAdminAccounts();
      } else {
        showToast(data.message || 'Không thể xóa.', 'error');
      }
    } catch (e) {
      showToast('Lỗi kết nối.', 'error');
    }
  });
};

// 6. Security Audit Logs Retrieval
async function fetchAdminAuditLogs() {
  const tbody = document.getElementById('admin-logs-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Đang tải nhật ký hoạt động...</td></tr>';

  try {
    const res = await fetch('/api/audit-logs');
    const data = await res.json();

    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nhật ký hệ thống trống.</td></tr>';
        return;
      }

      let html = '';
      data.data.forEach(log => {
        const actor = log.user ? `${log.user.fullName} (${log.user.role})` : 'Hệ thống tự động';
        const dateStr = new Date(log.createdAt).toLocaleString('vi-VN');
        const target = log.targetType ? `${log.targetType} [${log.targetId}]` : '—';
        
        let oldVal = log.oldData ? JSON.stringify(log.oldData) : '—';
        let newVal = log.newData ? JSON.stringify(log.newData) : '—';

        // Truncate logs content for layout fit
        if (oldVal.length > 50) oldVal = oldVal.slice(0, 50) + '...';
        if (newVal.length > 50) newVal = newVal.slice(0, 50) + '...';

        html += `
          <tr>
            <td>${dateStr}</td>
            <td><strong>${actor}</strong></td>
            <td><code style="color: var(--color-gold);">${log.action}</code></td>
            <td>${target}</td>
            <td title="Trước: ${log.oldData ? JSON.stringify(log.oldData) : ''} | Sau: ${log.newData ? JSON.stringify(log.newData) : ''}">
              <small>Trước: ${oldVal}</small><br><small>Sau: ${newVal}</small>
            </td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #d90429;">Lỗi tải dữ liệu logs.</td></tr>';
  }
}

// ================= EDIT MODALS IMPLEMENTATION =================

let editCarDeletedImages = [];

window.openEditCarModal = async function(carId) {
  try {
    const res = await fetch(`/api/cars/${carId}`);
    const data = await res.json();
    if (!data.success || !data.data) {
      showToast('Không tải được thông tin xe.', 'error');
      return;
    }
    const car = data.data;

    // Populate fields
    document.getElementById('edit-car-id').value = car._id;
    document.getElementById('edit-car-code').value = car.code;
    document.getElementById('edit-car-name').value = car.name;
    document.getElementById('edit-car-price').value = car.price;
    document.getElementById('edit-car-oldPrice').value = car.oldPrice || '';
    document.getElementById('edit-car-depositAmount').value = car.depositAmount;
    document.getElementById('edit-car-year').value = car.year || '';
    document.getElementById('edit-car-condition').value = car.condition || 'new';
    document.getElementById('edit-car-status').value = car.status || 'available';
    document.getElementById('edit-car-allowTestDrive').checked = !!car.allowTestDrive;
    document.getElementById('edit-car-isFeatured').checked = !!car.isFeatured;

    // Specs
    document.getElementById('edit-car-mileage').value = car.mileage || 0;
    document.getElementById('edit-car-exteriorColor').value = car.exteriorColor || '';
    document.getElementById('edit-car-engine').value = car.engine || '';
    document.getElementById('edit-car-horsepower').value = car.horsepower || '';
    document.getElementById('edit-car-transmission').value = car.transmission || '';
    document.getElementById('edit-car-description').value = car.description || '';

    // Legal & Warranty
    document.getElementById('edit-car-legalStatus').value = car.legalStatus || '';
    document.getElementById('edit-car-warranty').value = car.warranty || '';

    // Brands & Categories options
    const brandSelect = document.getElementById('edit-car-brand');
    const catSelect = document.getElementById('edit-car-category');
    
    // Copy options from creation forms
    brandSelect.innerHTML = document.getElementById('car-brand').innerHTML;
    catSelect.innerHTML = document.getElementById('car-category').innerHTML;
    
    brandSelect.value = car.brand ? car.brand._id : '';
    catSelect.value = car.category ? car.category._id : '';

    // Images
    editCarDeletedImages = [];
    renderEditCarImages(car.images);

    // Reset tab status
    switchEditCarTab('edit-car-tab-basic');

    // Show modal
    document.getElementById('edit-car-modal').classList.add('show');
  } catch (err) {
    showToast('Lỗi máy chủ: ' + err.message, 'error');
  }
};

function renderEditCarImages(images) {
  const container = document.getElementById('edit-car-images-container');
  if (!container) return;
  
  if (!images || images.length === 0) {
    container.innerHTML = '<div style="color: #ccc; font-size: 0.8rem;">Không có ảnh nào.</div>';
    return;
  }

  let html = '';
  images.forEach(img => {
    if (!editCarDeletedImages.includes(img)) {
      html += `
        <div style="position: relative; width: 100px; height: 70px; border-radius: 4px; overflow: hidden; border: var(--glass-border);">
          <img src="${img}" style="width: 100%; height: 100%; object-fit: cover;">
          <button type="button" onclick="deleteEditCarImage('${img}')" style="position: absolute; top: 2px; right: 2px; background: rgba(217, 4, 41, 0.8); border: none; color: #fff; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; cursor: pointer;"><i class="fas fa-times"></i></button>
        </div>
      `;
    }
  });
  container.innerHTML = html;
}

window.deleteEditCarImage = function(imgUrl) {
  editCarDeletedImages.push(imgUrl);
  const carId = document.getElementById('edit-car-id').value;
  fetch(`/api/cars/${carId}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        const remaining = data.data.images.filter(img => !editCarDeletedImages.includes(img));
        renderEditCarImages(remaining);
      }
    });
};

window.closeEditCarModal = function() {
  document.getElementById('edit-car-modal').classList.remove('show');
};

window.switchEditCarTab = function(tabId) {
  document.querySelectorAll('#edit-car-modal .modal-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
      btn.style.color = 'var(--color-gold)';
      btn.style.borderBottom = '2px solid var(--color-gold)';
    } else {
      btn.classList.remove('active');
      btn.style.color = '#ccc';
      btn.style.borderBottom = 'none';
    }
  });

  document.querySelectorAll('#edit-car-modal .modal-tab-pane').forEach(pane => {
    if (pane.id === tabId) {
      pane.style.display = 'block';
    } else {
      pane.style.display = 'none';
    }
  });
};

window.submitEditCarForm = async function() {
  const carId = document.getElementById('edit-car-id').value;
  const name = document.getElementById('edit-car-name').value.trim();
  const brand = document.getElementById('edit-car-brand').value;
  const category = document.getElementById('edit-car-category').value;
  const price = document.getElementById('edit-car-price').value;
  const oldPrice = document.getElementById('edit-car-oldPrice').value;
  const depositAmount = document.getElementById('edit-car-depositAmount').value;
  const year = document.getElementById('edit-car-year').value;
  const condition = document.getElementById('edit-car-condition').value;
  const status = document.getElementById('edit-car-status').value;
  const allowTestDrive = document.getElementById('edit-car-allowTestDrive').checked;
  const isFeatured = document.getElementById('edit-car-isFeatured').checked;

  const mileage = document.getElementById('edit-car-mileage').value;
  const exteriorColor = document.getElementById('edit-car-exteriorColor').value.trim();
  const engine = document.getElementById('edit-car-engine').value.trim();
  const horsepower = document.getElementById('edit-car-horsepower').value;
  const transmission = document.getElementById('edit-car-transmission').value.trim();
  const description = document.getElementById('edit-car-description').value.trim();

  const legalStatus = document.getElementById('edit-car-legalStatus').value.trim();
  const warranty = document.getElementById('edit-car-warranty').value.trim();

  const newImagesInput = document.getElementById('edit-car-new-images');

  if (!name || !brand || !category || !price || !depositAmount) {
    showToast('Vui lòng nhập các thông tin xe bắt buộc!', 'error');
    return;
  }

  const carRes = await fetch(`/api/cars/${carId}`);
  const carData = await carRes.json();
  let remainingImages = [];
  if (carData.success && carData.data) {
    remainingImages = carData.data.images.filter(img => !editCarDeletedImages.includes(img));
  }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('brand', brand);
  formData.append('category', category);
  formData.append('price', Number(price));
  formData.append('oldPrice', oldPrice ? Number(oldPrice) : '');
  formData.append('depositAmount', Number(depositAmount));
  formData.append('year', year ? Number(year) : '');
  formData.append('condition', condition);
  formData.append('status', status);
  formData.append('allowTestDrive', allowTestDrive);
  formData.append('isFeatured', isFeatured);

  formData.append('mileage', mileage ? Number(mileage) : 0);
  formData.append('exteriorColor', exteriorColor);
  formData.append('engine', engine);
  formData.append('horsepower', horsepower ? Number(horsepower) : '');
  formData.append('transmission', transmission);
  formData.append('description', description);

  formData.append('legalStatus', legalStatus);
  formData.append('warranty', warranty);

  formData.append('images', JSON.stringify(remainingImages));

  if (newImagesInput && newImagesInput.files.length > 0) {
    for (let i = 0; i < newImagesInput.files.length; i++) {
      formData.append('images', newImagesInput.files[i]);
    }
  }

  try {
    const res = await fetch(`/api/cars/${carId}`, {
      method: 'PUT',
      body: formData
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Cập nhật siêu xe thành công!', 'success');
      closeEditCarModal();
      fetchAdminCars();
    } else {
      showToast(data.message || 'Lỗi cập nhật xe.', 'error');
    }
  } catch (err) {
    showToast('Lỗi máy chủ.', 'error');
  }
};

window.openEditBrandModal = async function(brandId) {
  try {
    const res = await fetch(`/api/brands/${brandId}`);
    const data = await res.json();
    if (!data.success || !data.data) {
      showToast('Không tải được thông tin hãng xe.', 'error');
      return;
    }
    const brand = data.data;

    document.getElementById('edit-brand-id').value = brand._id;
    document.getElementById('edit-brand-name').value = brand.name;
    document.getElementById('edit-brand-slug').value = brand.slug;
    document.getElementById('edit-brand-country').value = brand.country;
    document.getElementById('edit-brand-description').value = brand.description || '';
    document.getElementById('edit-brand-logo-preview').src = brand.logo || '';
    document.getElementById('edit-brand-isActive').checked = !!brand.isActive;

    const nameInput = document.getElementById('edit-brand-name');
    nameInput.oninput = () => {
      document.getElementById('edit-brand-slug').value = generateSlug(nameInput.value);
    };

    document.getElementById('edit-brand-modal').classList.add('show');
  } catch (e) {
    showToast('Lỗi tải hãng xe.', 'error');
  }
};

window.closeEditBrandModal = function() {
  document.getElementById('edit-brand-modal').classList.remove('show');
};

window.submitEditBrandForm = async function() {
  const brandId = document.getElementById('edit-brand-id').value;
  const name = document.getElementById('edit-brand-name').value.trim();
  const country = document.getElementById('edit-brand-country').value.trim();
  const description = document.getElementById('edit-brand-description').value.trim();
  const isActive = document.getElementById('edit-brand-isActive').checked;
  const logoFile = document.getElementById('edit-brand-logo-file').files[0];

  if (!name || !country) {
    showToast('Tên hãng xe và quốc gia là bắt buộc!', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('country', country);
  formData.append('description', description);
  formData.append('isActive', isActive);
  if (logoFile) {
    formData.append('logo', logoFile);
  }

  try {
    const res = await fetch(`/api/brands/${brandId}`, {
      method: 'PUT',
      body: formData
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Cập nhật hãng xe thành công!', 'success');
      closeEditBrandModal();
      fetchAdminBrands();
    } else {
      showToast(data.message || 'Lỗi cập nhật.', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối.', 'error');
  }
};

window.openEditCouponModal = async function(couponId) {
  try {
    const res = await fetch(`/api/coupons`);
    const data = await res.json();
    if (!data.success || !data.data) {
      showToast('Không tải được danh sách mã.', 'error');
      return;
    }
    const coupon = data.data.find(c => c._id === couponId);
    if (!coupon) {
      showToast('Không tìm thấy mã ưu đãi.', 'error');
      return;
    }

    document.getElementById('edit-coupon-id').value = coupon._id;
    document.getElementById('edit-coupon-code').value = coupon.code;
    document.getElementById('edit-coupon-name').value = coupon.name;
    document.getElementById('edit-coupon-type').value = coupon.discountType;
    document.getElementById('edit-coupon-value').value = coupon.discountValue;
    document.getElementById('edit-coupon-minOrderValue').value = coupon.minOrderValue || 0;
    document.getElementById('edit-coupon-usageLimit').value = coupon.usageLimit || 1;
    
    if (coupon.endDate) {
      document.getElementById('edit-coupon-endDate').value = new Date(coupon.endDate).toISOString().split('T')[0];
    } else {
      document.getElementById('edit-coupon-endDate').value = '';
    }
    
    document.getElementById('edit-coupon-isActive').checked = !!coupon.isActive;

    document.getElementById('edit-coupon-modal').classList.add('show');
  } catch (e) {
    showToast('Lỗi tải mã ưu đãi.', 'error');
  }
};

window.closeEditCouponModal = function() {
  document.getElementById('edit-coupon-modal').classList.remove('show');
};

window.submitEditCouponForm = async function() {
  const couponId = document.getElementById('edit-coupon-id').value;
  const name = document.getElementById('edit-coupon-name').value.trim();
  const discountType = document.getElementById('edit-coupon-type').value;
  const discountValue = document.getElementById('edit-coupon-value').value;
  const minOrderValue = document.getElementById('edit-coupon-minOrderValue').value;
  const usageLimit = document.getElementById('edit-coupon-usageLimit').value;
  const endDate = document.getElementById('edit-coupon-endDate').value;
  const isActive = document.getElementById('edit-coupon-isActive').checked;

  if (!name || !discountValue) {
    showToast('Vui lòng nhập đầy đủ thông tin bắt buộc!', 'error');
    return;
  }

  const couponData = {
    name,
    discountType,
    discountValue: Number(discountValue),
    minOrderValue: Number(minOrderValue),
    usageLimit: Number(usageLimit),
    endDate: endDate || null,
    isActive
  };

  try {
    const res = await fetch(`/api/coupons/${couponId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(couponData)
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Cập nhật mã giảm giá thành công!', 'success');
      closeEditCouponModal();
      fetchAdminCoupons();
    } else {
      showToast(data.message || 'Lỗi cập nhật.', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối.', 'error');
  }
};

// ================= HOMEPAGE SETTINGS PANEL IMPLEMENTATION =================

let selectedFeaturedCarIds = [];

async function loadHomepageSettings() {
  try {
    const res = await fetch('/api/site-settings');
    const data = await res.json();
    if (data.success && data.data) {
      const config = data.data;

      document.getElementById('settings-logo-preview').src = config.logo || '';
      renderSettingsBanners(config.banners || []);

      if (config.contactInfo) {
        document.getElementById('settings-phone').value = config.contactInfo.phone || '';
        document.getElementById('settings-email').value = config.contactInfo.email || '';
        document.getElementById('settings-address').value = config.contactInfo.address || '';
      }
      if (config.bankInfo) {
        document.getElementById('settings-bank-name').value = config.bankInfo.bankName || '';
        document.getElementById('settings-bank-account').value = config.bankInfo.accountNumber || '';
        document.getElementById('settings-bank-holder').value = config.bankInfo.accountHolder || '';
        document.getElementById('settings-qr-preview').src = config.bankInfo.qrCode || '';
      }
      if (config.socialLinks) {
        document.getElementById('settings-zalo').value = config.socialLinks.zalo || '';
        document.getElementById('settings-facebook').value = config.socialLinks.facebook || '';
        document.getElementById('settings-tiktok').value = config.socialLinks.tiktok || '';
        document.getElementById('settings-instagram').value = config.socialLinks.instagram || '';
      }

      selectedFeaturedCarIds = (config.featuredCars || []).map(c => c._id || c);
      renderSelectedFeaturedCars();
    }
  } catch (err) {
    console.error('Failed to load homepage settings:', err.message);
  }
}

function renderSettingsBanners(banners) {
  const container = document.getElementById('settings-banners-list');
  if (!container) return;

  if (!banners || banners.length === 0) {
    container.innerHTML = '<div style="color: var(--color-silver); font-size: 0.85rem;">Chưa có banner nào được thiết lập.</div>';
    return;
  }

  let html = '';
  banners.forEach((b, index) => {
    html += `
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 20px; background: rgba(255,255,255,0.02); border: var(--glass-border); padding: 15px; border-radius: 4px;">
        <div style="display: flex; align-items: center; gap: 15px;">
          <img src="${b.image}" style="width: 100px; height: 55px; object-fit: cover; border-radius: 4px;">
          <div>
            <h5 style="color: var(--color-white); margin-bottom: 5px;">${b.title}</h5>
            <p style="font-size: 0.75rem; color: var(--color-silver);">${b.subtitle || '—'}</p>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 15px;">
          <label style="display: flex; align-items: center; gap: 5px; font-size: 0.75rem; cursor: pointer; color: #ccc;">
            <input type="checkbox" ${b.isActive ? 'checked' : ''} onchange="toggleBannerStatus(${index}, this.checked)" style="accent-color: var(--color-gold);"> Hoạt động
          </label>
          <button type="button" onclick="deleteBanner(${index})" class="action-btn btn-danger-hover" title="Xóa banner"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

window.toggleBannerStatus = async function(index, isActive) {
  try {
    const res = await fetch('/api/site-settings');
    const data = await res.json();
    if (data.success && data.data) {
      const config = data.data;
      config.banners[index].isActive = isActive;
      
      const updateRes = await fetch('/api/site-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (updateRes.ok) {
        showToast('Đã cập nhật trạng thái banner!', 'success');
        loadHomepageSettings();
      }
    }
  } catch (err) {
    showToast('Lỗi cập nhật.', 'error');
  }
};

window.deleteBanner = async function(index) {
  showModal('Xóa Banner', 'Bạn có chắc chắn muốn xóa banner này?', async () => {
    try {
      const res = await fetch('/api/site-settings');
      const data = await res.json();
      if (data.success && data.data) {
        const config = data.data;
        config.banners.splice(index, 1);
        
        const updateRes = await fetch('/api/site-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
        if (updateRes.ok) {
          showToast('Đã xóa banner!', 'success');
          loadHomepageSettings();
        }
      }
    } catch (err) {
      showToast('Lỗi xóa banner.', 'error');
    }
  });
};

function setupHomepageSettingsForms() {
  const logoForm = document.getElementById('settings-logo-form');
  if (logoForm) {
    logoForm.onsubmit = async (e) => {
      e.preventDefault();
      const logoInput = document.getElementById('settings-logo-upload');
      if (!logoInput.files[0]) {
        showToast('Vui lòng chọn file logo!', 'error');
        return;
      }
      
      const formData = new FormData();
      formData.append('logo', logoInput.files[0]);
      
      try {
        const res = await fetch('/api/site-settings/upload-logo', {
          method: 'POST',
          body: formData
        });
        const result = await res.json();
        if (res.ok && result.success) {
          showToast('Lưu logo thành công!', 'success');
          loadHomepageSettings();
        } else {
          showToast(result.message || 'Lưu logo thất bại.', 'error');
        }
      } catch (err) {
        showToast('Lỗi máy chủ.', 'error');
      }
    };
  }

  const bannerForm = document.getElementById('settings-add-banner-form');
  if (bannerForm) {
    bannerForm.onsubmit = async (e) => {
      e.preventDefault();
      const title = document.getElementById('banner-title').value.trim();
      const subtitle = document.getElementById('banner-subtitle').value.trim();
      const link = document.getElementById('banner-link').value.trim();
      const fileInput = document.getElementById('banner-upload');

      if (!title || !fileInput.files[0]) {
        showToast('Vui lòng nhập tiêu đề và chọn ảnh banner!', 'error');
        return;
      }

      const formData = new FormData();
      formData.append('banner', fileInput.files[0]);
      
      try {
        const uploadRes = await fetch('/api/site-settings/upload-banner', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        
        if (uploadRes.ok && uploadData.success) {
          const bannerUrl = uploadData.url;
          
          const settingsRes = await fetch('/api/site-settings');
          const settingsData = await settingsRes.json();
          if (settingsData.success && settingsData.data) {
            const config = settingsData.data;
            if (!config.banners) config.banners = [];
            config.banners.push({ title, subtitle, link, image: bannerUrl, isActive: true });
            
            const updateRes = await fetch('/api/site-settings', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(config)
            });
            
            if (updateRes.ok) {
              showToast('Thêm banner thành công!', 'success');
              bannerForm.reset();
              loadHomepageSettings();
            }
          }
        }
      } catch (err) {
        showToast('Lỗi thêm banner.', 'error');
      }
    };
  }

  const infoForm = document.getElementById('settings-info-form');
  if (infoForm) {
    infoForm.onsubmit = async (e) => {
      e.preventDefault();
      
      const phone = document.getElementById('settings-phone').value.trim();
      const email = document.getElementById('settings-email').value.trim();
      const address = document.getElementById('settings-address').value.trim();
      
      const bankName = document.getElementById('settings-bank-name').value.trim();
      const accountNumber = document.getElementById('settings-bank-account').value.trim();
      const accountHolder = document.getElementById('settings-bank-holder').value.trim();
      
      const zalo = document.getElementById('settings-zalo').value.trim();
      const facebook = document.getElementById('settings-facebook').value.trim();
      const tiktok = document.getElementById('settings-tiktok').value.trim();
      const instagram = document.getElementById('settings-instagram').value.trim();
      
      const qrFile = document.getElementById('settings-qr-upload').files[0];

      let qrCodeUrl = document.getElementById('settings-qr-preview').src || '';
      
      if (qrFile) {
        const qrFormData = new FormData();
        qrFormData.append('qr', qrFile);
        
        try {
          const qrRes = await fetch('/api/site-settings/upload-qr', {
            method: 'POST',
            body: qrFormData
          });
          const qrData = await qrRes.json();
          if (qrRes.ok && qrData.success) {
            qrCodeUrl = qrData.url;
          }
        } catch (err) {
          console.error('Failed to upload QR:', err.message);
        }
      }

      try {
        const settingsRes = await fetch('/api/site-settings');
        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.data) {
          const config = settingsData.data;
          
          config.contactInfo = { phone, email, address };
          config.bankInfo = { bankName, accountNumber, accountHolder, qrCode: qrCodeUrl };
          config.socialLinks = { zalo, facebook, tiktok, instagram };

          const updateRes = await fetch('/api/site-settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
          });
          
          if (updateRes.ok) {
            showToast('Lưu cấu hình thông tin thành công!', 'success');
            loadHomepageSettings();
          } else {
            showToast('Lưu thất bại.', 'error');
          }
        }
      } catch (err) {
        showToast('Lỗi kết nối máy chủ.', 'error');
      }
    };
  }

  const searchBtn = document.getElementById('btn-search-car-featured');
  if (searchBtn) {
    searchBtn.onclick = async () => {
      const q = document.getElementById('settings-car-search').value.trim();
      if (!q) {
        showToast('Vui lòng nhập từ khóa tìm kiếm!', 'error');
        return;
      }
      
      try {
        const res = await fetch(`/api/cars?search=${q}&all=true`);
        const data = await res.json();
        const resultsContainer = document.getElementById('search-cars-results');
        
        if (data.success && data.data) {
          if (data.data.length === 0) {
            resultsContainer.innerHTML = '<div style="color: #ccc; font-size: 0.8rem; text-align: center; padding: 10px;">Không tìm thấy siêu xe nào.</div>';
            return;
          }
          
          let html = '';
          data.data.forEach(c => {
            html += `
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.03); padding-bottom: 5px;">
                <span style="font-size: 0.8rem; color: #fff;">${c.name} (${c.code})</span>
                <button type="button" onclick="selectFeaturedCar('${c._id}', '${c.name.replace(/'/g, "\\'")}', '${c.code}')" class="btn-outline" style="padding: 2px 10px; font-size: 0.7rem; cursor: pointer;">Thêm</button>
              </div>
            `;
          });
          resultsContainer.innerHTML = html;
        }
      } catch (err) {
        showToast('Lỗi tìm kiếm.', 'error');
      }
    };
  }

  const saveFeaturedBtn = document.getElementById('btn-save-featured-cars');
  if (saveFeaturedBtn) {
    saveFeaturedBtn.onclick = async () => {
      try {
        const settingsRes = await fetch('/api/site-settings');
        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.data) {
          const config = settingsData.data;
          config.featuredCars = selectedFeaturedCarIds;
          
          const updateRes = await fetch('/api/site-settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
          });
          
          if (updateRes.ok) {
            showToast('Lưu danh sách xe nổi bật thành công!', 'success');
            loadHomepageSettings();
          } else {
            showToast('Lưu thất bại.', 'error');
          }
        }
      } catch (err) {
        showToast('Lỗi máy chủ.', 'error');
      }
    };
  }
}

window.selectFeaturedCar = function(carId, name, code) {
  if (selectedFeaturedCarIds.includes(carId)) {
    showToast('Xe này đã có trong danh sách nổi bật!', 'warning');
    return;
  }
  if (selectedFeaturedCarIds.length >= 8) {
    showToast('Chỉ chọn tối đa 8 xe nổi bật!', 'warning');
    return;
  }
  
  selectedFeaturedCarIds.push(carId);
  renderSelectedFeaturedCars();
};

window.removeFeaturedCar = function(carId) {
  selectedFeaturedCarIds = selectedFeaturedCarIds.filter(id => id !== carId);
  renderSelectedFeaturedCars();
};

async function renderSelectedFeaturedCars() {
  const container = document.getElementById('featured-selected-cars-list');
  if (!container) return;

  if (selectedFeaturedCarIds.length === 0) {
    container.innerHTML = '<div style="color: var(--color-silver); font-size: 0.8rem;">Chưa chọn xe nào.</div>';
    return;
  }

  let html = '';
  for (const carId of selectedFeaturedCarIds) {
    try {
      const res = await fetch(`/api/cars/${carId}`);
      const data = await res.json();
      if (data.success && data.data) {
        const c = data.data;
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.02); border: var(--glass-border); padding: 8px 15px; border-radius: 4px;">
            <span style="font-size: 0.8rem; color: #fff;">${c.name} (${c.code})</span>
            <button type="button" onclick="removeFeaturedCar('${c._id}')" style="background: none; border: none; color: #d90429; cursor: pointer; font-size: 0.85rem;"><i class="fas fa-trash"></i></button>
          </div>
        `;
      }
    } catch (e) {
      console.error('Failed to fetch selected car info:', carId);
    }
  }
  container.innerHTML = html;
}

// ================= CATEGORIES MANAGEMENT CRUD =================
async function fetchAdminCategories() {
  const tbody = document.getElementById('admin-categories-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Đang tải danh sách danh mục...</td></tr>';

  try {
    const res = await fetch('/api/categories?all=true');
    const data = await res.json();

    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Không có danh mục nào.</td></tr>';
        return;
      }

      let html = '';
      data.data.forEach(cat => {
        let actions = `
          <div class="action-btn-group">
            <button class="action-btn" onclick="openEditCategoryModal('${cat._id}')" title="Sửa"><i class="fas fa-edit"></i></button>
            <button class="action-btn btn-danger-hover" onclick="deleteCategoryItem('${cat._id}')" title="Xóa"><i class="fas fa-trash-alt"></i></button>
          </div>
        `;

        html += `
          <tr>
            <td><strong>${cat.name}</strong></td>
            <td>${cat.slug}</td>
            <td>${cat.description || '—'}</td>
            <td>${cat.sortOrder}</td>
            <td><span class="badge-status ${cat.isActive ? 'completed' : 'cancelled'}">${cat.isActive ? 'Hoạt động' : 'Tạm khóa'}</span></td>
            <td>${actions}</td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #d90429;">Lỗi tải dữ liệu.</td></tr>';
  }
}

function setupCategoryFormSubmit() {
  const form = document.getElementById('admin-create-category-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('category-name-input').value.trim();
    const description = document.getElementById('category-desc-input').value.trim();
    const sortOrder = document.getElementById('category-sort-input').value;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, sortOrder })
      });
      const data = await res.json();

      if (data.success) {
        showToast('Tạo danh mục kiểu dáng thành công!', 'success');
        form.reset();
        fetchAdminCategories();
      } else {
        showToast(data.message || 'Tạo danh mục thất bại.', 'error');
      }
    } catch (err) {
      showToast('Lỗi máy chủ.', 'error');
    }
  });
}

window.openEditCategoryModal = async function(id) {
  try {
    const res = await fetch('/api/categories?all=true');
    const data = await res.json();
    if (data.success) {
      const cat = data.data.find(c => c._id === id);
      if (cat) {
        document.getElementById('edit-category-id').value = cat._id;
        document.getElementById('edit-category-name').value = cat.name;
        document.getElementById('edit-category-slug').value = cat.slug;
        document.getElementById('edit-category-description').value = cat.description || '';
        document.getElementById('edit-category-sort').value = cat.sortOrder || 0;
        document.getElementById('edit-category-isActive').checked = cat.isActive;

        document.getElementById('edit-category-modal').style.display = 'flex';
        
        const nameInput = document.getElementById('edit-category-name');
        const slugInput = document.getElementById('edit-category-slug');
        nameInput.oninput = function() {
          slugInput.value = clientGenerateSlug(this.value);
        };
      }
    }
  } catch (err) {
    showToast('Lỗi lấy thông tin danh mục.', 'error');
  }
};

window.closeEditCategoryModal = function() {
  document.getElementById('edit-category-modal').style.display = 'none';
};

window.submitEditCategoryForm = async function() {
  const id = document.getElementById('edit-category-id').value;
  const name = document.getElementById('edit-category-name').value.trim();
  const description = document.getElementById('edit-category-description').value.trim();
  const sortOrder = document.getElementById('edit-category-sort').value;
  const isActive = document.getElementById('edit-category-isActive').checked;

  try {
    const res = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, sortOrder, isActive })
    });
    const data = await res.json();

    if (data.success) {
      showToast('Cập nhật danh mục thành công!', 'success');
      closeEditCategoryModal();
      fetchAdminCategories();
    } else {
      showToast(data.message || 'Cập nhật thất bại.', 'error');
    }
  } catch (err) {
    showToast('Lỗi máy chủ.', 'error');
  }
};

window.deleteCategoryItem = function(id) {
  if (confirm('Bạn có chắc chắn muốn xóa danh mục này? Các xe liên quan sẽ trở thành chưa phân loại.')) {
    fetch(`/api/categories/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast('Xóa danh mục thành công!', 'success');
          fetchAdminCategories();
        } else {
          showToast(data.message || 'Xóa danh mục thất bại.', 'error');
        }
      })
      .catch(() => showToast('Lỗi máy chủ.', 'error'));
  }
};

function clientGenerateSlug(text) {
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// ================= COLLECTIONS =================
async function fetchAdminCollections() {
  const tbody = document.getElementById('admin-collections-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Đang tải danh sách bộ sưu tập...</td></tr>';

  try {
    const res = await fetch('/api/collections/admin/all');
    const data = await res.json();

    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Không có bộ sưu tập nào.</td></tr>';
        return;
      }

      let html = '';
      data.data.forEach(col => {
        const coverImg = col.image ? `<img src="${col.image}" style="max-height: 50px; border-radius: 4px;">` : '—';
        html += `
          <tr>
            <td><strong>${col.name}</strong></td>
            <td>${col.slug}</td>
            <td>${col.description || '—'}</td>
            <td>${coverImg}</td>
            <td>
              <button class="action-btn btn-danger-hover" onclick="deleteCollectionItem('${col._id}')" title="Xóa"><i class="fas fa-trash-alt"></i></button>
            </td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #d90429;">Lỗi tải dữ liệu.</td></tr>';
  }
}

function setupCollectionFormSubmit() {
  const form = document.getElementById('admin-create-collection-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('collection-name-input').value.trim();
    const description = document.getElementById('collection-desc-input').value.trim();
    const image = document.getElementById('collection-image-url').value.trim();

    try {
      const res = await fetch('/api/collections/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, image })
      });
      const data = await res.json();

      if (data.success) {
        showToast('Tạo bộ sưu tập thành công!', 'success');
        form.reset();
        fetchAdminCollections();
      } else {
        showToast(data.message || 'Tạo bộ sưu tập thất bại.', 'error');
      }
    } catch (err) {
      showToast('Lỗi máy chủ.', 'error');
    }
  });
}

window.deleteCollectionItem = function(id) {
  if (confirm('Bạn có chắc chắn muốn xóa bộ sưu tập này?')) {
    fetch(`/api/collections/admin/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast('Xóa bộ sưu tập thành công!', 'success');
          fetchAdminCollections();
        } else {
          showToast(data.message || 'Xóa thất bại.', 'error');
        }
      })
      .catch(() => showToast('Lỗi máy chủ.', 'error'));
  }
};

// ================= APPOINTMENTS =================
async function fetchAdminAppointments() {
  const tbody = document.getElementById('admin-appointments-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Đang tải danh sách lịch hẹn...</td></tr>';

  try {
    const res = await fetch('/api/appointments');
    const data = await res.json();

    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Không có lịch hẹn nào.</td></tr>';
        return;
      }

      let html = '';
      data.data.forEach(apt => {
        const carName = apt.car ? `${apt.car.name} (${apt.car.code})` : '—';
        const dateStr = new Date(apt.appointmentDate).toLocaleDateString('vi-VN');
        const actions = `
          <div class="action-btn-group">
            <button class="action-btn" onclick="updateAppointmentStatusAdmin('${apt._id}', 'confirmed')" title="Xác nhận"><i class="fas fa-check"></i></button>
            <button class="action-btn" onclick="updateAppointmentStatusAdmin('${apt._id}', 'visited')" title="Khách đã đến"><i class="fas fa-user-check"></i></button>
            <button class="action-btn btn-danger-hover" onclick="updateAppointmentStatusAdmin('${apt._id}', 'cancelled')" title="Hủy lịch"><i class="fas fa-times"></i></button>
          </div>
        `;

        html += `
          <tr>
            <td>${apt.customerInfo.fullName} <br><small>${apt.customerInfo.phone}</small></td>
            <td>${carName}</td>
            <td>${apt.showroom || '—'}</td>
            <td>${dateStr} <br>${apt.appointmentTime}</td>
            <td><span class="badge-status ${apt.status}">${apt.status}</span></td>
            <td><input type="text" id="aptnote-${apt._id}" value="${apt.staffNote || ''}" style="width: 100%; background: #222; border: 1px solid #444; color: #fff; padding: 5px;"></td>
            <td>${actions}</td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #d90429;">Lỗi tải dữ liệu.</td></tr>';
  }
}

window.updateAppointmentStatusAdmin = async function(id, status) {
  const note = document.getElementById(`aptnote-${id}`).value;
  try {
    const res = await fetch(`/api/appointments/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, staffNote: note })
    });
    if (res.ok) {
      showToast('Đã cập nhật trạng thái lịch hẹn!', 'success');
      fetchAdminAppointments();
    } else {
      showToast('Cập nhật thất bại.', 'error');
    }
  } catch (e) {
    showToast('Lỗi máy chủ.', 'error');
  }
};

// ================= TEST DRIVES =================
async function fetchAdminTestDrives() {
  const tbody = document.getElementById('admin-testdrives-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Đang tải danh sách lịch lái thử...</td></tr>';

  try {
    const res = await fetch('/api/test-drives');
    const data = await res.json();

    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Không có lịch lái thử nào.</td></tr>';
        return;
      }

      let html = '';
      data.data.forEach(td => {
        const carName = td.car ? `${td.car.name} (${td.car.code})` : '—';
        const dateStr = new Date(td.testDriveDate).toLocaleDateString('vi-VN');
        const licenseLink = td.licenseImage ? `<a href="${td.licenseImage}" target="_blank" style="color: var(--color-gold); text-decoration: underline;">Xem ảnh GPLX</a>` : '—';
        const actions = `
          <div class="action-btn-group">
            <button class="action-btn" onclick="updateTestDriveStatusAdmin('${td._id}', 'confirmed')" title="Xác nhận"><i class="fas fa-check"></i></button>
            <button class="action-btn" onclick="updateTestDriveStatusAdmin('${td._id}', 'completed')" title="Hoàn thành"><i class="fas fa-check-double"></i></button>
            <button class="action-btn btn-danger-hover" onclick="updateTestDriveStatusAdmin('${td._id}', 'cancelled')" title="Hủy lái thử"><i class="fas fa-times"></i></button>
          </div>
        `;

        html += `
          <tr>
            <td>${td.customerInfo.fullName} <br><small>${td.customerInfo.phone}</small></td>
            <td>${carName}</td>
            <td>${td.showroom || '—'}</td>
            <td>${dateStr} <br>${td.testDriveTime}</td>
            <td>${licenseLink}</td>
            <td><span class="badge-status ${td.status}">${td.status}</span></td>
            <td><input type="text" id="tdnote-${td._id}" value="${td.staffNote || ''}" style="width: 100%; background: #222; border: 1px solid #444; color: #fff; padding: 5px;"></td>
            <td>${actions}</td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #d90429;">Lỗi tải dữ liệu.</td></tr>';
  }
}

window.updateTestDriveStatusAdmin = async function(id, status) {
  const note = document.getElementById(`tdnote-${id}`).value;
  try {
    const res = await fetch(`/api/test-drives/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, staffNote: note })
    });
    if (res.ok) {
      showToast('Đã cập nhật trạng thái lái thử!', 'success');
      fetchAdminTestDrives();
    } else {
      showToast('Cập nhật thất bại.', 'error');
    }
  } catch (e) {
    showToast('Lỗi máy chủ.', 'error');
  }
};

// ================= DEPOSITS =================
async function fetchAdminDeposits() {
  const tbody = document.getElementById('admin-deposits-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Đang tải danh sách giao dịch đặt cọc...</td></tr>';

  try {
    const res = await fetch('/api/deposits');
    const data = await res.json();

    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Không có giao dịch đặt cọc nào.</td></tr>';
        return;
      }

      let html = '';
      data.data.forEach(dep => {
        const carName = dep.car ? `${dep.car.name} (${dep.car.code})` : '—';
        const proofLink = dep.paymentProof ? `<a href="${dep.paymentProof}" target="_blank"><img src="${dep.paymentProof}" style="max-height: 45px; border-radius: 4px; cursor: pointer; border: 1px solid #444;"></a>` : '—';
        
        let actions = '';
        if (dep.status === 'pending_confirm') {
          actions += `
            <button class="action-btn" onclick="confirmDepositAdmin('${dep._id}')" title="Duyệt nhận cọc" style="background: rgba(85, 166, 48, 0.1); border-color: rgba(85, 166, 48, 0.3); color: #55a630;"><i class="fas fa-check-circle"></i></button>
            <button class="action-btn btn-danger-hover" onclick="cancelDepositAdmin('${dep._id}')" title="Từ chối/Hủy"><i class="fas fa-times-circle"></i></button>
          `;
        } else if (dep.status === 'confirmed') {
          actions += `
            <button class="action-btn" onclick="convertDepositToOrderAdmin('${dep._id}')" title="Tạo Hợp Đồng Hóa Đơn" style="background: rgba(222, 193, 113, 0.1); border-color: rgba(222, 193, 113, 0.3); color: var(--color-gold); width: auto; padding: 0 10px; display: flex; align-items: center; gap: 4px; font-size: 0.75rem;"><i class="fas fa-file-contract"></i> Lên Hợp Đồng</button>
          `;
        } else {
          actions = '—';
        }

        html += `
          <tr>
            <td><strong>${dep.depositCode}</strong></td>
            <td>${dep.customerInfo.fullName} <br><small>${dep.customerInfo.phone}</small></td>
            <td>${carName}</td>
            <td>${formatCurrencyVND(dep.depositAmount)}</td>
            <td style="text-align: center;">${proofLink}</td>
            <td><span class="badge-status ${dep.status}">${dep.status}</span></td>
            <td><input type="text" id="depnote-${dep._id}" value="${dep.staffNote || ''}" style="width: 100%; background: #222; border: 1px solid #444; color: #fff; padding: 5px;"></td>
            <td><div style="display: flex; gap: 8px; justify-content: center;">${actions}</div></td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #d90429;">Lỗi tải dữ liệu.</td></tr>';
  }
}

window.confirmDepositAdmin = async function(id) {
  const note = document.getElementById(`depnote-${id}`).value;
  try {
    const res = await fetch(`/api/deposits/${id}/confirm`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffNote: note })
    });
    if (res.ok) {
      showToast('Đã duyệt nhận cọc thành công!', 'success');
      fetchAdminDeposits();
    } else {
      showToast('Duyệt nhận cọc thất bại.', 'error');
    }
  } catch (e) {
    showToast('Lỗi máy chủ.', 'error');
  }
};

window.cancelDepositAdmin = async function(id) {
  const note = document.getElementById(`depnote-${id}`).value;
  try {
    const res = await fetch(`/api/deposits/${id}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staffNote: note })
    });
    if (res.ok) {
      showToast('Đã hủy giao dịch cọc!', 'success');
      fetchAdminDeposits();
    } else {
      showToast('Hủy cọc thất bại.', 'error');
    }
  } catch (e) {
    showToast('Lỗi máy chủ.', 'error');
  }
};

window.convertDepositToOrderAdmin = async function(id) {
  try {
    const res = await fetch(`/api/deposits/${id}/convert-to-order`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      showToast('Tạo hợp đồng hóa đơn thành công! Hãy kiểm tra tab Đơn Hàng.', 'success');
      fetchAdminDeposits();
    } else {
      showToast(data.message || 'Tạo hợp đồng thất bại.', 'error');
    }
  } catch (e) {
    showToast('Lỗi máy chủ.', 'error');
  }
};

// ================= ORDERS =================
async function fetchAdminOrders() {
  const tbody = document.getElementById('admin-orders-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Đang tải danh sách đơn hàng...</td></tr>';

  try {
    const res = await fetch('/api/orders');
    const data = await res.json();

    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Không có hợp đồng đơn hàng nào.</td></tr>';
        return;
      }

      let html = '';
      data.data.forEach(ord => {
        const carName = ord.carInfo ? `${ord.carInfo.name}` : '—';
        
        let actions = '';
        if (ord.orderStatus === 'waiting_full_payment') {
          actions += `<button class="action-btn" onclick="confirmOrderPaymentAdmin('${ord._id}')" title="Xác nhận đủ tiền" style="background: rgba(85, 166, 48, 0.1); border-color: rgba(85, 166, 48, 0.3); color: #55a630;"><i class="fas fa-check-double"></i></button>`;
        } else if (ord.orderStatus === 'paid' || ord.orderStatus === 'delivering' || ord.orderStatus === 'processing_paperwork') {
          actions += `<button class="action-btn" onclick="completeVehicleHandoverAdmin('${ord._id}')" title="Bàn giao xe" style="background: rgba(222, 193, 113, 0.1); border-color: rgba(222, 193, 113, 0.3); color: var(--color-gold);"><i class="fas fa-truck-loading"></i> Bàn Giao</button>`;
        }
        
        if (ord.orderStatus !== 'completed' && ord.orderStatus !== 'cancelled') {
          actions += `<button class="action-btn btn-danger-hover" onclick="cancelOrderItemAdmin('${ord._id}')" title="Hủy Hợp Đồng"><i class="fas fa-ban"></i></button>`;
        }

        if (!actions) actions = '—';

        html += `
          <tr>
            <td><strong>${ord.orderCode}</strong></td>
            <td>${ord.customerInfo.fullName} <br><small>${ord.customerInfo.phone}</small></td>
            <td>${carName}</td>
            <td>${formatCurrencyVND(ord.total)}</td>
            <td>${formatCurrencyVND(ord.remainingAmount)}</td>
            <td><span class="badge-status ${ord.paymentStatus}">${ord.paymentStatus}</span></td>
            <td><span class="badge-status ${ord.orderStatus}">${ord.orderStatus}</span></td>
            <td><div style="display: flex; gap: 8px;">${actions}</div></td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #d90429;">Lỗi tải dữ liệu.</td></tr>';
  }
}

window.confirmOrderPaymentAdmin = async function(id) {
  if (confirm('Xác nhận khách hàng đã thanh toán đầy đủ 100% giá trị hợp đồng này?')) {
    try {
      const res = await fetch(`/api/orders/${id}/confirm-payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        showToast('Xác nhận thanh toán thành công!', 'success');
        fetchAdminOrders();
      } else {
        showToast('Xác nhận thất bại.', 'error');
      }
    } catch (e) {
      showToast('Lỗi máy chủ.', 'error');
    }
  }
};

window.completeVehicleHandoverAdmin = async function(id) {
  if (confirm('Xác nhận đã bàn giao xe thành công và hoàn tất các thủ tục giấy tờ?')) {
    try {
      const res = await fetch(`/api/orders/${id}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        showToast('Hợp đồng đã hoàn thành, bàn giao xe thành công!', 'success');
        fetchAdminOrders();
      } else {
        showToast('Cập nhật thất bại.', 'error');
      }
    } catch (e) {
      showToast('Lỗi máy chủ.', 'error');
    }
  }
};

window.cancelOrderItemAdmin = async function(id) {
  if (confirm('Bạn có chắc chắn muốn hủy hợp đồng mua bán siêu xe này? Hành động này sẽ hoàn trả trạng thái của xe.')) {
    try {
      const res = await fetch(`/api/orders/${id}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        showToast('Đã hủy hợp đồng thành công!', 'success');
        fetchAdminOrders();
      } else {
        showToast('Hủy hợp đồng thất bại.', 'error');
      }
    } catch (e) {
      showToast('Lỗi máy chủ.', 'error');
    }
  }
};

// ================= REVIEWS =================
async function fetchAdminReviews() {
  const tbody = document.getElementById('admin-reviews-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Đang tải danh sách đánh giá...</td></tr>';

  try {
    const res = await fetch('/api/reviews');
    const data = await res.json();

    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Không có đánh giá nào từ khách hàng.</td></tr>';
        return;
      }

      let html = '';
      data.data.forEach(rev => {
        const customerName = rev.user ? rev.user.fullName : 'Khách ẩn danh';
        const carName = rev.car ? `${rev.car.name} (${rev.car.code})` : 'Showroom / Nhân viên';
        const stars = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);
        
        let visibilityBtn = '';
        if (rev.isVisible) {
          visibilityBtn = `<button class="action-btn" onclick="toggleReviewVisibility('${rev._id}', false)" title="Ẩn hiển thị" style="color: #55a630;"><i class="fas fa-eye"></i></button>`;
        } else {
          visibilityBtn = `<button class="action-btn" onclick="toggleReviewVisibility('${rev._id}', true)" title="Hiện hiển thị" style="color: #666;"><i class="fas fa-eye-slash"></i></button>`;
        }

        const replyContent = rev.replyComment ? `<div style="font-size: 0.75rem; color: var(--color-gold); margin-top: 5px;"><strong>Trả lời:</strong> ${rev.replyComment} <br><small>Bởi ${rev.repliedBy ? rev.repliedBy.fullName : 'Showroom'}</small></div>` : '—';

        html += `
          <tr>
            <td><strong>${customerName}</strong></td>
            <td>${carName}</td>
            <td style="color: var(--color-gold); font-size: 1.1rem; white-space: nowrap;">${stars}</td>
            <td>${rev.comment}</td>
            <td style="text-align: center;">${rev.isVisible ? 'Hiển thị' : 'Ẩn'}</td>
            <td>${replyContent}</td>
            <td>
              <div class="action-btn-group">
                ${visibilityBtn}
                <button class="action-btn" onclick="openReplyReviewModal('${rev._id}')" title="Phản hồi"><i class="fas fa-reply"></i></button>
                <button class="action-btn btn-danger-hover" onclick="deleteReviewItem('${rev._id}')" title="Xóa đánh giá"><i class="fas fa-trash-alt"></i></button>
              </div>
            </td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #d90429;">Lỗi tải dữ liệu.</td></tr>';
  }
}

window.toggleReviewVisibility = async function(id, isVisible) {
  try {
    const res = await fetch(`/api/reviews/${id}/visibility`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isVisible })
    });
    if (res.ok) {
      showToast('Đã cập nhật trạng thái hiển thị đánh giá!', 'success');
      fetchAdminReviews();
    } else {
      showToast('Cập nhật thất bại.', 'error');
    }
  } catch (e) {
    showToast('Lỗi máy chủ.', 'error');
  }
};

window.deleteReviewItem = function(id) {
  if (confirm('Bạn có chắc chắn muốn xóa đánh giá này khỏi hệ thống?')) {
    fetch(`/api/reviews/${id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showToast('Xóa đánh giá thành công!', 'success');
          fetchAdminReviews();
        } else {
          showToast(data.message || 'Xóa đánh giá thất bại.', 'error');
        }
      })
      .catch(() => showToast('Lỗi máy chủ.', 'error'));
  }
};

window.openReplyReviewModal = async function(id) {
  try {
    const res = await fetch('/api/reviews');
    const data = await res.json();
    if (data.success) {
      const rev = data.data.find(r => r._id === id);
      if (rev) {
        document.getElementById('reply-review-id').value = rev._id;
        document.getElementById('reply-review-customer-comment').textContent = `"${rev.comment}"`;
        document.getElementById('reply-review-comment-input').value = rev.replyComment || '';
        document.getElementById('reply-review-modal').style.display = 'flex';
      }
    }
  } catch (err) {
    showToast('Lỗi lấy thông tin đánh giá.', 'error');
  }
};

window.closeReplyReviewModal = function() {
  document.getElementById('reply-review-modal').style.display = 'none';
};

window.submitReplyReviewForm = async function() {
  const id = document.getElementById('reply-review-id').value;
  const replyComment = document.getElementById('reply-review-comment-input').value.trim();

  if (!replyComment) {
    showToast('Vui lòng nhập nội dung phản hồi.', 'error');
    return;
  }

  try {
    const res = await fetch(`/api/reviews/${id}/reply`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ replyComment })
    });
    const data = await res.json();

    if (data.success) {
      showToast('Đã gửi phản hồi đánh giá thành công!', 'success');
      closeReplyReviewModal();
      fetchAdminReviews();
    } else {
      showToast(data.message || 'Gửi phản hồi thất bại.', 'error');
    }
  } catch (err) {
    showToast('Lỗi máy chủ.', 'error');
  }
};

// ================= CONTACTS & CSKH MESSENGER =================
let currentMessengerStream = 'support';
let activeThreadId = null;
let allContactsData = [];
let messengerEventsBound = false;

window.switchMessengerStream = function(streamType) {
  currentMessengerStream = streamType;
  
  const btnCSKH = document.getElementById('btn-stream-cskh');
  const btnContact = document.getElementById('btn-stream-contact');
  
  if (btnCSKH && btnContact) {
    if (streamType === 'support') {
      btnCSKH.classList.add('active');
      btnContact.classList.remove('active');
    } else {
      btnCSKH.classList.remove('active');
      btnContact.classList.add('active');
    }
  }
  
  activeThreadId = null;
  const activeContainer = document.getElementById('chat-active-container');
  const noThreadContainer = document.getElementById('chat-no-thread');
  if (activeContainer) activeContainer.style.display = 'none';
  if (noThreadContainer) noThreadContainer.style.display = 'flex';
  
  renderMessengerThreads();
};

async function fetchAdminContacts(silent = false) {
  const threadsList = document.getElementById('messenger-threads-list');
  if (!threadsList) return;
  
  if (!silent && allContactsData.length === 0) {
    threadsList.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">Đang tải hội thoại...</div>';
  }

  try {
    const res = await fetch('/api/contact-message');
    const data = await res.json();

    if (data.success) {
      allContactsData = data.data;
      renderMessengerThreads();
      
      if (activeThreadId) {
        const activeThread = allContactsData.find(t => t._id === activeThreadId);
        if (activeThread) {
          renderActiveThreadDetails(activeThread);
        }
      }
    }
  } catch (err) {
    console.error('Lỗi tải tin nhắn:', err);
    if (!silent) {
      threadsList.innerHTML = '<div style="text-align: center; color: #d90429; padding: 20px;">Lỗi tải dữ liệu.</div>';
    }
  }
}

function renderMessengerThreads() {
  const threadsList = document.getElementById('messenger-threads-list');
  if (!threadsList) return;

  const filteredThreads = allContactsData.filter(t => {
    if (currentMessengerStream === 'support') {
      return t.type === 'support';
    } else {
      return t.type !== 'support';
    }
  });

  if (filteredThreads.length === 0) {
    threadsList.innerHTML = `<div style="text-align: center; color: #555; padding: 30px; font-size: 0.85rem;">Không có cuộc hội thoại nào.</div>`;
    return;
  }

  let html = '';
  filteredThreads.forEach(t => {
    const isActive = t._id === activeThreadId ? 'active' : '';
    const lastMsg = t.messages && t.messages.length > 0 ? t.messages[t.messages.length - 1].content : t.message;
    const timeStr = new Date(t.updatedAt || t.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const isNew = t.status === 'new' ? '<span class="thread-status-dot new"></span>' : '';
    
    html += `
      <div class="thread-item ${isActive}" onclick="selectMessengerThread('${t._id}')">
        <div class="thread-item-header">
          <span class="thread-name">${escapeHtml(t.fullName)}</span>
          <span class="thread-time">${timeStr}</span>
        </div>
        <div class="thread-preview">${escapeHtml(lastMsg)}</div>
        ${isNew}
      </div>
    `;
  });
  threadsList.innerHTML = html;
}

window.selectMessengerThread = function(threadId) {
  activeThreadId = threadId;
  
  const items = document.querySelectorAll('.thread-item');
  items.forEach(el => el.classList.remove('active'));
  
  const thread = allContactsData.find(t => t._id === threadId);
  if (!thread) return;
  
  renderMessengerThreads();

  const noThread = document.getElementById('chat-no-thread');
  const activeContainer = document.getElementById('chat-active-container');
  if (noThread) noThread.style.display = 'none';
  if (activeContainer) activeContainer.style.display = 'flex';

  document.getElementById('chat-header-name').textContent = thread.fullName;
  document.getElementById('chat-header-meta').textContent = `Email: ${thread.email} | SĐT: ${thread.phone || '—'}`;
  
  document.getElementById('chat-status-select').value = thread.status;
  document.getElementById('chat-staff-note').value = thread.staffNote || '';

  const carInfo = document.getElementById('chat-car-info');
  const carName = document.getElementById('chat-car-name');
  if (thread.relatedCar) {
    carInfo.style.display = 'block';
    carName.textContent = `${thread.relatedCar.name} (${thread.relatedCar.code})`;
  } else {
    carInfo.style.display = 'none';
  }

  renderActiveThreadDetails(thread);
  setupMessengerEventsOnce();
};

function renderActiveThreadDetails(thread) {
  const container = document.getElementById('chat-messages-container');
  const inputContainer = document.getElementById('chat-input-container');
  const contactContainer = document.getElementById('contact-view-container');

  if (currentMessengerStream === 'support') {
    if (inputContainer) inputContainer.style.display = 'flex';
    if (contactContainer) contactContainer.style.display = 'none';
    
    let messagesHtml = '';
    const messages = thread.messages || [];
    
    if (messages.length === 0) {
      messagesHtml = '<p style="text-align: center; color: #555; font-size: 0.8rem; margin-top: 30px;">Chưa có tin nhắn nào trong phòng chat.</p>';
    } else {
      messages.forEach(msg => {
        const isIncoming = msg.sender === 'user';
        const senderLabel = isIncoming ? msg.senderName : `${msg.senderName} (${msg.sender === 'admin' ? 'Admin' : 'Staff'})`;
        const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messagesHtml += `
          <div class="chat-message ${isIncoming ? 'incoming' : 'outgoing'}">
            <span class="chat-message-sender">${escapeHtml(senderLabel)}</span>
            <span>${escapeHtml(msg.content)}</span>
            <span class="chat-message-time">${timeStr}</span>
          </div>
        `;
      });
    }
    container.innerHTML = messagesHtml;
    container.scrollTop = container.scrollHeight;
  } else {
    if (inputContainer) inputContainer.style.display = 'none';
    if (contactContainer) contactContainer.style.display = 'flex';
    
    document.getElementById('contact-subject').textContent = thread.subject || 'Liên Hệ & Tư Vấn';
    document.getElementById('contact-initial-message').textContent = thread.message;

    const timeStr = new Date(thread.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    container.innerHTML = `
      <div class="chat-message incoming" style="max-width: 90%;">
        <span class="chat-message-sender">${escapeHtml(thread.fullName)}</span>
        <div style="font-weight: 600; margin-bottom: 5px; color: var(--color-gold);">${escapeHtml(thread.subject || 'Chủ đề: —')}</div>
        <div>${escapeHtml(thread.message)}</div>
        <span class="chat-message-time">${timeStr}</span>
      </div>
    `;
  }
}

function setupMessengerEventsOnce() {
  if (messengerEventsBound) return;
  messengerEventsBound = true;

  const saveStatusBtn = document.getElementById('btn-save-chat-status');
  if (saveStatusBtn) {
    saveStatusBtn.addEventListener('click', async () => {
      if (!activeThreadId) return;
      const status = document.getElementById('chat-status-select').value;
      const note = document.getElementById('chat-staff-note').value;
      try {
        const res = await fetch(`/api/contact-message/${activeThreadId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, staffNote: note })
        });
        if (res.ok) {
          showToast('Đã lưu trạng thái cuộc trò chuyện!', 'success');
          fetchAdminContacts(true);
        } else {
          showToast('Cập nhật thất bại.', 'error');
        }
      } catch (err) {
        showToast('Lỗi kết nối máy chủ.', 'error');
      }
    });
  }

  const saveNoteBtn = document.getElementById('btn-save-staff-note');
  if (saveNoteBtn) {
    saveNoteBtn.addEventListener('click', async () => {
      if (!activeThreadId) return;
      const status = document.getElementById('chat-status-select').value;
      const note = document.getElementById('chat-staff-note').value;
      try {
        const res = await fetch(`/api/contact-message/${activeThreadId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, staffNote: note })
        });
        if (res.ok) {
          showToast('Đã lưu ghi chú nội bộ!', 'success');
          fetchAdminContacts(true);
        } else {
          showToast('Cập nhật ghi chú thất bại.', 'error');
        }
      } catch (err) {
        showToast('Lỗi kết nối máy chủ.', 'error');
      }
    });
  }

  const sendReplyBtn = document.getElementById('btn-send-chat-reply');
  const chatInput = document.getElementById('chat-input-message');
  
  const submitReply = async () => {
    if (!activeThreadId) return;
    const text = chatInput.value.trim();
    if (!text) return;
    
    chatInput.value = '';
    try {
      const res = await fetch(`/api/contact-message/thread/${activeThreadId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      if (data.success) {
        await fetchAdminContacts(true);
      } else {
        showToast(data.message || 'Lỗi gửi tin nhắn.', 'error');
      }
    } catch (err) {
      showToast('Lỗi gửi tin nhắn.', 'error');
    }
  };

  if (sendReplyBtn) sendReplyBtn.addEventListener('click', submitReply);
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        submitReply();
      }
    });
  }
}

function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
