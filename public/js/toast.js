// Global Toast Notification Helper
function showToast(message, type = 'success') {
  // Ensure container exists
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  // Dynamic Icon
  let iconClass = 'fa-check-circle';
  if (type === 'error') iconClass = 'fa-times-circle';
  if (type === 'info') iconClass = 'fa-info-circle';
  if (type === 'warning') iconClass = 'fa-exclamation-triangle';

  toast.innerHTML = `
    <i class="fas ${iconClass}" style="color: inherit; font-size: 1.15rem;"></i>
    <div class="toast-message">${message}</div>
  `;

  container.appendChild(toast);

  // Trigger slide-in animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    // Remove element from DOM after transition finishes
    setTimeout(() => {
      toast.remove();
    }, 400);
  }, 4000);
}

// Global Confirmation Modal Helper
function showModal(title, bodyText, onConfirm) {
  // Ensure modal markup is loaded or inject dynamically
  let modal = document.getElementById('global-confirm-modal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'global-confirm-modal';
    modal.className = 'custom-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="global-modal-title">Xác Nhận</h3>
        </div>
        <div class="modal-body" id="global-modal-body">
          Bạn có chắc chắn muốn thực hiện hành động này?
        </div>
        <div class="modal-actions">
          <button class="btn-dark" id="global-modal-cancel" style="padding: 10px 20px; font-size: 0.8rem;">Hủy</button>
          <button class="btn-gold" id="global-modal-confirm" style="padding: 10px 20px; font-size: 0.8rem;">Đồng ý</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  // Set modal text content
  document.getElementById('global-modal-title').textContent = title;
  document.getElementById('global-modal-body').textContent = bodyText;

  // Bind event listeners
  const confirmBtn = document.getElementById('global-modal-confirm');
  const cancelBtn = document.getElementById('global-modal-cancel');

  const cleanup = () => {
    modal.classList.remove('show');
    // Clone nodes to clear previous event listeners cleanly
    const newConfirm = confirmBtn.cloneNode(true);
    const newCancel = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
  };

  confirmBtn.onclick = () => {
    cleanup();
    if (typeof onConfirm === 'function') onConfirm();
  };

  cancelBtn.onclick = () => {
    cleanup();
  };

  // Display modal
  modal.classList.add('show');
}

// Global Prompt Modal Helper
function showPromptModal(title, bodyText, placeholder, onConfirm) {
  let modal = document.getElementById('global-prompt-modal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'global-prompt-modal';
    modal.className = 'custom-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="global-prompt-title">Nhập Thông Tin</h3>
        </div>
        <div class="modal-body">
          <p id="global-prompt-body" style="margin-bottom: 15px; color: var(--color-silver, #ccc);"></p>
          <input type="text" id="global-prompt-input" class="form-control" style="width: 100%; padding: 10px; background: #222; border: 1px solid #444; color: #fff; border-radius: 4px;" required>
        </div>
        <div class="modal-actions" style="margin-top: 20px;">
          <button class="btn-dark" id="global-prompt-cancel" style="padding: 10px 20px; font-size: 0.8rem; cursor: pointer;">Hủy</button>
          <button class="btn-gold" id="global-prompt-confirm" style="padding: 10px 20px; font-size: 0.8rem; cursor: pointer;">Đồng ý</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  document.getElementById('global-prompt-title').textContent = title;
  document.getElementById('global-prompt-body').textContent = bodyText;
  const inputEl = document.getElementById('global-prompt-input');
  inputEl.placeholder = placeholder || '';
  inputEl.value = '';

  const confirmBtn = document.getElementById('global-prompt-confirm');
  const cancelBtn = document.getElementById('global-prompt-cancel');

  const cleanup = () => {
    modal.classList.remove('show');
    const newConfirm = confirmBtn.cloneNode(true);
    const newCancel = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
  };

  confirmBtn.onclick = () => {
    const val = inputEl.value.trim();
    if (!val) {
      showToast('Vui lòng điền thông tin hợp lệ!', 'error');
      return;
    }
    cleanup();
    if (typeof onConfirm === 'function') onConfirm(val);
  };

  cancelBtn.onclick = () => {
    cleanup();
  };

  modal.classList.add('show');
}
