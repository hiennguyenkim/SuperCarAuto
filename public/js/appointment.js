document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const carId = urlParams.get('carId');
  const appointmentForm = document.getElementById('appointment-form');

  if (carId) {
    document.getElementById('carId').value = carId;
    fetchCarSummary(carId);
  }

  if (appointmentForm) {
    appointmentForm.addEventListener('submit', handleAppointmentSubmit);
  }
});

// Load summary of the car being booked
async function fetchCarSummary(carId) {
  try {
    const res = await fetch(`/api/cars/${carId}`);
    const data = await res.json();
    if (data.success && data.data) {
      const car = data.data;
      const carInfoDiv = document.getElementById('selected-car-info');
      if (carInfoDiv) {
        carInfoDiv.style.display = 'flex';
        carInfoDiv.innerHTML = `
          <img src="${car.images[0]}" alt="${car.name}" style="width: 100px; height: 65px; object-fit: cover; border-radius: 4px;">
          <div>
            <h4 style="color: var(--color-white); font-size: 1rem; margin-bottom: 5px;">${car.name}</h4>
            <p style="color: var(--color-gold); font-size: 0.9rem; font-weight: 600;">${formatCurrencyVND(car.price)}</p>
          </div>
        `;
      }
    }
  } catch (err) {
    console.error('Failed to load car details:', err.message);
  }
}

async function handleAppointmentSubmit(e) {
  e.preventDefault();

  const carId = document.getElementById('carId').value;
  const fullName = document.getElementById('fullName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const email = document.getElementById('email').value.trim();
  const showroom = document.getElementById('showroom').value;
  const appointmentDate = document.getElementById('appointmentDate').value;
  const appointmentTime = document.getElementById('appointmentTime').value;
  const groupSize = document.getElementById('groupSize').value;
  const note = document.getElementById('note').value.trim();

  if (!fullName || !phone || !email || !appointmentDate || !appointmentTime) {
    showToast('Vui lòng nhập đầy đủ các thông tin bắt buộc!', 'error');
    return;
  }

  const phoneRegex = /^0\d{8,10}$/;
  if (!phoneRegex.test(phone)) {
    showToast('Số điện thoại không hợp lệ!', 'error');
    return;
  }

  const appointmentData = {
    carId: carId || undefined,
    customerInfo: { fullName, phone, email, note },
    showroom,
    appointmentDate,
    appointmentTime,
    groupSize: Number(groupSize) || 1
  };

  try {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointmentData)
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast('Đặt lịch hẹn xem xe thành công!', 'success');
      setTimeout(() => {
        window.location.href = '/views/order-success.html?type=appointment';
      }, 1000);
    } else {
      showToast(data.message || 'Gửi yêu cầu thất bại. Đảm bảo bạn đã đăng nhập.', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối máy chủ.', 'error');
  }
}
