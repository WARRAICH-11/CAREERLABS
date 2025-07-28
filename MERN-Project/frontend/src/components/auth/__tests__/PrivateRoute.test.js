/**
 * PrivateRoute Component Tests
 * 
 * Tests for the PrivateRoute component, covering authentication redirect behavior
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AuthContext from '../../../context/AuthContext';
import PrivateRoute from '../../PrivateRoute';

// Mock component for testing
const ProtectedComponent = () => <div>Protected Content</div>;

describe('PrivateRoute Component', () => {
  test('redirects to login when not authenticated', () => {
    render(
      <AuthContext.Provider value={{ isAuthenticated: false, loading: false }}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route element={<PrivateRoute />}>
              <Route path="/protected" element={<ProtectedComponent />} />
            </Route>
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    
    // Should redirect to login
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('shows protected content when authenticated', () => {
    render(
      <AuthContext.Provider value={{ isAuthenticated: true, loading: false }}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route element={<PrivateRoute />}>
              <Route path="/protected" element={<ProtectedComponent />} />
            </Route>
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    
    // Should show protected content
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  test('shows loading state when authentication is loading', () => {
    render(
      <AuthContext.Provider value={{ isAuthenticated: false, loading: true }}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route element={<PrivateRoute />}>
              <Route path="/protected" element={<ProtectedComponent />} />
            </Route>
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    
    // Should show loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
}); 