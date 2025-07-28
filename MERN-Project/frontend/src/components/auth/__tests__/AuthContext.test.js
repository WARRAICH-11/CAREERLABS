/**
 * AuthContext Tests
 * 
 * Tests for the AuthContext component, covering authentication state management,
 * user login, registration, logout, and profile update functionality.
 */

import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock axios
jest.mock('axios');

// Create a test component that uses the AuthContext
const TestComponent = () => {
  const { 
    user, 
    loading, 
    error, 
    login, 
    register, 
    logout, 
    updateProfile, 
    requestPasswordReset, 
    resetPassword,
    clearError
  } = useAuth();
  
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="error">{error || 'no error'}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'no user'}</div>
      <button onClick={() => login({ email: 'test@example.com', password: 'Password123!' })}>Login</button>
      <button onClick={() => register({ name: 'Test User', email: 'test@example.com', password: 'Password123!' })}>Register</button>
      <button onClick={logout}>Logout</button>
      <button onClick={() => updateProfile({ name: 'Updated User' })}>Update Profile</button>
      <button onClick={() => requestPasswordReset('test@example.com')}>Request Reset</button>
      <button onClick={() => resetPassword('token123', 'NewPassword123!')}>Reset Password</button>
      <button onClick={clearError}>Clear Error</button>
    </div>
  );
};

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
  });

  test('provides initial authentication state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('loading')).toHaveTextContent('true');
    expect(screen.getByTestId('user')).toHaveTextContent('no user');
    expect(screen.getByTestId('error')).toHaveTextContent('no error');
  });
  
  test('loads user from localStorage on mount', async () => {
    const mockUser = { name: 'Test User', email: 'test@example.com', token: 'token123' };
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(mockUser));
    
    axios.get.mockResolvedValueOnce({
      data: { success: true, user: mockUser }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
    });
    
    expect(axios.get).toHaveBeenCalledWith('/api/auth/me');
    expect(axios.defaults.headers.common['Authorization']).toBe(`Bearer ${mockUser.token}`);
  });
  
  test('handles login success', async () => {
    const mockUser = { name: 'Test User', email: 'test@example.com', token: 'token123' };
    
    axios.post.mockResolvedValueOnce({
      data: { success: true, user: mockUser }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    
    // Click login button
    const loginButton = screen.getByText('Login');
    await act(async () => {
      loginButton.click();
    });
    
    // Verify API call
    expect(axios.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'test@example.com',
      password: 'Password123!'
    });
    
    // Check user state and localStorage
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
      expect(axios.defaults.headers.common['Authorization']).toBe(`Bearer ${mockUser.token}`);
    });
  });
  
  test('handles login failure', async () => {
    const errorMessage = 'Invalid credentials';
    
    axios.post.mockRejectedValueOnce({
      response: {
        data: { success: false, message: errorMessage }
      }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    
    // Click login button
    const loginButton = screen.getByText('Login');
    await act(async () => {
      loginButton.click();
    });
    
    // Check error state
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
      expect(screen.getByTestId('user')).toHaveTextContent('no user');
    });
  });
  
  test('handles registration success', async () => {
    const mockUser = { name: 'Test User', email: 'test@example.com', token: 'token123' };
    
    axios.post.mockResolvedValueOnce({
      data: { success: true, user: mockUser }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    
    // Click register button
    const registerButton = screen.getByText('Register');
    await act(async () => {
      registerButton.click();
    });
    
    // Verify API call
    expect(axios.post).toHaveBeenCalledWith('/api/auth/register', {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!'
    });
    
    // Check user state and localStorage
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
    });
  });
  
  test('handles logout correctly', async () => {
    const mockUser = { name: 'Test User', email: 'test@example.com', token: 'token123' };
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(mockUser));
    
    axios.get.mockResolvedValueOnce({
      data: { success: true, user: mockUser }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for user to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
    });
    
    // Click logout button
    const logoutButton = screen.getByText('Logout');
    await act(async () => {
      logoutButton.click();
    });
    
    // Check user state and localStorage
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('no user');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(axios.defaults.headers.common['Authorization']).toBeUndefined();
    });
  });
  
  test('handles profile update success', async () => {
    const mockUser = { name: 'Test User', email: 'test@example.com', token: 'token123' };
    const updatedUser = { ...mockUser, name: 'Updated User' };
    
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify(mockUser));
    
    axios.get.mockResolvedValueOnce({
      data: { success: true, user: mockUser }
    });
    
    axios.put.mockResolvedValueOnce({
      data: { success: true, user: updatedUser }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for user to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(mockUser));
    });
    
    // Click update profile button
    const updateButton = screen.getByText('Update Profile');
    await act(async () => {
      updateButton.click();
    });
    
    // Verify API call
    expect(axios.put).toHaveBeenCalledWith('/api/auth/update', { name: 'Updated User' });
    
    // Check updated user state and localStorage
    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent(JSON.stringify(updatedUser));
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(updatedUser));
    });
  });
  
  test('handles password reset request success', async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: true, message: 'Reset email sent' }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    
    // Click request reset button
    const requestResetButton = screen.getByText('Request Reset');
    await act(async () => {
      requestResetButton.click();
    });
    
    // Verify API call
    expect(axios.post).toHaveBeenCalledWith('/api/auth/forgot-password', {
      email: 'test@example.com'
    });
    
    // No error should be present
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('no error');
    });
  });
  
  test('handles password reset success', async () => {
    axios.post.mockResolvedValueOnce({
      data: { success: true, message: 'Password reset successful' }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    
    // Click reset password button
    const resetPasswordButton = screen.getByText('Reset Password');
    await act(async () => {
      resetPasswordButton.click();
    });
    
    // Verify API call
    expect(axios.post).toHaveBeenCalledWith('/api/auth/reset-password', {
      token: 'token123',
      password: 'NewPassword123!'
    });
    
    // No error should be present
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('no error');
    });
  });
  
  test('clears error when clearError is called', async () => {
    // Set up an error state
    const errorMessage = 'Test error';
    axios.post.mockRejectedValueOnce({
      response: {
        data: { success: false, message: errorMessage }
      }
    });
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });
    
    // Click login button to trigger an error
    const loginButton = screen.getByText('Login');
    await act(async () => {
      loginButton.click();
    });
    
    // Check error state
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
    });
    
    // Click clear error button
    const clearErrorButton = screen.getByText('Clear Error');
    await act(async () => {
      clearErrorButton.click();
    });
    
    // Error should be cleared
    expect(screen.getByTestId('error')).toHaveTextContent('no error');
  });
}); 