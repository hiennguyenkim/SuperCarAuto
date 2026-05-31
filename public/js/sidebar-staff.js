function renderSidebar() {
  const sidebarContainer = document.getElementById('sidebar');
  if (!sidebarContainer) return;
  
  sidebarContainer.innerHTML = `
    <aside class="dashboard-sidebar">
      <div class="dashboard-user-info">
        <div class="avatar" style="background: linear-gradient(135deg, #dec171 0%, #7c5d0f 100%);">S</div>
        <h3 id="staff-sidebar-name">Nhân Viên</h3>
        <span id="staff-sidebar-role">Staff</span>
      </div>
      
      <ul class="dashboard-menu">
        <li class="dashboard-menu-item" data-tab="tab-overview"><i class="fas fa-chart-line"></i> Tổng quan</li>
        <li class="dashboard-menu-item" data-tab="tab-appointments"><i class="far fa-calendar-alt"></i> Quản lý lịch hẹn</li>
        <li class="dashboard-menu-item" data-tab="tab-test-drives"><i class="fas fa-car-side"></i> Kiểm duyệt lái thử</li>
        <li class="dashboard-menu-item" data-tab="tab-deposits"><i class="fas fa-receipt"></i> Quản lý đặt cọc</li>
        <li class="dashboard-menu-item" data-tab="tab-orders"><i class="fas fa-file-contract"></i> Quản lý đơn hàng</li>
        <li class="dashboard-menu-item" data-tab="tab-manual-order"><i class="fas fa-plus-circle"></i> Tạo đơn thủ công</li>
        <li class="dashboard-menu-item" data-tab="tab-orders" data-sub="handover"><i class="fas fa-truck-loading"></i> Bàn giao xe</li>
        <li class="dashboard-menu-item" data-tab="tab-deposits" data-sub="payment"><i class="fas fa-wallet"></i> Xác nhận thanh toán</li>
        <li class="dashboard-menu-item" data-tab="tab-contacts"><i class="fas fa-users"></i> Quản lý khách hàng</li>
        <li class="dashboard-menu-item" data-tab="tab-chat"><i class="fas fa-comments"></i> Chat CSKH</li>
        <li class="dashboard-menu-item" data-tab="tab-change-password"><i class="fas fa-key"></i> Đổi mật khẩu</li>
      </ul>

      <button class="btn-outline dashboard-logout-btn" id="logout-btn-staff"><i class="fas fa-sign-out-alt"></i> Đăng Xuất</button>
    </aside>
    <button class="sidebar-toggle-btn" id="sidebar-toggle"><i class="fas fa-bars"></i></button>
  `;

  // Mobile Hamburger Toggle
  const toggleBtn = document.getElementById('sidebar-toggle');
  const sidebar = sidebarContainer.querySelector('.dashboard-sidebar');
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('active');
    });
  }

  // Click outside to close drawer on mobile
  document.addEventListener('click', (e) => {
    if (sidebar && sidebar.classList.contains('active')) {
      if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
        sidebar.classList.remove('active');
      }
    }
  });

  // Sync initial tab from URL query params
  const urlParams = new URLSearchParams(window.location.search);
  const activeTab = urlParams.get('tab') || 'tab-overview';
  const activeSub = urlParams.get('sub') || '';
  if (activeTab) {
    let selector = `.dashboard-menu-item[data-tab="${activeTab}"]`;
    if (activeSub) {
      selector += `[data-sub="${activeSub}"]`;
    } else {
      selector += `:not([data-sub])`;
    }
    const activeItem = sidebarContainer.querySelector(selector);
    if (activeItem) {
      sidebarContainer.querySelectorAll('.dashboard-menu-item').forEach(el => el.classList.remove('active'));
      activeItem.classList.add('active');
    }
  }

  // Handle Logout Event
  const logoutBtn = document.getElementById('logout-btn-staff');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof handleLogout === 'function') {
        handleLogout();
      }
    });
  }
}

window.renderSidebar = renderSidebar;
