document.addEventListener('DOMContentLoaded', () => {
  // Render sidebar dynamically
  if (typeof renderSidebar === 'function') {
    renderSidebar();
  }

  // Check auth and role
  verifyUserAccess();

  // Tab navigation
  setupTabNavigation();

  // Forms submit
  const profileForm = document.getElementById('user-profile-form');
  const passwordForm = document.getElementById('user-password-form');
  
  if (profileForm) {
    profileForm.addEventListener('submit', handleProfileUpdate);
  }
  if (passwordForm) {
    passwordForm.addEventListener('submit', handlePasswordUpdate);
  }

  // Load data for initial active tab
  loadDashboardData();
});

async function verifyUserAccess() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (!data.success || !data.user) {
      window.location.href = '/views/login.html';
      return;
    }
    
    // Set user global profile fields
    const sidebarName = document.getElementById('user-sidebar-name');
    const sidebarRole = document.getElementById('user-sidebar-role');
    const avatarChar = document.getElementById('user-avatar-char');
    
    if (sidebarName) sidebarName.textContent = data.user.fullName;
    if (sidebarRole) sidebarRole.textContent = data.user.role === 'admin' ? 'Quản Trị Viên' : (data.user.role === 'staff' ? 'Nhân Viên' : 'Khách Hàng');
    if (avatarChar) avatarChar.textContent = data.user.fullName.charAt(0).toUpperCase();

    // Fill form
    document.getElementById('fullName').value = data.user.fullName;
    document.getElementById('email').value = data.user.email;
    document.getElementById('phone').value = data.user.phone || '';
    document.getElementById('address').value = data.user.address || '';
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

      // Update sidebar menu item active class
      menuItems.forEach(mi => mi.classList.remove('active'));
      item.classList.add('active');

      // Update tab active class
      tabs.forEach(tab => {
        if (tab.id === targetTabId) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });

      // Load specific tab data
      loadTabContent(targetTabId);
    });
  });
}

function loadDashboardData() {
  const urlParams = new URLSearchParams(window.location.search);
  const activeTab = urlParams.get('tab') || 'tab-profile';
  
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

  loadTabContent(activeTab);
}

function loadTabContent(tabId) {
  if (tabId === 'tab-overview') {
    fetchUserOverviewStats();
  } else if (tabId === 'tab-appointments') {
    fetchMyAppointments();
  } else if (tabId === 'tab-test-drives') {
    fetchMyTestDrives();
  } else if (tabId === 'tab-deposits') {
    fetchMyDeposits();
  } else if (tabId === 'tab-orders') {
    fetchMyOrders();
  } else if (tabId === 'tab-wishlist') {
    fetchMyWishlist();
  }
}

async function fetchUserOverviewStats() {
  try {
    const ordersRes = await fetch('/api/orders/my-orders');
    const ordersData = await ordersRes.json();
    const aptsRes = await fetch('/api/appointments/my-appointments');
    const aptsData = await aptsRes.json();
    const tdRes = await fetch('/api/test-drives/my-test-drives');
    const tdData = await tdRes.json();
    
    if (ordersData.success) document.getElementById('user-stat-orders').textContent = ordersData.data.length;
    if (aptsData.success) document.getElementById('user-stat-appointments').textContent = aptsData.data.length;
    if (tdData.success) document.getElementById('user-stat-testdrives').textContent = tdData.data.length;
    document.getElementById('user-stat-wishlist').textContent = getWishlist().length;
  } catch (e) {
    console.error('Failed to load user stats:', e.message);
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  const fullName = document.getElementById('fullName').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const address = document.getElementById('address').value.trim();

  try {
    const res = await fetch('/api/auth/update-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, phone, address })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Cập nhật thông tin cá nhân thành công!', 'success');
      document.getElementById('user-sidebar-name').textContent = data.user.fullName;
    } else {
      showToast(data.message || 'Cập nhật thất bại.', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối máy chủ.', 'error');
  }
}

async function handlePasswordUpdate(e) {
  e.preventDefault();
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmNewPassword = document.getElementById('confirmNewPassword').value;

  if (newPassword !== confirmNewPassword) {
    showToast('Mật khẩu mới nhập lại không khớp!', 'error');
    return;
  }

  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Đổi mật khẩu thành công!', 'success');
      document.getElementById('user-password-form').reset();
    } else {
      showToast(data.message || 'Thay đổi mật khẩu thất bại.', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối máy chủ.', 'error');
  }
}

async function fetchMyAppointments() {
  const tbody = document.getElementById('appointments-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Đang tải danh sách lịch hẹn...</td></tr>';

  try {
    const res = await fetch('/api/appointments/my-appointments');
    const data = await res.json();
    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Bạn chưa đăng ký lịch hẹn xem xe nào.</td></tr>';
        return;
      }

      let html = '';
      data.data.forEach(apt => {
        const carName = apt.car ? apt.car.name : 'Tư vấn chung';
        const dateStr = new Date(apt.appointmentDate).toLocaleDateString('vi-VN');
        const staffName = apt.assignedStaff ? apt.assignedStaff.fullName : 'Chờ gán nhân viên';
        
        let statusBadge = `<span class="badge-status ${apt.status}">${apt.status === 'pending' ? 'Chờ duyệt' : apt.status}</span>`;

        html += `
          <tr>
            <td>${apt.customerInfo.fullName}</td>
            <td>${carName}</td>
            <td>${apt.showroom}</td>
            <td>${dateStr} lúc ${apt.appointmentTime}</td>
            <td>${staffName}</td>
            <td>${statusBadge}</td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #d90429;">Lỗi tải dữ liệu.</td></tr>';
  }
}

async function fetchMyTestDrives() {
  const tbody = document.getElementById('testdrives-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Đang tải danh sách lịch lái thử...</td></tr>';

  try {
    const res = await fetch('/api/test-drives/my-test-drives');
    const data = await res.json();
    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Bạn chưa đăng ký lái thử xe nào.</td></tr>';
        return;
      }

      let html = '';
      data.data.forEach(td => {
        const carName = td.car ? td.car.name : 'Đang tải';
        const dateStr = new Date(td.testDriveDate).toLocaleDateString('vi-VN');
        const staffName = td.assignedStaff ? td.assignedStaff.fullName : 'Chờ sắp xếp';
        
        let statusBadge = `<span class="badge-status ${td.status}">${td.status === 'pending' ? 'Chờ duyệt' : td.status}</span>`;

        html += `
          <tr>
            <td>${carName}</td>
            <td>${td.showroom}</td>
            <td>${dateStr} lúc ${td.testDriveTime}</td>
            <td>${td.drivingExperience}</td>
            <td>${staffName}</td>
            <td>${statusBadge}</td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #d90429;">Lỗi tải dữ liệu.</td></tr>';
  }
}

async function fetchMyDeposits() {
  const tbody = document.getElementById('deposits-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Đang tải hóa đơn đặt cọc...</td></tr>';

  try {
    const res = await fetch('/api/deposits/my-deposits');
    const data = await res.json();
    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Bạn chưa thực hiện giao dịch đặt cọc nào.</td></tr>';
        return;
      }

      let html = '';
      data.data.forEach(dep => {
        const carName = dep.car ? dep.car.name : 'Đang tải';
        const amount = formatCurrencyVND(dep.depositAmount);
        const expDate = dep.expiredAt ? new Date(dep.expiredAt).toLocaleDateString('vi-VN') : '—';
        
        let uploadProofAction = '';
        if (dep.status === 'pending_payment') {
          uploadProofAction = `
            <input type="file" id="proof-${dep._id}" style="display: none;" onchange="uploadDepositProof('${dep._id}')">
            <button class="btn-gold" onclick="document.getElementById('proof-${dep._id}').click()" style="padding: 5px 10px; font-size: 0.75rem;">Gửi biên lai</button>
          `;
        } else if (dep.paymentProof) {
          uploadProofAction = `<a href="${dep.paymentProof}" target="_blank" style="color: var(--color-gold); font-size: 0.8rem;">Xem biên lai</a>`;
        } else {
          uploadProofAction = '—';
        }

        let statusBadge = `<span class="badge-status ${dep.status}">${dep.status === 'pending_payment' ? 'Chờ chuyển khoản' : (dep.status === 'pending_confirm' ? 'Chờ xác nhận' : dep.status)}</span>`;

        html += `
          <tr>
            <td>${dep.depositCode}</td>
            <td>${carName}</td>
            <td>${amount}</td>
            <td>${expDate}</td>
            <td>${statusBadge}</td>
            <td>${uploadProofAction}</td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #d90429;">Lỗi tải dữ liệu.</td></tr>';
  }
}

// Client upload receipt helper
window.uploadDepositProof = async function(depositId) {
  const fileInput = document.getElementById(`proof-${depositId}`);
  if (!fileInput || !fileInput.files[0]) return;

  const formData = new FormData();
  formData.append('paymentProof', fileInput.files[0]);

  try {
    const res = await fetch(`/api/deposits/${depositId}/payment-proof`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showToast('Đã tải lên minh chứng chuyển khoản. Vui lòng chờ nhân viên xác nhận!', 'success');
      fetchMyDeposits();
    } else {
      showToast(data.message || 'Tải lên thất bại.', 'error');
    }
  } catch (err) {
    showToast('Lỗi máy chủ khi tải lên.', 'error');
  }
};

async function fetchMyOrders() {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Đang tải danh sách đơn hàng...</td></tr>';

  try {
    const res = await fetch('/api/orders/my-orders');
    const data = await res.json();
    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Bạn chưa có đơn mua xe nào được lập.</td></tr>';
        return;
      }

      let html = '';
      data.data.forEach(order => {
        const carName = order.carInfo ? order.carInfo.name : (order.car ? order.car.name : 'Đang tải');
        const total = formatCurrencyVND(order.total);
        const remaining = formatCurrencyVND(order.remainingAmount);
        
        let paymentBadge = `<span class="badge-status ${order.paymentStatus}">${order.paymentStatus === 'unpaid' ? 'Chưa thanh toán' : (order.paymentStatus === 'deposit_paid' ? 'Đã cọc giữ' : 'Đã thanh toán đủ')}</span>`;
        let orderBadge = `<span class="badge-status ${order.orderStatus}">${order.orderStatus}</span>`;

        html += `
          <tr>
            <td>${order.orderCode}</td>
            <td>${carName}</td>
            <td>${total}</td>
            <td>${remaining}</td>
            <td>${paymentBadge}</td>
            <td>${orderBadge}</td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #d90429;">Lỗi tải dữ liệu.</td></tr>';
  }
}

// Render local wishlist items in dashboard
async function fetchMyWishlist() {
  const wishlistContainer = document.getElementById('wishlist-cars-grid');
  if (!wishlistContainer) return;
  
  const wishlistIds = getWishlist();
  if (wishlistIds.length === 0) {
    wishlistContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--color-silver);">Bạn chưa lưu chiếc xe nào vào danh mục yêu thích.</div>';
    return;
  }

  wishlistContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 20px;">Đang tải danh mục yêu thích...</div>';

  try {
    let html = '';
    // Load each car manually (max 10)
    for (const carId of wishlistIds) {
      try {
        const res = await fetch(`/api/cars/${carId}`);
        const data = await res.json();
        
        if (data.success && data.data) {
          const car = data.data;
          const carImg = car.images[0] || 'https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?auto=format&fit=crop&w=400&q=80';
          
          let statusBadge = '';
          if (car.status === 'reserved') {
            statusBadge = '<span class="car-badge reserved">Đã đặt cọc</span>';
          } else if (car.status === 'sold') {
            statusBadge = '<span class="car-badge sold">Đã bán</span>';
          }

          html += `
            <a href="/views/car-detail.html?slug=${car.slug}" class="car-card" id="wishlist-card-${car._id}" style="display: block; text-decoration: none; color: inherit;">
              <div class="car-card-img" style="padding-top: 55%;">
                <img src="${carImg}" alt="${car.name}">
                ${statusBadge}
                <button class="car-wishlist-btn active" onclick="removeWishlistItem(event, '${car._id}')" aria-label="Xóa yêu thích">
                  <i class="fas fa-heart"></i>
                </button>
              </div>
              <div class="car-card-body" style="padding: 20px;">
                <h4 style="font-size: 1.1rem; margin-bottom: 10px; color: var(--color-white);">${car.name}</h4>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
                  <span style="color: var(--color-gold); font-weight: 600; font-size: 1rem;">${formatCurrencyVND(car.price)}</span>
                </div>
              </div>
            </a>
          `;
        }
      } catch (e) {
        console.error(`Failed to fetch wishlist item: ${carId}`);
      }
    }
    wishlistContainer.innerHTML = html || '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--color-silver);">Không tìm thấy thông tin xe yêu thích.</div>';
  } catch (err) {
    wishlistContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: #d90429;">Lỗi tải dữ liệu yêu thích.</div>';
  }
}

window.removeWishlistItem = function(e, carId) {
  e.stopPropagation();
  e.preventDefault();
  toggleWishlist(carId);
  const card = document.getElementById(`wishlist-card-${carId}`);
  if (card) {
    card.remove();
  }
  // Check if grid is now empty
  setTimeout(() => {
    const grid = document.getElementById('wishlist-cars-grid');
    if (grid && grid.children.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--color-silver);">Bạn chưa lưu chiếc xe nào vào danh mục yêu thích.</div>';
    }
  }, 100);
};
