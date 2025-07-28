import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Button, Form, InputGroup, Pagination, Spinner, Alert, Modal } from 'react-bootstrap';
import { FaSearch, FaEdit, FaTrash, FaUserShield } from 'react-icons/fa';
import axios from 'axios';
import './Admin.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [search, setSearch] = useState('');
  const [roles, setRoles] = useState([]);
  
  // For role assignment modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [roleUpdateLoading, setRoleUpdateLoading] = useState(false);
  
  // For delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch users and roles when component mounts
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [page, search]);

  // Fetch users with search and pagination
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/admin/users', {
        params: {
          page,
          search,
          limit: 10
        }
      });
      
      setUsers(response.data.users);
      setTotalPages(response.data.pages);
      setTotalUsers(response.data.total);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching users');
      setLoading(false);
    }
  };

  // Fetch roles for dropdown
  const fetchRoles = async () => {
    try {
      const response = await axios.get('/api/admin/roles');
      setRoles(response.data);
    } catch (err) {
      console.error('Error fetching roles:', err);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page when search changes
  };

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Open role assignment modal
  const openRoleModal = (user) => {
    setSelectedUser(user);
    setSelectedRole(user.role?._id || '');
    setShowRoleModal(true);
  };

  // Handle role change
  const handleRoleChange = async () => {
    if (!selectedUser || !selectedRole) return;
    
    try {
      setRoleUpdateLoading(true);
      
      await axios.put(`/api/admin/users/${selectedUser._id}/role`, {
        roleId: selectedRole
      });
      
      // Update local user data
      const updatedUsers = users.map(user => {
        if (user._id === selectedUser._id) {
          const updatedRole = roles.find(role => role._id === selectedRole);
          return { ...user, role: updatedRole };
        }
        return user;
      });
      
      setUsers(updatedUsers);
      setShowRoleModal(false);
      setRoleUpdateLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating user role');
      setRoleUpdateLoading(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setDeleteLoading(true);
      
      await axios.delete(`/api/admin/users/${userToDelete._id}`);
      
      // Remove user from local data
      setUsers(users.filter(user => user._id !== userToDelete._id));
      setTotalUsers(totalUsers - 1);
      
      setShowDeleteModal(false);
      setDeleteLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting user');
      setDeleteLoading(false);
    }
  };

  // Generate pagination items
  const renderPagination = () => {
    const items = [];
    
    // First page
    items.push(
      <Pagination.Item 
        key="first" 
        onClick={() => handlePageChange(1)}
        disabled={page === 1}
      >
        &laquo;
      </Pagination.Item>
    );
    
    // Previous page
    items.push(
      <Pagination.Item 
        key="prev" 
        onClick={() => handlePageChange(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        &lsaquo;
      </Pagination.Item>
    );
    
    // Page numbers
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);
    
    for (let number = startPage; number <= endPage; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === page}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }
    
    // Next page
    items.push(
      <Pagination.Item
        key="next"
        onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
      >
        &rsaquo;
      </Pagination.Item>
    );
    
    // Last page
    items.push(
      <Pagination.Item
        key="last"
        onClick={() => handlePageChange(totalPages)}
        disabled={page === totalPages}
      >
        &raquo;
      </Pagination.Item>
    );
    
    return items;
  };

  return (
    <Container fluid className="admin-container">
      <div className="admin-header">
        <h1>User Management</h1>
        <p>Manage user accounts and permissions</p>
      </div>

      {error && (
        <Alert variant="danger" className="my-3" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {/* Search Bar */}
      <Row className="mb-4">
        <Col md={6}>
          <Form onSubmit={handleSearchSubmit} className="admin-search">
            <InputGroup>
              <Form.Control
                placeholder="Search by name or email"
                value={search}
                onChange={handleSearchChange}
              />
              <Button variant="primary" type="submit">
                <FaSearch />
              </Button>
            </InputGroup>
          </Form>
        </Col>
        <Col md={6} className="text-end align-self-center">
          <p className="mb-0">Total Users: {totalUsers}</p>
        </Col>
      </Row>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading users...</p>
        </div>
      ) : (
        <>
          <div className="table-container">
            <Table striped bordered hover responsive className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className="role-badge">
                          {user.role?.name || 'No Role'}
                        </span>
                      </td>
                      <td>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="table-actions">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => openRoleModal(user)}
                            title="Change Role"
                          >
                            <FaUserShield />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => openDeleteModal(user)}
                            title="Delete User"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="admin-pagination">
              <Pagination>{renderPagination()}</Pagination>
            </div>
          )}
        </>
      )}

      {/* Role Assignment Modal */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Change User Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <>
              <p>
                <strong>User:</strong> {selectedUser.name} ({selectedUser.email})
              </p>
              <Form.Group>
                <Form.Label>Select Role</Form.Label>
                <Form.Select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                >
                  <option value="">No Role</option>
                  {roles.map(role => (
                    <option key={role._id} value={role._id}>
                      {role.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleRoleChange}
            disabled={roleUpdateLoading}
          >
            {roleUpdateLoading ? 'Updating...' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {userToDelete && (
            <p>
              Are you sure you want to delete the user <strong>{userToDelete.name}</strong> ({userToDelete.email})?
              This action cannot be undone.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteUser}
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete User'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserManagement; 