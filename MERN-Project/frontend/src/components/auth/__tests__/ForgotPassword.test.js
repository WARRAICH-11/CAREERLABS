/**
 * ForgotPassword Component Tests
 * 
 * Tests for the ForgotPassword component, covering form validation, 
 * password reset request submission, and error handling.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

import ForgotPassword from '../ForgotPassword';

// Mock axios
jest.mock('axios');

// Mock navigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('ForgotPassword Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders forgot password form', () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );
    
    // Check for title
    expect(screen.getByRole('heading', { name: /forgot password/i })).toBeInTheDocument();
    
    // Check for form elements
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
    
    // Check for back to login link
    expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });
  
  test('validates empty email field', async () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );
    
    // Get submit button
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    // Submit form without filling email
    fireEvent.click(submitButton);
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });
    
    // Verify axios was not called
    expect(axios.post).not.toHaveBeenCalled();
  });
  
  test('validates email format', async () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );
    
    // Get input field and submit button
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    // Fill with invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    // Submit form
    fireEvent.click(submitButton);
    
    // Check for email format error
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
    
    // Verify axios was not called
    expect(axios.post).not.toHaveBeenCalled();
  });
  
  test('successfully submits reset password request', async () => {
    // Mock successful response
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Password reset link sent to your email'
      }
    });
    
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );
    
    // Get input field and submit button
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    // Fill email field
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    // Submit form
    fireEvent.click(submitButton);
    
    // Verify API call
    expect(axios.post).toHaveBeenCalledWith('/api/auth/forgot-password', {
      email: 'test@example.com'
    });
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByText(/password reset link sent to your email/i)).toBeInTheDocument();
    });
  });
  
  test('shows error message on reset password failure', async () => {
    // Mock error response
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          success: false,
          message: 'Email not found in our records'
        },
        status: 404
      }
    });
    
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );
    
    // Get input field and submit button
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    // Fill email field
    fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } });
    
    // Submit form
    fireEvent.click(submitButton);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/email not found in our records/i)).toBeInTheDocument();
    });
  });
  
  test('redirects to login page when clicking back to login link', () => {
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );
    
    // Get back to login link
    const loginLink = screen.getByText(/back to login/i);
    
    // Click link
    fireEvent.click(loginLink);
    
    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
  
  test('shows loading state during form submission', async () => {
    // Create a delayed promise to simulate loading
    let resolvePromise;
    const delayedPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    // Mock response with delay
    axios.post.mockImplementationOnce(() => delayedPromise);
    
    render(
      <MemoryRouter>
        <ForgotPassword />
      </MemoryRouter>
    );
    
    // Get input field and submit button
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    // Fill email field
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    // Submit form
    fireEvent.click(submitButton);
    
    // Check for loading indicator
    await waitFor(() => {
      expect(screen.getByText(/sending/i) || screen.getByRole('progressbar')).toBeInTheDocument();
    });
    
    // Button should be disabled during loading
    expect(submitButton).toBeDisabled();
    
    // Resolve the promise to complete the test
    resolvePromise({
      data: {
        success: true,
        message: 'Password reset link sent to your email'
      }
    });
    
    // Wait for loading state to clear
    await waitFor(() => {
      expect(screen.queryByText(/sending/i)).not.toBeInTheDocument();
    });
  });
}); 