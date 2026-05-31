document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const forgotForm = document.getElementById('forgot-form');

  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }

  if (registerForm) {
    registerForm.addEventListener('submit', handleRegisterSubmit);
  }

  if (forgotForm) {
    forgotForm.addEventListener('submit', handleForgotSubmit);
  }
});

async function handleLoginSubmit(e) {
  e.preventDefault();
  const usernameOrEmail = document.getElementById('usernameOrEmail').value.trim();
  const password = document.getElementById('password').value;

  if (!usernameOrEmail || !password) {
    showToast('Vui lòng nhập tên đăng nhập/email và mật khẩu!', 'error');
    return;
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usernameOrEmail, password })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast('Đăng nhập thành công!', 'success');
      setTimeout(() => {
        // Redirect based on user role
        if (data.user.role === 'admin') {
          window.location.href = '/views/admin-dashboard.html';
        } else if (data.user.role === 'staff') {
          window.location.href = '/views/staff-dashboard.html';
        } else {
          window.location.href = '/views/user-dashboard.html';
        }
      }, 1000);
    } else {
      showToast(data.message || 'Đăng nhập thất bại. Kiểm tra lại thông tin.', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối máy chủ.', 'error');
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const fullName = document.getElementById('fullName').value.trim();
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const address = document.getElementById('address').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (!fullName || !username || !email || !phone || !password) {
    showToast('Vui lòng điền đầy đủ các thông tin bắt buộc!', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showToast('Mật khẩu nhập lại không khớp!', 'error');
    return;
  }

  const phoneRegex = /^0\d{8,10}$/;
  if (!phoneRegex.test(phone)) {
    showToast('Số điện thoại không hợp lệ (Ví dụ: 0912345678, gồm 9-11 chữ số)!', 'error');
    return;
  }

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, username, email, phone, address, password })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast('Đăng ký tài khoản thành công!', 'success');
      setTimeout(() => {
        window.location.href = '/views/user-dashboard.html';
      }, 1000);
    } else {
      showToast(data.message || 'Đăng ký tài khoản thất bại.', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối máy chủ.', 'error');
  }
}

async function handleForgotSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();

  if (!email) {
    showToast('Vui lòng nhập địa chỉ email của bạn!', 'error');
    return;
  }

  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast('Yêu cầu thành công! Vui lòng kiểm tra Console của trình duyệt để nhận mã.', 'success');
      console.log(`[SIMULATED RESET LINK] Token received: ${data.token}`);
    } else {
      showToast(data.message || 'Địa chỉ email không tồn tại trong hệ thống.', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối máy chủ.', 'error');
  }
}
