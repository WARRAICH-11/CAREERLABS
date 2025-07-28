/**
 * ResetPassword Component Tests
 * 
 * Tests for the ResetPassword component, covering form validation,
 * password reset submission, and error handling.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';

import ResetPassword from '../ResetPassword';

// Mock axios
jest.mock('axios');

describe('ResetPassword Component', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });
  
  const renderResetPasswordComponent = (token = 'valid-reset-token') => {
    return render(
      <MemoryRouter initialEntries={[`/reset-password/${token}`]}>
        <Routes>
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Routes>
      </MemoryRouter>
    );
  };
  
  test('renders reset password form', () => {
    renderResetPasswordComponent();
    
    // Check for title
    expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
    
    // Check for form elements
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });
  
  test('validates empty password fields', async () => {
    renderResetPasswordComponent();
    
    // Get submit button
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    // Submit form without filling password fields
    fireEvent.click(submitButton);
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/new password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/confirm password is required/i)).toBeInTheDocument();
    });
    
    // Verify axios was not called
    expect(axios.post).not.toHaveBeenCalled();
  });
  
  test('validates password strength', async () => {
    renderResetPasswordComponent();
    
    // Get password input and submit button
    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    // Fill weak password
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    fireEvent.change(confirmInput, { target: { value: 'weak' } });
    
    // Submit form
    fireEvent.click(submitButton);
    
    // Check for validation error about password strength
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
    
    // Verify axios was not called
    expect(axios.post).not.toHaveBeenCalled();
  });
  
  test('validates password matching', async () => {
    renderResetPasswordComponent();
    
    // Get password input fields and submit button
    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    // Fill with non-matching passwords
    fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
    fireEvent.change(confirmInput, { target: { value: 'DifferentPassword123!' } });
    
    // Submit form
    fireEvent.click(submitButton);
    
    // Check for validation error about password matching
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
    
    // Verify axios was not called
    expect(axios.post).not.toHaveBeenCalled();
  });
  
  test('submits form with valid passwords and shows success message', async () => {
    // Mock successful response
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Password has been reset successfully'
      }
    });
    
    renderResetPasswordComponent('valid-token');
    
    // Get password input fields and submit button
    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    // Fill with matching strong passwords
    fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongPassword123!' } });
    
    // Submit form
    fireEvent.click(submitButton);
    
    // Verify API call
    expect(axios.post).toHaveBeenCalledWith('/api/auth/reset-password', {
      token: 'valid-token',
      password: 'StrongPassword123!'
    });
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByText(/password has been reset successfully/i)).toBeInTheDocument();
    });
    
    // Check for login link after success
    await waitFor(() => {
      expect(screen.getByText(/proceed to login/i)).toBeInTheDocument();
    });
  });
  
  test('shows error message on submission failure', async () => {
    // Mock error response
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          success: false,
          message: 'Reset token is invalid or has expired'
        },
        status: 400
      }
    });
    
    renderResetPasswordComponent('invalid-token');
    
    // Get password input fields and submit button
    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    // Fill with matching strong passwords
    fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongPassword123!' } });
    
    // Submit form
    fireEvent.click(submitButton);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/reset token is invalid or has expired/i)).toBeInTheDocument();
    });
    
    // Button should still be enabled
    expect(submitButton).toBeEnabled();
  });
  
  test('toggles password visibility when clicking eye icon', () => {
    renderResetPasswordComponent();
    
    // Get password input and visibility toggle button
    const passwordInput = screen.getByLabelText(/new password/i);
    const visibilityToggle = screen.getAllByRole('button', { name: /toggle password visibility/i })[0];
    
    // Initial state should be password (hidden)
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle button
    fireEvent.click(visibilityToggle);
    
    // Password should now be visible
    expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click again to hide
    fireEvent.click(visibilityToggle);
    
    // Password should be hidden again
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
  
  test('shows loading state during submission', async () => {
    // Create a delayed promise to simulate loading
    let resolvePromise;
    const delayedPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    // Mock response with delay
    axios.post.mockImplementationOnce(() => delayedPromise);
    
    renderResetPasswordComponent();
    
    // Get password input fields and submit button
    const passwordInput = screen.getByLabelText(/new password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    // Fill with matching strong passwords
    fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
    fireEvent.change(confirmInput, { target: { value: 'StrongPassword123!' } });
    
    // Submit form
    fireEvent.click(submitButton);
    
    // Check for loading indicator
    await waitFor(() => {
      expect(screen.getByText(/resetting/i) || screen.getByRole('progressbar')).toBeInTheDocument();
    });
    
    // Button should be disabled during loading
    expect(submitButton).toBeDisabled();
    
    // Resolve the promise to complete the test
    resolvePromise({
      data: {
        success: true,
        message: 'Password has been reset successfully'
      }
    });
    
    // Wait for loading state to clear
    await waitFor(() => {
      expect(screen.queryByText(/resetting/i)).not.toBeInTheDocument();
    });
  });
}); 