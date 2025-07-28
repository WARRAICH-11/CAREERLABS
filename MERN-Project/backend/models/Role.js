const mongoose = require('mongoose');

const roleSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    permissions: {
      users: {
        read: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false }
      },
      jobs: {
        read: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        approve: { type: Boolean, default: false }
      },
      resources: {
        read: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false }
      },
      sessions: {
        read: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false }
      },
      notifications: {
        read: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
        broadcast: { type: Boolean, default: false }
      },
      analytics: {
        view: { type: Boolean, default: false },
        export: { type: Boolean, default: false }
      },
      admin: {
        accessDashboard: { type: Boolean, default: false },
        manageRoles: { type: Boolean, default: false },
        manageSettings: { type: Boolean, default: false }
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Method to check if a role has a specific permission
roleSchema.methods.hasPermission = function(module, action) {
  if (!this.permissions || !this.permissions[module]) {
    return false;
  }
  
  return this.permissions[module][action] === true;
};

// Static method to create default roles if they don't exist
roleSchema.statics.createDefaultRoles = async function() {
  // Super Admin - has all permissions
  const superAdmin = {
    name: 'Super Admin',
    description: 'Has complete access to all features',
    permissions: {
      users: { read: true, create: true, update: true, delete: true },
      jobs: { read: true, create: true, update: true, delete: true, approve: true },
      resources: { read: true, create: true, update: true, delete: true },
      sessions: { read: true, create: true, update: true, delete: true },
      notifications: { read: true, create: true, update: true, delete: true, broadcast: true },
      analytics: { view: true, export: true },
      admin: { accessDashboard: true, manageRoles: true, manageSettings: true }
    }
  };
  
  // Admin - has most permissions except role management
  const admin = {
    name: 'Admin',
    description: 'Has access to most features except role management',
    permissions: {
      users: { read: true, create: true, update: true, delete: false },
      jobs: { read: true, create: true, update: true, delete: true, approve: true },
      resources: { read: true, create: true, update: true, delete: true },
      sessions: { read: true, create: false, update: true, delete: false },
      notifications: { read: true, create: true, update: true, delete: true, broadcast: true },
      analytics: { view: true, export: true },
      admin: { accessDashboard: true, manageRoles: false, manageSettings: true }
    }
  };
  
  // Content Manager - manages content but not users or settings
  const contentManager = {
    name: 'Content Manager',
    description: 'Manages content such as jobs and resources',
    permissions: {
      users: { read: true, create: false, update: false, delete: false },
      jobs: { read: true, create: true, update: true, delete: false, approve: true },
      resources: { read: true, create: true, update: true, delete: false },
      sessions: { read: true, create: false, update: false, delete: false },
      notifications: { read: true, create: true, update: true, delete: false, broadcast: false },
      analytics: { view: true, export: false },
      admin: { accessDashboard: true, manageRoles: false, manageSettings: false }
    }
  };
  
  // User Manager - manages users only
  const userManager = {
    name: 'User Manager',
    description: 'Manages user accounts and permissions',
    permissions: {
      users: { read: true, create: true, update: true, delete: false },
      jobs: { read: true, create: false, update: false, delete: false, approve: false },
      resources: { read: true, create: false, update: false, delete: false },
      sessions: { read: true, create: false, update: false, delete: false },
      notifications: { read: true, create: true, update: false, delete: false, broadcast: false },
      analytics: { view: true, export: false },
      admin: { accessDashboard: true, manageRoles: false, manageSettings: false }
    }
  };
  
  const defaultRoles = [superAdmin, admin, contentManager, userManager];
  
  for (const role of defaultRoles) {
    await this.findOneAndUpdate(
      { name: role.name },
      role,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  
  console.log('Default roles created/updated successfully');
};

module.exports = mongoose.model('Role', roleSchema); 