import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Form, Spinner, Alert, Modal, Card, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';
import './Admin.css';

const RoleManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // For role creation/editing modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {
      users: { read: false, create: false, update: false, delete: false },
      jobs: { read: false, create: false, update: false, delete: false, approve: false },
      resources: { read: false, create: false, update: false, delete: false },
      notifications: { read: false, create: false, update: false, delete: false, broadcast: false },
      analytics: { view: false, export: false },
      admin: { accessDashboard: false, manageRoles: false, manageSettings: false }
    },
    isActive: true
  });
  const [roleActionLoading, setRoleActionLoading] = useState(false);
  
  // For delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Fetch roles when component mounts
  useEffect(() => {
    fetchRoles();
  }, []);

  // Fetch all roles
  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/admin/roles');
      setRoles(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching roles');
      setLoading(false);
    }
  };

  // Open modal for creating a new role
  const openCreateModal = () => {
    setModalMode('create');
    setFormData({
      name: '',
      description: '',
      permissions: {
        users: { read: false, create: false, update: false, delete: false },
        jobs: { read: false, create: false, update: false, delete: false, approve: false },
        resources: { read: false, create: false, update: false, delete: false },
        notifications: { read: false, create: false, update: false, delete: false, broadcast: false },
        analytics: { view: false, export: false },
        admin: { accessDashboard: false, manageRoles: false, manageSettings: false }
      },
      isActive: true
    });
    setSelectedRole(null);
    setShowRoleModal(true);
  };

  // Open modal for editing an existing role
  const openEditModal = (role) => {
    setModalMode('edit');
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: { ...role.permissions },
      isActive: role.isActive
    });
    setSelectedRole(role);
    setShowRoleModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle permission checkbox changes
  const handlePermissionChange = (module, action) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [action]: !prev.permissions[module][action]
        }
      }
    }));
  };

  // Handle role creation or update
  const handleSaveRole = async () => {
    try {
      setRoleActionLoading(true);
      
      if (modalMode === 'create') {
        // Create new role
        const response = await axios.post('/api/admin/roles', formData);
        setRoles([...roles, response.data]);
      } else {
        // Update existing role
        const response = await axios.put(`/api/admin/roles/${selectedRole._id}`, formData);
        setRoles(roles.map(role => 
          role._id === selectedRole._id ? response.data : role
        ));
      }
      
      setShowRoleModal(false);
      setRoleActionLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || `Error ${modalMode === 'create' ? 'creating' : 'updating'} role`);
      setRoleActionLoading(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (role) => {
    setRoleToDelete(role);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  // Handle role deletion
  const handleDeleteRole = async () => {
    if (!roleToDelete) return;
    
    try {
      setDeleteLoading(true);
      setDeleteError(null);
      
      await axios.delete(`/api/admin/roles/${roleToDelete._id}`);
      
      // Remove role from local data
      setRoles(roles.filter(role => role._id !== roleToDelete._id));
      
      setShowDeleteModal(false);
      setDeleteLoading(false);
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Error deleting role');
      setDeleteLoading(false);
    }
  };

  // Render permission checkboxes for a specific module
  const renderPermissionGroup = (module, permissions, label) => {
    return (
      <div className="permission-group">
        <h6 className="permission-group-title">{label}</h6>
        <div className="permission-checkboxes">
          {Object.keys(permissions).map(action => (
            <Form.Check 
              key={`${module}-${action}`}
              type="checkbox"
              id={`${module}-${action}`}
              label={action.charAt(0).toUpperCase() + action.slice(1)}
              checked={formData.permissions[module][action]}
              onChange={() => handlePermissionChange(module, action)}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <Container fluid className="admin-container">
      <div className="admin-header">
        <h1>Role Management</h1>
        <Button variant="primary" onClick={openCreateModal}>
          <FaPlus className="me-2" /> Create New Role
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="my-3" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {/* Roles Table */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading roles...</p>
        </div>
      ) : (
        <div className="table-container">
          <Table striped bordered hover responsive className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    No roles found
                  </td>
                </tr>
              ) : (
                roles.map(role => (
                  <tr key={role._id}>
                    <td>{role.name}</td>
                    <td>{role.description || '-'}</td>
                    <td>
                      <span className={`status-badge ${role.isActive ? 'active' : 'inactive'}`}>
                        {role.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {new Date(role.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="table-actions">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => openEditModal(role)}
                          title="Edit Role"
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => openDeleteModal(role)}
                          title="Delete Role"
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
      )}

      {/* Role Create/Edit Modal */}
      <Modal 
        show={showRoleModal} 
        onHide={() => setShowRoleModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' ? 'Create New Role' : 'Edit Role'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form className="admin-form">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Role Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="isActive"
                    value={formData.isActive.toString()}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </Form.Group>
            
            <div className="permissions-section">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Permissions</h5>
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip>
                      Define what actions this role can perform in different areas of the system
                    </Tooltip>
                  }
                >
                  <Button variant="link" className="p-0">
                    <FaInfoCircle />
                  </Button>
                </OverlayTrigger>
              </div>
              
              <Row>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Body>
                      {renderPermissionGroup('users', formData.permissions.users, 'User Management')}
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Body>
                      {renderPermissionGroup('jobs', formData.permissions.jobs, 'Job Management')}
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Body>
                      {renderPermissionGroup('resources', formData.permissions.resources, 'Resource Management')}
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Body>
                      {renderPermissionGroup('notifications', formData.permissions.notifications, 'Notification Management')}
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Body>
                      {renderPermissionGroup('analytics', formData.permissions.analytics, 'Analytics')}
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="mb-3">
                    <Card.Body>
                      {renderPermissionGroup('admin', formData.permissions.admin, 'Admin Access')}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveRole}
            disabled={roleActionLoading || !formData.name}
          >
            {roleActionLoading ? 'Saving...' : 'Save Role'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {roleToDelete && (
            <>
              <p>
                Are you sure you want to delete the role <strong>{roleToDelete.name}</strong>?
                This action cannot be undone.
              </p>
              <p className="text-warning">
                <strong>Warning:</strong> If users are assigned to this role, they will lose these permissions.
              </p>
              
              {deleteError && (
                <Alert variant="danger" className="mt-3">
                  {deleteError}
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteRole}
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Role'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default RoleManagement; 