function renderSidebar() {
  const sidebarContainer = document.getElementById('sidebar');
  if (!sidebarContainer) return;
  
  sidebarContainer.innerHTML = `
    <aside class="dashboard-sidebar">
      <div class="dashboard-user-info">
        <div class="avatar" id="user-avatar-char">U</div>
        <h3 id="user-sidebar-name">Khách Hàng</h3>
        <span id="user-sidebar-role">Khách Hàng</span>
      </div>
      
      <ul class="dashboard-menu">
        <li class="dashboard-menu-item" data-tab="tab-profile"><i class="fas fa-user-circle"></i> Trang cá nhân</li>
        <li class="dashboard-menu-item" data-tab="tab-orders"><i class="fas fa-file-contract"></i> Đơn hàng của tôi</li>
        <li class="dashboard-menu-item" data-tab="tab-appointments"><i class="far fa-calendar-alt"></i> Lịch hẹn xem xe</li>
        <li class="dashboard-menu-item" data-tab="tab-test-drives"><i class="fas fa-car-side"></i> Lịch lái thử</li>
        <li class="dashboard-menu-item" data-tab="tab-deposits"><i class="fas fa-receipt"></i> Đặt cọc của tôi</li>
        <li class="dashboard-menu-item" data-tab="tab-wishlist"><i class="fas fa-heart"></i> Xe yêu thích</li>
        <li class="dashboard-menu-item" data-tab="tab-overview"><i class="fas fa-th-large"></i> Tổng quan</li>
      </ul>

      <button class="btn-outline dashboard-logout-btn" id="logout-btn-sidebar"><i class="fas fa-sign-out-alt"></i> Đăng Xuất</button>
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
  const activeTab = urlParams.get('tab') || 'tab-profile';
  const activeItem = sidebarContainer.querySelector(`.dashboard-menu-item[data-tab="${activeTab}"]`);
  if (activeItem) {
    sidebarContainer.querySelectorAll('.dashboard-menu-item').forEach(el => el.classList.remove('active'));
    activeItem.classList.add('active');
  }

  // Handle Logout Event
  const logoutBtn = document.getElementById('logout-btn-sidebar');
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
