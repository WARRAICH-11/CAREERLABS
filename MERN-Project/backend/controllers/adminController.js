const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Job = require('../models/Job');
const Role = require('../models/Role');
const File = require('../models/File');
const mongoose = require('mongoose');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/admin/dashboard
 * @access  Private/Admin
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  // Get count of total users
  const userCount = await User.countDocuments();
  
  // Get count of users registered in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const newUserCount = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo }
  });
  
  // Get count of jobs
  const jobCount = await Job.countDocuments();
  
  // Get count of active jobs
  const activeJobCount = await Job.countDocuments({
    status: 'active'
  });
  
  // Get count of files
  const fileCount = await File.countDocuments();
  
  // Get user roles distribution
  const userRolesDistribution = await User.aggregate([
    {
      $lookup: {
        from: 'roles',
        localField: 'role',
        foreignField: '_id',
        as: 'roleData'
      }
    },
    {
      $unwind: {
        path: '$roleData',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: '$roleData.name',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        role: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);
  
  // Dashboard statistics response
  const dashboardStats = {
    users: {
      total: userCount,
      newUsers: newUserCount,
      rolesDistribution: userRolesDistribution
    },
    jobs: {
      total: jobCount,
      active: activeJobCount
    },
    files: {
      total: fileCount
    }
  };
  
  res.json(dashboardStats);
});

/**
 * @desc    Get user analytics data
 * @route   GET /api/admin/analytics/users
 * @access  Private/Admin
 */
const getUserAnalytics = asyncHandler(async (req, res) => {
  // Get user registrations over time (last 12 months)
  const userRegistrationsOverTime = await User.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
        }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        '_id.year': 1,
        '_id.month': 1
      }
    },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        count: 1
      }
    }
  ]);
  
  // Get user activity by role
  const userActivityByRole = await User.aggregate([
    {
      $lookup: {
        from: 'roles',
        localField: 'role',
        foreignField: '_id',
        as: 'roleData'
      }
    },
    {
      $unwind: {
        path: '$roleData',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: '$roleData.name',
        lastActive: { $max: '$lastActive' },
        avgLoginCount: { $avg: '$loginCount' },
        totalUsers: { $sum: 1 }
      }
    },
    {
      $project: {
        role: '$_id',
        lastActive: 1,
        avgLoginCount: 1,
        totalUsers: 1,
        _id: 0
      }
    }
  ]);
  
  // Format and send response
  const formattedMonthlyData = userRegistrationsOverTime.map(item => {
    const date = new Date(item.year, item.month - 1);
    return {
      date: date.toISOString().substring(0, 7), // YYYY-MM format
      count: item.count
    };
  });
  
  res.json({
    registrationsOverTime: formattedMonthlyData,
    activityByRole: userActivityByRole
  });
});

/**
 * @desc    Get job analytics data
 * @route   GET /api/admin/analytics/jobs
 * @access  Private/Admin
 */
const getJobAnalytics = asyncHandler(async (req, res) => {
  // Get jobs created over time (last 12 months)
  const jobsCreatedOverTime = await Job.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
        }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: {
        '_id.year': 1,
        '_id.month': 1
      }
    },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        count: 1
      }
    }
  ]);
  
  // Get job statistics by status
  const jobsByStatus = await Job.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        status: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);
  
  // Get job statistics by category
  const jobsByCategory = await Job.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        category: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);
  
  // Format and send response
  const formattedMonthlyData = jobsCreatedOverTime.map(item => {
    const date = new Date(item.year, item.month - 1);
    return {
      date: date.toISOString().substring(0, 7), // YYYY-MM format
      count: item.count
    };
  });
  
  res.json({
    jobsCreatedOverTime: formattedMonthlyData,
    jobsByStatus,
    jobsByCategory
  });
});

/**
 * @desc    Get all users with pagination
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const skip = (page - 1) * limit;
  
  // Build search query
  const searchQuery = {};
  if (search) {
    searchQuery.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Get users with pagination
  const users = await User.find(searchQuery)
    .select('-password')
    .populate('role', 'name description')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  
  // Get total count for pagination
  const total = await User.countDocuments(searchQuery);
  
  res.json({
    users,
    page,
    pages: Math.ceil(total / limit),
    total
  });
});

/**
 * @desc    Get user details by ID
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select('-password')
    .populate('role', 'name description permissions');
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  res.json(user);
});

/**
 * @desc    Update user role
 * @route   PUT /api/admin/users/:id/role
 * @access  Private/Admin
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { roleId } = req.body;
  
  if (!roleId) {
    res.status(400);
    throw new Error('Role ID is required');
  }
  
  // Check if role exists
  const role = await Role.findById(roleId);
  if (!role) {
    res.status(404);
    throw new Error('Role not found');
  }
  
  // Update user's role
  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    { role: roleId },
    { new: true }
  ).select('-password').populate('role', 'name description');
  
  if (!updatedUser) {
    res.status(404);
    throw new Error('User not found');
  }
  
  res.json(updatedUser);
});

/**
 * @desc    Delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  await user.remove();
  
  res.json({ message: 'User removed' });
});

/**
 * @desc    Get all roles
 * @route   GET /api/admin/roles
 * @access  Private/Admin
 */
const getRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().sort({ name: 1 });
  res.json(roles);
});

/**
 * @desc    Get role by ID
 * @route   GET /api/admin/roles/:id
 * @access  Private/Admin
 */
const getRoleById = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  
  if (!role) {
    res.status(404);
    throw new Error('Role not found');
  }
  
  res.json(role);
});

/**
 * @desc    Create new role
 * @route   POST /api/admin/roles
 * @access  Private/Admin
 */
const createRole = asyncHandler(async (req, res) => {
  const { name, description, permissions } = req.body;
  
  if (!name || !permissions) {
    res.status(400);
    throw new Error('Please provide role name and permissions');
  }
  
  // Check if role with the same name already exists
  const roleExists = await Role.findOne({ name });
  
  if (roleExists) {
    res.status(400);
    throw new Error('Role with this name already exists');
  }
  
  // Create new role
  const role = await Role.create({
    name,
    description,
    permissions
  });
  
  res.status(201).json(role);
});

/**
 * @desc    Update role
 * @route   PUT /api/admin/roles/:id
 * @access  Private/Admin
 */
const updateRole = asyncHandler(async (req, res) => {
  const { name, description, permissions, isActive } = req.body;
  
  // Find role
  const role = await Role.findById(req.params.id);
  
  if (!role) {
    res.status(404);
    throw new Error('Role not found');
  }
  
  // Update role fields
  if (name) role.name = name;
  if (description !== undefined) role.description = description;
  if (permissions) role.permissions = permissions;
  if (isActive !== undefined) role.isActive = isActive;
  
  const updatedRole = await role.save();
  
  res.json(updatedRole);
});

/**
 * @desc    Delete role
 * @route   DELETE /api/admin/roles/:id
 * @access  Private/Admin
 */
const deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  
  if (!role) {
    res.status(404);
    throw new Error('Role not found');
  }
  
  // Check if any users are using this role
  const usersWithRole = await User.countDocuments({ role: role._id });
  
  if (usersWithRole > 0) {
    res.status(400);
    throw new Error(`Cannot delete role that is assigned to ${usersWithRole} users`);
  }
  
  await role.remove();
  
  res.json({ message: 'Role removed' });
});

module.exports = {
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
}; 