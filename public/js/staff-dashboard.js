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

// 7. Manage Contacts
async function fetchContacts() {
  const tbody = document.getElementById('staff-contacts-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Đang tải tin nhắn...</td></tr>';

  try {
    const res = await fetch('/api/contact-message');
    const data = await res.json();

    if (data.success) {
      if (data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Không có tin nhắn liên hệ mới.</td></tr>';
        return;
      }

      let html = '';
      data.data.forEach(msg => {
        const carName = msg.relatedCar ? msg.relatedCar.name : '—';
        const dateStr = new Date(msg.createdAt).toLocaleDateString('vi-VN');
        
        let actions = `
          <div class="action-btn-group">
            <button class="action-btn" onclick="updateContactStatus('${msg._id}', 'processing')" title="Nhận xử lý"><i class="fas fa-hourglass-half"></i></button>
            <button class="action-btn" onclick="updateContactStatus('${msg._id}', 'done')" title="Đã giải quyết"><i class="fas fa-check-double"></i></button>
          </div>
        `;

        html += `
          <tr>
            <td>${msg.fullName} <br><small>${msg.phone}</small> <br><small>${msg.email}</small></td>
            <td>${msg.subject || '—'}</td>
            <td>${msg.message}</td>
            <td>${carName}</td>
            <td><span class="badge-status ${msg.status}">${msg.status}</span></td>
            <td><input type="text" id="msgnote-${msg._id}" value="${msg.staffNote || ''}" style="width: 100%; background: #222; border: 1px solid #444; color: #fff; padding: 5px;"></td>
            <td>${actions}</td>
          </tr>
        `;
      });
      tbody.innerHTML = html;
    }
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #d90429;">Lỗi tải tin nhắn.</td></tr>';
  }
}

window.updateContactStatus = async function(msgId, status) {
  const note = document.getElementById(`msgnote-${msgId}`).value;
  try {
    const res = await fetch(`/api/contact-message/${msgId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, staffNote: note })
    });
    if (res.ok) {
      showToast('Cập nhật trạng thái liên hệ thành công!', 'success');
      fetchContacts();
    } else {
      showToast('Cập nhật thất bại.', 'error');
    }
  } catch (e) {
    showToast('Lỗi máy chủ.', 'error');
  }
};

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
