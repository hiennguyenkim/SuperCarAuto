// Global API URL Prefix
const API_URL = '';

// Check Auth on page load
document.addEventListener('DOMContentLoaded', () => {
  checkUserSession();
  setupHeaderScroll();
});

// Setup sticky header scroll effects
function setupHeaderScroll() {
  const header = document.querySelector('header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }
}

// Fetch session and update navbar
async function checkUserSession() {
  const navButtons = document.getElementById('nav-auth-buttons');
  if (!navButtons) return;

  // Render logo dynamically
  loadLogoAndMenu();

  try {
    const res = await fetch(`${API_URL}/api/auth/me`);
    const data = await res.json();

    if (data.success && data.user) {
      const user = data.user;
      
      // Determine dashboard link based on role
      let dashboardPage = '/views/user-dashboard.html';
      let roleText = 'Khách Hàng';
      if (user.role === 'staff') {
        dashboardPage = '/views/staff-dashboard.html';
        roleText = 'Nhân Viên';
      } else if (user.role === 'admin') {
        dashboardPage = '/views/admin-dashboard.html';
        roleText = 'Quản Trị Viên';
      }

      const avatarColor = getAvatarColor(user._id);
      const avatarChar = user.fullName.charAt(0).toUpperCase();

      navButtons.innerHTML = `
        <div class="header-avatar-container" style="position: relative; cursor: pointer; display: flex; align-items: center; gap: 10px;">
          <div class="user-avatar" style="width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #000; font-size: 1.1rem; background: ${avatarColor};">
            ${avatarChar}
          </div>
          <div class="header-dropdown-menu" style="display: none; position: absolute; top: 48px; right: 0; background: var(--bg-secondary); border: var(--glass-border); border-radius: 4px; width: 220px; padding: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.8); z-index: 1000; flex-direction: column; gap: 10px;">
            <div style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px; margin-bottom: 5px;">
              <h4 style="font-size: 0.9rem; color: var(--color-white); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${user.fullName}">${user.fullName.slice(0, 20)}</h4>
              <span style="font-size: 0.7rem; color: var(--color-gold); text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">${roleText}</span>
            </div>
            <a href="/views/user-dashboard.html?tab=tab-profile" class="btn-dark" style="padding: 8px 12px; font-size: 0.75rem; text-align: center; text-transform: none; letter-spacing: 1px;">Trang Cá Nhân</a>
            <a href="${dashboardPage}" class="btn-gold" style="padding: 8px 12px; font-size: 0.75rem; text-align: center; text-transform: none; letter-spacing: 1px; color: #000;">Dashboard</a>
            <button class="btn-outline" id="nav-logout-btn" style="padding: 8px 12px; font-size: 0.75rem; text-transform: none; letter-spacing: 1px; border-color: rgba(217, 4, 41, 0.5); color: #d90429; width: 100%;">Đăng Xuất</button>
          </div>
        </div>
      `;

      // Dropdown toggle trigger
      const avatarContainer = navButtons.querySelector('.header-avatar-container');
      const dropdownMenu = navButtons.querySelector('.header-dropdown-menu');
      if (avatarContainer && dropdownMenu) {
        avatarContainer.addEventListener('click', (e) => {
          e.stopPropagation();
          const isFlex = dropdownMenu.style.display === 'flex';
          dropdownMenu.style.display = isFlex ? 'none' : 'flex';
        });
      }

      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        if (dropdownMenu) dropdownMenu.style.display = 'none';
      });

      // Logout handler
      document.getElementById('nav-logout-btn').addEventListener('click', handleLogout);
    } else {
      // Not logged in
      renderLoggedOutButtons(navButtons);
    }
  } catch (err) {
    console.error('Session retrieval failed:', err.message);
    renderLoggedOutButtons(navButtons);
  }
}

function renderLoggedOutButtons(container) {
  container.innerHTML = `
    <div class="header-avatar-container" style="position: relative; cursor: pointer; display: flex; align-items: center;">
      <div class="user-avatar" style="width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; color: var(--color-silver); font-size: 1.1rem; background: rgba(255,255,255,0.05); border: var(--glass-border);">
        <i class="fas fa-user" style="font-size: 0.95rem;"></i>
      </div>
      <div class="header-dropdown-menu" style="display: none; position: absolute; top: 48px; right: 0; background: var(--bg-secondary); border: var(--glass-border); border-radius: 4px; width: 180px; padding: 15px; box-shadow: 0 10px 25px rgba(0,0,0,0.8); z-index: 1000; flex-direction: column; gap: 10px;">
        <a href="/views/login.html" class="btn-outline" style="padding: 8px 12px; font-size: 0.75rem; text-align: center; text-transform: none; letter-spacing: 1px;">Đăng Nhập</a>
        <a href="/views/register.html" class="btn-gold" style="padding: 8px 12px; font-size: 0.75rem; text-align: center; text-transform: none; letter-spacing: 1px; color: #000;">Đăng Ký</a>
      </div>
    </div>
  `;

  // Dropdown toggle trigger
  const avatarContainer = container.querySelector('.header-avatar-container');
  const dropdownMenu = container.querySelector('.header-dropdown-menu');
  if (avatarContainer && dropdownMenu) {
    avatarContainer.addEventListener('click', (e) => {
      e.stopPropagation();
      const isFlex = dropdownMenu.style.display === 'flex';
      dropdownMenu.style.display = isFlex ? 'none' : 'flex';
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    if (dropdownMenu) dropdownMenu.style.display = 'none';
  });
}

// Generate stable background colors based on user ID
function getAvatarColor(userId) {
  const colors = [
    '#dec171', '#b3913b', '#8c6b1b', '#3a86c8', '#457b9d',
    '#8338ec', '#ff006e', '#38b000', '#fb5607', '#4895ef'
  ];
  if (!userId) return colors[0];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

// Load Logo from Site Settings
async function loadLogoAndMenu() {
  const logoEl = document.querySelector('header .logo');
  if (!logoEl) return;
  try {
    const res = await fetch('/api/site-settings');
    const data = await res.json();
    if (data.success && data.data && data.data.logo) {
      logoEl.innerHTML = `<img src="${data.data.logo}" class="logo-img" alt="SuperCar Logo" style="max-height: 40px; object-fit: contain;">`;
    } else {
      logoEl.innerHTML = `<span class="logo-text" style="font-family: var(--font-heading); font-weight: 700; color: var(--color-gold); letter-spacing: 2px;">SuperCar</span>`;
    }
  } catch (err) {
    logoEl.innerHTML = `<span class="logo-text" style="font-family: var(--font-heading); font-weight: 700; color: var(--color-gold); letter-spacing: 2px;">SuperCar</span>`;
  }
}

async function handleLogout() {
  try {
    const res = await fetch(`${API_URL}/api/auth/logout`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Đăng xuất thành công!', 'success');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } else {
      showToast('Đăng xuất thất bại!', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối máy chủ.', 'error');
  }
}

// Local Helper for formatCurrency in vanilla JS files
function formatCurrencyVND(amount) {
  if (amount === undefined || amount === null) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}
