function renderSidebar() {
  const sidebarContainer = document.getElementById('sidebar');
  if (!sidebarContainer) return;
  
  sidebarContainer.innerHTML = `
    <aside class="dashboard-sidebar">
      <div class="dashboard-user-info">
        <div class="avatar" style="background: linear-gradient(135deg, var(--color-gold) 0%, #b3913b 100%);">A</div>
        <h3 id="admin-sidebar-name">Quản Trị Viên</h3>
        <span id="admin-sidebar-role">Admin</span>
      </div>
      
      <ul class="dashboard-menu">
        <li class="dashboard-menu-item" data-tab="tab-overview"><i class="fas fa-chart-line"></i> Tổng quan & Thống kê</li>
        <li class="dashboard-menu-item" data-tab="tab-cars"><i class="fas fa-car"></i> Quản lý kho xe</li>
        <li class="dashboard-menu-item" data-tab="tab-brands"><i class="fas fa-tags"></i> Quản lý hãng xe</li>
        <li class="dashboard-menu-item" data-tab="tab-categories"><i class="fas fa-folder"></i> Quản lý danh mục</li>
        <li class="dashboard-menu-item" data-tab="tab-collections"><i class="fas fa-images"></i> Quản lý bộ sưu tập</li>
        <li class="dashboard-menu-item" data-tab="tab-appointments"><i class="far fa-calendar-alt"></i> Quản lý lịch hẹn</li>
        <li class="dashboard-menu-item" data-tab="tab-test-drives"><i class="fas fa-car-side"></i> Quản lý lái thử</li>
        <li class="dashboard-menu-item" data-tab="tab-deposits"><i class="fas fa-receipt"></i> Quản lý đặt cọc</li>
        <li class="dashboard-menu-item" data-tab="tab-orders"><i class="fas fa-file-contract"></i> Quản lý đơn hàng</li>
        <li class="dashboard-menu-item" data-tab="tab-accounts"><i class="fas fa-users-cog"></i> Quản lý tài khoản</li>
        <li class="dashboard-menu-item" data-tab="tab-coupons"><i class="fas fa-percentage"></i> Quản lý mã ưu đãi</li>
        <li class="dashboard-menu-item" data-tab="tab-reviews"><i class="fas fa-star"></i> Quản lý đánh giá</li>
        <li class="dashboard-menu-item" data-tab="tab-contacts"><i class="fas fa-envelope"></i> Quản lý liên hệ & CSKH</li>
        <li class="dashboard-menu-item" data-tab="tab-homepage-settings"><i class="fas fa-cogs"></i> Cài đặt trang chủ</li>
        <li class="dashboard-menu-item" data-tab="tab-audit-logs"><i class="fas fa-history"></i> Nhật ký hoạt động</li>
      </ul>

      <button class="btn-outline dashboard-logout-btn" id="logout-btn-admin"><i class="fas fa-sign-out-alt"></i> Đăng Xuất</button>
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
  const activeItem = sidebarContainer.querySelector(`.dashboard-menu-item[data-tab="${activeTab}"]`);
  if (activeItem) {
    sidebarContainer.querySelectorAll('.dashboard-menu-item').forEach(el => el.classList.remove('active'));
    activeItem.classList.add('active');
  }

  // Handle Logout Event
  const logoutBtn = document.getElementById('logout-btn-admin');
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
