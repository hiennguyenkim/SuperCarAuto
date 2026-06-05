// Global API URL Prefix
const API_URL = '';

// Check Auth on page load
document.addEventListener('DOMContentLoaded', () => {
  checkUserSession();
  setupHeaderScroll();
  initChatWidget();
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

// Floating Client-side CSKH Live Chat Widget
function initChatWidget() {
  // Do not show chat widget on admin or staff dashboards
  const path = window.location.pathname;
  if (path.includes('admin-dashboard') || path.includes('staff-dashboard')) {
    return;
  }

  // Create stylesheet for widget
  const style = document.createElement('style');
  style.textContent = `
    .chat-widget-btn {
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--color-gold, #dec171);
      color: #000;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 10px rgba(222, 193, 113, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.6rem;
      cursor: pointer;
      z-index: 9999;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .chat-widget-btn:hover {
      transform: scale(1.08) translateY(-3px);
      box-shadow: 0 6px 25px rgba(222, 193, 113, 0.4);
    }
    .chat-widget-popup {
      position: fixed;
      bottom: 100px;
      right: 30px;
      width: 360px;
      height: 500px;
      background: #161616;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.6);
      z-index: 9999;
      display: none;
      flex-direction: column;
      overflow: hidden;
      font-family: var(--font-body), system-ui, -apple-system, sans-serif;
    }
    .chat-widget-header {
      background: #0f0f0f;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .chat-widget-header h3 {
      margin: 0;
      font-size: 0.95rem;
      color: var(--color-gold, #dec171);
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .chat-widget-close {
      background: none;
      border: none;
      color: #999;
      font-size: 1.1rem;
      cursor: pointer;
      transition: color 0.2s;
    }
    .chat-widget-close:hover {
      color: #fff;
    }
    .chat-widget-body {
      flex: 1;
      overflow-y: auto;
      background: #0d0d0d;
      padding: 15px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .chat-widget-message {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 0.8rem;
      line-height: 1.4;
      word-break: break-word;
    }
    .chat-widget-message.incoming {
      align-self: flex-start;
      background: #222;
      color: #eee;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-bottom-left-radius: 2px;
    }
    .chat-widget-message.outgoing {
      align-self: flex-end;
      background: var(--color-gold, #dec171);
      color: #000;
      border-bottom-right-radius: 2px;
      font-weight: 500;
    }
    .chat-widget-footer {
      padding: 12px;
      background: #161616;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      gap: 8px;
    }
    .chat-widget-input {
      flex: 1;
      padding: 8px 12px;
      background: #222;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      color: #fff;
      font-size: 0.85rem;
    }
    .chat-widget-input:focus {
      border-color: var(--color-gold, #dec171);
      outline: none;
    }
    .chat-widget-send {
      background: var(--color-gold, #dec171);
      border: none;
      color: #000;
      padding: 8px 15px;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .chat-widget-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 10px 5px;
    }
    .chat-widget-form label {
      font-size: 0.75rem;
      color: #aaa;
      margin-bottom: 4px;
    }
    .chat-widget-form input, .chat-widget-form textarea {
      width: 100%;
      padding: 8px 12px;
      background: #222;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      color: #fff;
      font-size: 0.8rem;
    }
    .chat-widget-form input:focus, .chat-widget-form textarea:focus {
      border-color: var(--color-gold, #dec171);
      outline: none;
    }
    .chat-widget-form button {
      background: var(--color-gold, #dec171);
      color: #000;
      border: none;
      padding: 10px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
      margin-top: 10px;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  `;
  document.head.appendChild(style);

  // Create Widget Button
  const btn = document.createElement('div');
  btn.className = 'chat-widget-btn';
  btn.innerHTML = '<i class="fab fa-facebook-messenger"></i>';
  document.body.appendChild(btn);

  // Create Widget Popup
  const popup = document.createElement('div');
  popup.className = 'chat-widget-popup';
  popup.innerHTML = `
    <div class="chat-widget-header">
      <h3><i class="fab fa-facebook-messenger"></i> Hỗ Trợ Trực Tuyến</h3>
      <button class="chat-widget-close"><i class="fas fa-times"></i></button>
    </div>
    <div class="chat-widget-body" id="chat-widget-body">
      <!-- Content loaded dynamically -->
    </div>
    <div class="chat-widget-footer" id="chat-widget-footer">
      <input type="text" class="chat-widget-input" id="chat-widget-input" placeholder="Nhập tin nhắn của bạn...">
      <button class="chat-widget-send" id="chat-widget-send">Gửi</button>
    </div>
  `;
  document.body.appendChild(popup);

  const body = popup.querySelector('#chat-widget-body');
  const footer = popup.querySelector('#chat-widget-footer');
  const input = popup.querySelector('#chat-widget-input');
  const sendBtn = popup.querySelector('#chat-widget-send');
  const closeBtn = popup.querySelector('.chat-widget-close');

  let pollInterval = null;
  let currentThreadId = localStorage.getItem('supercar_chat_thread_id');

  // Toggle Popup
  btn.addEventListener('click', () => {
    const isOpen = popup.style.display === 'flex';
    popup.style.display = isOpen ? 'none' : 'flex';
    if (!isOpen) {
      loadChatWidgetView();
      startPolling();
    } else {
      stopPolling();
    }
  });

  // Close Popup
  closeBtn.addEventListener('click', () => {
    popup.style.display = 'none';
    stopPolling();
  });

  function startPolling() {
    stopPolling();
    if (currentThreadId) {
      pollInterval = setInterval(fetchChatHistory, 5000);
    }
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  async function loadChatWidgetView() {
    currentThreadId = localStorage.getItem('supercar_chat_thread_id');
    footer.style.display = 'flex';
    if (currentThreadId) {
      await fetchChatHistory();
    } else {
      renderWelcomeView();
    }
  }

  function renderWelcomeView() {
    body.innerHTML = `
      <div style="text-align: center; color: #888; font-size: 0.8rem; padding: 20px 10px; margin-top: 50px;">
        <i class="fab fa-facebook-messenger" style="font-size: 2.5rem; color: var(--color-gold, #dec171); margin-bottom: 15px; display: block;"></i>
        Chào mừng quý khách đến với <strong>SuperCar Luxury</strong>!<br><br>
        Vui lòng nhập tin nhắn bên dưới để bắt đầu cuộc trò chuyện với tư vấn viên của chúng tôi.
      </div>
    `;
  }

  async function fetchChatHistory() {
    if (!currentThreadId) return;
    try {
      const res = await fetch(`/api/contact-message/thread/${currentThreadId}`);
      const data = await res.json();
      if (data.success && data.data) {
        renderChatMessages(data.data.messages || []);
      }
    } catch (err) {
      console.error('Failed to poll chat:', err);
    }
  }

  function renderChatMessages(messages) {
    const oldScrollHeight = body.scrollHeight;
    body.innerHTML = '';
    
    if (messages.length === 0) {
      body.innerHTML = '<p style="text-align: center; color: #666; font-size: 0.8rem; margin-top: 50px;">Không có tin nhắn nào.</p>';
      return;
    }

    messages.forEach(msg => {
      const isOut = msg.sender === 'user';
      const msgEl = document.createElement('div');
      msgEl.className = `chat-widget-message ${isOut ? 'outgoing' : 'incoming'}`;
      
      let senderPrefix = '';
      if (!isOut) {
        senderPrefix = `<div style="font-size: 0.65rem; color: var(--color-gold); font-weight: bold; margin-bottom: 2px;">${msg.senderName} (${msg.sender === 'admin' ? 'Admin' : 'Staff'})</div>`;
      }
      
      const timeStr = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      msgEl.innerHTML = `
        ${senderPrefix}
        <div>${escapeHtml(msg.content)}</div>
        <div style="font-size: 0.6rem; opacity: 0.5; text-align: right; margin-top: 4px;">${timeStr}</div>
      `;
      body.appendChild(msgEl);
    });

    if (body.scrollHeight > oldScrollHeight) {
      body.scrollTop = body.scrollHeight;
    }
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    try {
      let payload = {};
      if (currentThreadId) {
        payload = { threadId: currentThreadId, message: text };
      } else {
        // Automatically fetch or generate user/guest profile info
        let userInfo = null;
        try {
          const authRes = await fetch('/api/auth/me');
          const authData = await authRes.json();
          if (authData.success && authData.user) {
            userInfo = {
              fullName: authData.user.fullName,
              email: authData.user.email,
              phone: authData.user.phone || ''
            };
          }
        } catch (e) {
          console.error('Failed to fetch user session:', e);
        }

        if (!userInfo) {
          // Fallback to guest info
          let guestName = localStorage.getItem('supercar_chat_guest_name');
          let guestEmail = localStorage.getItem('supercar_chat_guest_email');
          if (!guestName || !guestEmail) {
            const randId = Math.floor(1000 + Math.random() * 9000);
            guestName = `Khách hàng #${randId}`;
            guestEmail = `guest_${randId}@supercar.com`;
            localStorage.setItem('supercar_chat_guest_name', guestName);
            localStorage.setItem('supercar_chat_guest_email', guestEmail);
          }
          userInfo = {
            fullName: guestName,
            email: guestEmail,
            phone: ''
          };
        }

        payload = {
          fullName: userInfo.fullName,
          email: userInfo.email,
          phone: userInfo.phone,
          message: text
        };
      }

      const res = await fetch('/api/contact-message/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.data) {
        currentThreadId = data.data._id;
        localStorage.setItem('supercar_chat_thread_id', currentThreadId);
        renderChatMessages(data.data.messages || []);
        body.scrollTop = body.scrollHeight;
        startPolling();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
