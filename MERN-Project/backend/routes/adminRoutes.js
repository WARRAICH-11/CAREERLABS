const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { admin, permit } = require('../middleware/adminMiddleware');
const {
  getDashboardStats,
  getUserAnalytics,
  getJobAnalytics,
  getUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
} = require('../controllers/adminController');

// Dashboard and Analytics routes
router.get('/dashboard', protect, admin, getDashboardStats);
router.get('/analytics/users', protect, permit('analytics', 'view'), getUserAnalytics);
router.get('/analytics/jobs', protect, permit('analytics', 'view'), getJobAnalytics);

// User management routes
router.route('/users')
  .get(protect, permit('users', 'read'), getUsers);

router.route('/users/:id')
  .get(protect, permit('users', 'read'), getUserById)
  .delete(protect, permit('users', 'delete'), deleteUser);

router.put('/users/:id/role', protect, permit('users', 'update'), updateUserRole);

// Role management routes
router.route('/roles')
  .get(protect, permit('admin', 'manageRoles'), getRoles)
  .post(protect, permit('admin', 'manageRoles'), createRole);

router.route('/roles/:id')
  .get(protect, permit('admin', 'manageRoles'), getRoleById)
  .put(protect, permit('admin', 'manageRoles'), updateRole)
  .delete(protect, permit('admin', 'manageRoles'), deleteRole);

module.exports = router; 