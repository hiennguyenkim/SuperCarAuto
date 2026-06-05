let contactsPollInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  if (typeof renderSidebar === 'function') {
    renderSidebar();
  }
  verifyStaffAccess();
  setupTabNavigation();
  setupManualOrderForm();
  setupChangePasswordForm();
  
  // Load initial tab data
  const urlParams = new URLSearchParams(window.location.search);
  const activeTab = urlParams.get('tab') || 'tab-overview';
  const activeSub = urlParams.get('sub') || '';
  
  // Set active class on menu items and tabs
  const menuItems = document.querySelectorAll('.dashboard-menu-item[data-tab]');
  const tabs = document.querySelectorAll('.dashboard-content-tab');
  
  menuItems.forEach(mi => {
    const tab = mi.getAttribute('data-tab');
    const sub = mi.getAttribute('data-sub') || '';
    if (tab === activeTab && sub === activeSub) {
      mi.classList.add('active');
    } else {
      mi.classList.remove('active');
    }
  });
  
  tabs.forEach(tab => {
    if (tab.id === activeTab) tab.classList.add('active');
    else tab.classList.remove('active');
  });

  loadTabContent(activeTab);
});

async function verifyStaffAccess() {
  try {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (!data.success || !data.user || (data.user.role !== 'staff' && data.user.role !== 'admin')) {
      window.location.href = '/views/login.html';
      return;
    }
    
    const staffNameEl = document.getElementById('staff-sidebar-name');
    const staffRoleEl = document.getElementById('staff-sidebar-role');
    if (staffNameEl) staffNameEl.textContent = data.user.fullName;
    if (staffRoleEl) staffRoleEl.textContent = data.user.role === 'admin' ? 'Quản Trị Viên' : 'Nhân Viên Showroom';
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
      const targetSub = item.getAttribute('data-sub') || '';

      // Update URL query parameter
      let url = '?tab=' + targetTabId;
      if (targetSub) {
        url += '&sub=' + targetSub;
      }
      window.history.replaceState(null, '', url);

      menuItems.forEach(mi => mi.classList.remove('active'));
      item.classList.add('active');

      tabs.forEach(tab => {
        if (tab.id === targetTabId) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });

      loadTabContent(targetTabId);
    });
  });
}

function loadTabContent(tabId) {
  if (contactsPollInterval) {
    clearInterval(contactsPollInterval);
    contactsPollInterval = null;
  }

  if (tabId === 'tab-overview') {
    fetchOverviewStats();
    initRevenueStats();
  } else if (tabId === 'tab-appointments') {
    fetchAppointments();
  } else if (tabId === 'tab-test-drives') {
    fetchTestDrives();
  } else if (tabId === 'tab-deposits') {
    fetchDeposits();
  } else if (tabId === 'tab-orders') {
    fetchOrders();
  } else if (tabId === 'tab-manual-order') {
    loadManualOrderDropdowns();
  } else if (tabId === 'tab-contacts') {
    fetchContacts();
    contactsPollInterval = setInterval(() => fetchContacts(true), 5000);
  }
}

// 1. Fetch system statistics for Overview tab
async function fetchOverviewStats() {
  try {
    const aptRes = await fetch('/api/appointments');
    const aptData = await aptRes.json();
    const depRes = await fetch('/api/deposits');
    const depData = await depRes.json();
    const ordRes = await fetch('/api/orders');
    const ordData = await ordRes.json();

    if (aptData.success && depData.success && ordData.success) {
      const today = new Date().toDateString();
      
      const aptTodayCount = aptData.data.filter(a => new Date(a.appointmentDate).toDateString() === today).length;
      const pendingDepCount = depData.data.filter(d => d.status === 'pending_confirm').length;
      const processingOrdCount = ordData.data.filter(o => o.orderStatus !== 'completed' && o.orderStatus !== 'cancelled').length;

      document.getElementById('stat-apt-today').textContent = aptTodayCount;
      document.getElementById('stat-dep-pending').textContent = pendingDepCount;
      document.getElementById('stat-orders-active').textContent = processingOrdCount;
    }
  } catch (err) {
    console.error('Failed to load overview statistics:', err.message);
  }
}

let revenueChart = null;
let statsInitialized = false;

function initRevenueStats() {
  const endDateInput = document.getElementById('stats-end-date');
  const startDateInput = document.getElementById('stats-start-date');
  
  if (!endDateInput || !startDateInput) return;

  // Only bind event listeners once
  if (!statsInitialized) {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    endDateInput.value = today.toISOString().split('T')[0];
    startDateInput.value = thirtyDaysAgo.toISOString().split('T')[0];

    const applyBtn = document.getElementById('btn-stats-apply');
    if (applyBtn) {
      applyBtn.onclick = () => {
        loadRevenueStats();
      };
    }

    document.querySelectorAll('.quick-filter-btn').forEach(btn => {
      btn.onclick = () => {
        const days = btn.getAttribute('data-days');
        const now = new Date();
        let start = new Date();
        
        if (days === '7') {
          start.setDate(now.getDate() - 7);
        } else if (days === 'month') {
          start = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (days === 'year') {
          start = new Date(now.getFullYear(), 0, 1);
        }
        
        startDateInput.value = start.toISOString().split('T')[0];
        endDateInput.value = now.toISOString().split('T')[0];
        loadRevenueStats();
      };
    });

    statsInitialized = true;
  }

  loadRevenueStats();
}

async function loadRevenueStats() {
  const startDate = document.getElementById('stats-start-date').value;
  const endDate = document.getElementById('stats-end-date').value;
  
  if (!startDate || !endDate) {
    showToast('Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc', 'error');
    return;
  }

  try {
    const chartRes = await fetch(`/api/stats/revenue-chart?startDate=${startDate}&endDate=${endDate}`);
    const chartData = await chartRes.json();
    
    const carRes = await fetch(`/api/stats/by-car?startDate=${startDate}&endDate=${endDate}`);
    const carData = await carRes.json();

    if (chartData.success && carData.success) {
      updateRevenueChart(chartData.data);
      updateSoldCarsTable(carData.data);
    }
  } catch (err) {
    console.error('Failed to load revenue stats:', err.message);
  }
}

function updateRevenueChart(data) {
  const canvas = document.getElementById('revenue-chart-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const labels = data.map(item => {
    const parts = item.date.split('-');
    return `${parts[2]}/${parts[1]}`;
  });
  const revenues = data.map(item => item.revenue);

  if (revenueChart) {
    revenueChart.data.labels = labels;
    revenueChart.data.datasets[0].data = revenues;
    revenueChart.update();
  } else {
    revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Doanh thu (VNĐ)',
          data: revenues,
          borderColor: '#c9a84c',
          backgroundColor: 'rgba(201, 168, 76, 0.1)',
          borderWidth: 2,
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#ccc'
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#ccc'
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#ccc',
              callback: function(value) {
                if (value >= 1000000000) {
                  return (value / 1000000000).toFixed(1) + ' Tỷ';
                } else if (value >= 1000000) {
                  return (value / 1000000).toFixed(0) + ' Tr';
                }
                return value;
              }
            }
          }
        }
      }
    });
  }
}

function updateSoldCarsTable(data) {
  const tbody = document.getElementById('sold-cars-table-body');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--color-silver);">Không có giao dịch bán xe nào trong khoảng thời gian này.</td></tr>';
    return;
  }

  let html = '';
  data.forEach(item => {
    const dateStr = new Date(item.completedAt).toLocaleDateString('vi-VN');
    html += `
      <tr>
        <td><strong>${item.carName}</strong></td>
        <td>${item.brand}</td>
        <td style="color: var(--color-gold); font-weight: 600;">${formatCurrencyVND(item.price)}</td>
        <td>${dateStr}</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

// 2. Manage Appointments (Showroom visits)
async function fetchAppointments() {
  const tbody = document.getElementById('staff-appointments-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Đang tải lịch hẹn...</td></tr>';

  try {
    const res = await fetch('/api/appointments');
    const data = await res.json();

    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Không có lịch hẹn xem xe nào trong hệ thống.</td></tr>';
        return;
      }

      let html = '';
      data.data.forEach(apt => {
        const carName = apt.car ? apt.car.name : 'Tư vấn chung';
        const dateStr = new Date(apt.appointmentDate).toLocaleDateString('vi-VN');
        
        let actions = `
          <div class="action-btn-group">
            <button class="action-btn" onclick="updateAptStatus('${apt._id}', 'confirmed')" title="Xác nhận lịch"><i class="fas fa-check"></i></button>
            <button class="action-btn" onclick="updateAptStatus('${apt._id}', 'visited')" title="Khách đã đến"><i class="fas fa-user-check"></i></button>
            <button class="action-btn" onclick="updateAptStatus('${apt._id}', 'completed')" title="Hoàn thành"><i class="fas fa-flag-checkered"></i></button>
            <button class="action-btn btn-danger-hover" onclick="updateAptStatus('${apt._id}', 'cancelled')" title="Hủy lịch"><i class="fas fa-times"></i></button>
          </div>
        `;

        html += `
          <tr>
            <td>${apt.customerInfo.fullName} <br><small>${apt.customerInfo.phone}</small></td>
            <td>${carName}</td>
            <td>${apt.showroom}</td>
            <td>${dateStr} lúc ${apt.appointmentTime}</td>
            <td><span class="badge-status ${apt.status}">${apt.status}</span></td>
            <td><input type="text" id="note-${apt._id}" value="${apt.staffNote || ''}" style="width: 100%; background: #222; border: 1px solid #444; color: #fff; padding: 5px;"></td>
            <td>${actions}</td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #d90429;">Lỗi tải dữ liệu lịch hẹn.</td></tr>';
  }
}

window.updateAptStatus = async function(aptId, status) {
  const note = document.getElementById(`note-${aptId}`).value;
  try {
    const res = await fetch(`/api/appointments/${aptId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, staffNote: note })
    });
    if (res.ok) {
      showToast('Đã cập nhật trạng thái lịch hẹn xem xe!', 'success');
      fetchAppointments();
    } else {
      showToast('Cập nhật thất bại.', 'error');
    }
  } catch (e) {
    showToast('Lỗi máy chủ.', 'error');
  }
};

// 3. Manage Test Drives
async function fetchTestDrives() {
  const tbody = document.getElementById('staff-testdrives-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Đang tải danh sách lái thử...</td></tr>';

  try {
    const res = await fetch('/api/test-drives');
    const data = await res.json();

    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Không có yêu cầu lái thử nào.</td></tr>';
        return;
      }

      let html = '';
      data.data.forEach(td => {
        const carName = td.car ? td.car.name : 'Đang tải';
        const dateStr = new Date(td.testDriveDate).toLocaleDateString('vi-VN');
        const licenseLink = td.licenseImage ? `<a href="${td.licenseImage}" target="_blank"><img src="${td.licenseImage}" class="proof-thumbnail"></a>` : 'Không đính kèm';
        
        let actions = `
          <div class="action-btn-group">
            <button class="action-btn" onclick="updateTdStatus('${td._id}', 'confirmed')" title="Xác nhận lái thử"><i class="fas fa-check"></i></button>
            <button class="action-btn" onclick="updateTdStatus('${td._id}', 'preparing')" title="Đang chuẩn bị xe"><i class="fas fa-car-side"></i></button>
            <button class="action-btn" onclick="updateTdStatus('${td._id}', 'completed')" title="Hoàn thành"><i class="fas fa-flag-checkered"></i></button>
            <button class="action-btn btn-danger-hover" onclick="updateTdStatus('${td._id}', 'rejected')" title="Từ chối"><i class="fas fa-ban"></i></button>
          </div>
        `;

        html += `
          <tr>
            <td>${td.customerInfo.fullName} <br><small>${td.customerInfo.phone}</small></td>
            <td>${carName}</td>
            <td>${td.showroom}</td>
            <td>${dateStr} lúc ${td.testDriveTime}</td>
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
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #d90429;">Lỗi tải lịch lái thử.</td></tr>';
  }
}

window.updateTdStatus = async function(tdId, status) {
  const note = document.getElementById(`tdnote-${tdId}`).value;
  try {
    const res = await fetch(`/api/test-drives/${tdId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, staffNote: note })
    });
    if (res.ok) {
      showToast('Đã cập nhật trạng thái lái thử!', 'success');
      fetchTestDrives();
    } else {
      showToast('Cập nhật thất bại.', 'error');
    }
  } catch (e) {
    showToast('Lỗi kết nối.', 'error');
  }
};

// 4. Manage Deposits (Confirm, Cancel, Convert to Order)
async function fetchDeposits() {
  const tbody = document.getElementById('staff-deposits-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Đang tải danh sách đặt cọc...</td></tr>';

  try {
    const res = await fetch('/api/deposits');
    const data = await res.json();

    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Chưa có giao dịch đặt cọc giữ xe nào.</td></tr>';
        return;
      }

      let html = '';
      data.data.forEach(dep => {
        const carName = dep.car ? dep.car.name : 'Đang tải';
        const amount = formatCurrencyVND(dep.depositAmount);
        const proofLink = dep.paymentProof ? `<a href="${dep.paymentProof}" target="_blank"><img src="${dep.paymentProof}" class="proof-thumbnail"></a>` : 'Chưa gửi';
        
        let actions = '<div class="action-btn-group">';
        
        if (dep.status === 'pending_confirm' || dep.status === 'pending_payment') {
          actions += `<button class="btn-gold" onclick="confirmDepositPayment('${dep._id}')" style="padding: 5px 10px; font-size: 0.7rem; text-transform: uppercase;">Xác Nhận Cọc</button>`;
        }
        
        if (dep.status === 'confirmed') {
          actions += `<button class="btn-outline" onclick="promptConvertToOrder('${dep._id}')" style="padding: 5px 10px; font-size: 0.7rem; text-transform: uppercase;">Tạo Đơn Hàng</button>`;
        }

        if (dep.status !== 'cancelled' && dep.status !== 'converted_to_order' && dep.status !== 'refunded') {
          actions += `<button class="action-btn btn-danger-hover" onclick="cancelDepositItem('${dep._id}')" title="Hủy cọc"><i class="fas fa-times"></i></button>`;
        }

        actions += '</div>';

        html += `
          <tr>
            <td>${dep.depositCode}</td>
            <td>${dep.customerInfo.fullName} <br><small>${dep.customerInfo.phone}</small></td>
            <td>${carName}</td>
            <td>${amount}</td>
            <td>${proofLink}</td>
            <td><span class="badge-status ${dep.status}">${dep.status}</span></td>
            <td><input type="text" id="depnote-${dep._id}" value="${dep.staffNote || ''}" style="width: 100%; background: #222; border: 1px solid #444; color: #fff; padding: 5px;"></td>
            <td>${actions}</td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #d90429;">Lỗi tải danh sách đặt cọc.</td></tr>';
  }
}

window.confirmDepositPayment = async function(depId) {
  const note = document.getElementById(`depnote-${depId}`).value;
  showModal('Xác Nhận Nhận Tiền Đặt Cọc', 'Bạn có chắc chắn đã nhận đủ tiền cọc giữ xe của khách hàng này?', async () => {
    try {
      const res = await fetch(`/api/deposits/${depId}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffNote: note })
      });
      if (res.ok) {
        showToast('Xác nhận đặt cọc thành công! Xe đã chuyển sang trạng thái đã đặt cọc.', 'success');
        fetchDeposits();
      } else {
        showToast('Xác nhận thất bại.', 'error');
      }
    } catch (e) {
      showToast('Lỗi máy chủ.', 'error');
    }
  });
};

window.cancelDepositItem = async function(depId) {
  const note = document.getElementById(`depnote-${depId}`).value;
  showModal('Hủy Hợp Đồng Đặt Cọc', 'Bạn có chắc muốn hủy lịch hẹn cọc này? Xe sẽ được mở bán lại.', async () => {
    try {
      const res = await fetch(`/api/deposits/${depId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffNote: note })
      });
      if (res.ok) {
        showToast('Đã hủy cọc thành công! Xe chuyển sang trạng thái mở bán.', 'success');
        fetchDeposits();
      } else {
        showToast('Hủy cọc thất bại.', 'error');
      }
    } catch (e) {
      showToast('Lỗi máy chủ.', 'error');
    }
  });
};

window.promptConvertToOrder = function(depId) {
  showPromptModal(
    'Lập Đơn Mua Siêu Xe',
    'Nhập địa chỉ đăng ký hộ khẩu / giao xe của khách hàng:',
    'Ví dụ: 88 Lê Văn Lương, Hà Nội...',
    (address) => {
      showModal('Lập Đơn Mua Siêu Xe', `Tiến hành lập hợp đồng mua bán với địa chỉ giao nhận: "${address}"?`, async () => {
        try {
          const res = await fetch(`/api/deposits/${depId}/convert-to-order`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            showToast('Lập đơn mua xe thành công! Mời chuyển sang tab Quản lý Đơn Hàng.', 'success');
            fetchDeposits();
          } else {
            showToast(data.message || 'Lỗi chuyển đổi.', 'error');
          }
        } catch (err) {
          showToast('Lỗi kết nối máy chủ.', 'error');
        }
      });
    }
  );
};

// 5. Manage Orders
async function fetchOrders() {
  const tbody = document.getElementById('staff-orders-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Đang tải danh sách đơn hàng...</td></tr>';

  try {
    const res = await fetch('/api/orders');
    const data = await res.json();

    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Chưa lập đơn hàng mua xe nào.</td></tr>';
        return;
      }

      let html = '';
      data.data.forEach(order => {
        const carName = order.carInfo ? order.carInfo.name : 'Đang tải';
        const total = formatCurrencyVND(order.total);
        const remaining = formatCurrencyVND(order.remainingAmount);
        
        let paymentBadge = `<span class="badge-status ${order.paymentStatus}">${order.paymentStatus}</span>`;
        let orderBadge = `<span class="badge-status ${order.orderStatus}">${order.orderStatus}</span>`;

        let actions = '<div class="action-btn-group">';
        
        if (order.paymentStatus !== 'paid') {
          actions += `<button class="btn-gold" onclick="confirmFullPayment('${order._id}')" style="padding: 5px 8px; font-size: 0.7rem;">Nhận Đủ Tiền</button>`;
        }

        if (order.orderStatus !== 'completed' && order.orderStatus !== 'cancelled' && order.orderStatus !== 'refunded') {
          actions += `<button class="btn-outline" onclick="completeVehicleHandover('${order._id}')" style="padding: 5px 8px; font-size: 0.7rem;">Bàn Giao Xe</button>`;
          actions += `<button class="action-btn btn-danger-hover" onclick="cancelOrderItem('${order._id}')" title="Hủy đơn"><i class="fas fa-times"></i></button>`;
        }
        
        actions += '</div>';

        html += `
          <tr>
            <td>${order.orderCode}</td>
            <td>${order.customerInfo.fullName} <br><small>${order.customerInfo.phone}</small></td>
            <td>${carName}</td>
            <td>${total}</td>
            <td>${remaining}</td>
            <td>${paymentBadge}</td>
            <td>${orderBadge}</td>
            <td>${actions}</td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #d90429;">Lỗi tải đơn hàng.</td></tr>';
  }
}

window.confirmFullPayment = function(orderId) {
  showModal('Xác Nhận Thanh Toán Toàn Bộ', 'Xác nhận khách hàng đã hoàn tất việc đóng nốt số tiền còn lại của xe?', async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm-payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus: 'paid' })
      });
      if (res.ok) {
        showToast('Xác nhận thanh toán đầy đủ thành công!', 'success');
        fetchOrders();
      } else {
        showToast('Thao tác thất bại.', 'error');
      }
    } catch (e) {
      showToast('Lỗi máy chủ.', 'error');
    }
  });
};

window.completeVehicleHandover = function(orderId) {
  showModal('Hoàn Thành Bàn Giao Siêu Xe', 'Bắt đầu quá trình bàn giao xe, kích hoạt gói bảo hành và khóa vĩnh viễn xe sang trạng thái ĐÃ BÁN?', async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        showToast('Bàn giao hoàn tất! Siêu xe đã bán.', 'success');
        fetchOrders();
      } else {
        showToast('Thao tác thất bại.', 'error');
      }
    } catch (e) {
      showToast('Lỗi kết nối.', 'error');
    }
  });
};

window.cancelOrderItem = function(orderId) {
  showModal('Hủy Đơn Hàng Mua Xe', 'Hủy hợp đồng mua bán xe? Xe sẽ được đưa trở lại trạng thái mở bán.', async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        showToast('Hủy đơn hàng thành công! Mở bán lại xe.', 'success');
        fetchOrders();
      } else {
        showToast('Hủy đơn thất bại.', 'error');
      }
    } catch (e) {
      showToast('Lỗi máy chủ.', 'error');
    }
  });
};

// 6. Create Manual Order (walk-in clients)
async function loadManualOrderDropdowns() {
  const carSelect = document.getElementById('manual-carId');
  const userSelect = document.getElementById('manual-userId');
  
  if (!carSelect || !userSelect) return;

  try {
    // Populate available cars
    const carRes = await fetch('/api/cars?status=available');
    const carData = await carRes.json();
    
    if (carData.success) {
      let carOptions = '<option value="">-- Chọn xe đang mở bán --</option>';
      carData.data.forEach(c => {
        carOptions += `<option value="${c._id}">${c.name} (${formatCurrencyVND(c.price)})</option>`;
      });
      carSelect.innerHTML = carOptions;
    }

    // Populate registered clients
    const userRes = await fetch('/api/accounts'); // Requires admin role, fallback mock if role is staff
    let userData = await userRes.json();
    
    if (userData.success) {
      let userOptions = '<option value="">-- Chọn khách hàng --</option>';
      userData.data.forEach(u => {
        if (u.role === 'user') {
          userOptions += `<option value="${u._id}">${u.fullName} (${u.email})</option>`;
        }
      });
      userSelect.innerHTML = userOptions;
    } else {
      userSelect.innerHTML = '<option value="">-- Lỗi tải danh sách người dùng --</option>';
    }
  } catch (err) {
    console.error('Failed to load manual order form references:', err.message);
  }
}

function setupManualOrderForm() {
  const form = document.getElementById('manual-order-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const carId = document.getElementById('manual-carId').value;
    const userId = document.getElementById('manual-userId').value;
    const fullName = document.getElementById('manual-fullName').value.trim();
    const phone = document.getElementById('manual-phone').value.trim();
    const email = document.getElementById('manual-email').value.trim();
    const address = document.getElementById('manual-address').value.trim();
    const paymentMethod = document.getElementById('manual-paymentMethod').value;
    const discountAmount = document.getElementById('manual-discount').value || 0;
    const note = document.getElementById('manual-note').value.trim();

    if (!carId || !userId || !fullName || !phone || !email || !address) {
      showToast('Vui lòng điền đầy đủ các thông tin bắt buộc!', 'error');
      return;
    }

    const orderData = {
      carId,
      userId,
      customerInfo: { fullName, phone, email, address, note },
      paymentMethod,
      discountAmount: Number(discountAmount)
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Lập đơn hàng thủ công thành công!', 'success');
        form.reset();
        loadManualOrderDropdowns();
      } else {
        showToast(data.message || 'Lập đơn hàng thất bại.', 'error');
      }
    } catch (err) {
      showToast('Lỗi kết nối.', 'error');
    }
  });
}

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

async function fetchContacts(silent = false) {
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
          fetchContacts(true);
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
          fetchContacts(true);
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
        await fetchContacts(true);
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

function setupChangePasswordForm() {
  const form = document.getElementById('staff-change-password-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('staff-current-password').value;
    const newPassword = document.getElementById('staff-new-password').value;
    const confirmPassword = document.getElementById('staff-confirm-password').value;

    if (newPassword !== confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp!', 'error');
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
        showToast('Thay đổi mật khẩu thành công!', 'success');
        form.reset();
      } else {
        showToast(data.message || 'Thay đổi mật khẩu thất bại.', 'error');
      }
    } catch (err) {
      showToast('Lỗi máy chủ.', 'error');
    }
  });
}
