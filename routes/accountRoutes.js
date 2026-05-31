const express = require('express');
const router = express.Router();
const {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  lockAccount,
  unlockAccount,
  changeRole,
  deleteAccount
} = require('../controllers/accountController');
const { requireAuth, requireStaff, requireAdmin } = require('../middleware/roleMiddleware');

router.route('/')
  .get(requireAuth, requireStaff, getAccounts)
  .post(requireAuth, requireAdmin, createAccount);

router.route('/:id')
  .get(requireAuth, requireStaff, getAccount)
  .put(requireAuth, requireAdmin, updateAccount)
  .delete(requireAuth, requireAdmin, deleteAccount);

router.put('/:id/lock', requireAuth, requireAdmin, lockAccount);
router.put('/:id/unlock', requireAuth, requireAdmin, unlockAccount);
router.put('/:id/role', requireAuth, requireAdmin, changeRole);

module.exports = router;
