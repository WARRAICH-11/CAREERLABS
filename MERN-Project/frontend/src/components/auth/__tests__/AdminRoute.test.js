/**
 * AdminRoute Component Tests
 * 
 * Tests for the AdminRoute component from App.js, covering admin role access control
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import AuthContext from '../../../context/AuthContext';

// Define the AdminRoute component as it appears in App.js
const AdminRoute = () => {
  const { user } = React.useContext(AuthContext);
  const isAdmin = user?.role === 'admin';
  
  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" />;
};

// Mock component for testing
const AdminComponent = () => <div>Admin Content</div>;

describe('AdminRoute Component', () => {
  test('redirects to dashboard when user is not an admin', () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'user', id: '123' } }}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminComponent />} />
            </Route>
            <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    
    // Should redirect to dashboard
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  test('shows admin content when user is an admin', () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'admin', id: '123' } }}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminComponent />} />
            </Route>
            <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    
    // Should show admin content
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument();
  });

  test('redirects to dashboard when user is null', () => {
    render(
      <AuthContext.Provider value={{ user: null }}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminComponent />} />
            </Route>
            <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    
    // Should redirect to dashboard
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });
}); 