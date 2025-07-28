/**
 * Register Component Tests
 * 
 * Tests for the Register component, covering form validation,
 * user registration, and error handling.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

import Register from '../Register';

// Mock axios
jest.mock('axios');

// Mock navigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders registration form', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    
    // Check for title
    expect(screen.getByRole('heading', { name: /create an account/i })).toBeInTheDocument();
    
    // Check for form elements
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    
    // Check for sign in link
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });
  
  test('validates empty fields', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    
    // Get submit button
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    
    // Submit form without filling fields
    fireEvent.click(submitButton);
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      expect(screen.getByText(/confirm password is required/i)).toBeInTheDocument();
    });
    
    // Verify axios was not called
    expect(axios.post).not.toHaveBeenCalled();
  });
  
  test('validates password strength requirements', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    
    // Get input fields and submit button
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    
    // Fill with weak password
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'weak' } });
    
    // Submit form
    fireEvent.click(submitButton);
    
    // Check for password strength error
    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
    
    // Verify axios was not called
    expect(axios.post).not.toHaveBeenCalled();
  });
  
  test('validates passwords match', async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    
    // Get input fields and submit button
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    
    // Fill with mismatched passwords
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPass123!' } });
    
    // Submit form
    fireEvent.click(submitButton);
    
    // Check for password match error
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
    
    // Verify axios was not called
    expect(axios.post).not.toHaveBeenCalled();
  });
  
  test('successfully submits registration form', async () => {
    // Mock successful response
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Registration successful! Please check your email to verify your account.'
      }
    });
    
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    
    // Get input fields and submit button
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    
    // Fill form fields
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPass123!' } });
    
    // Submit form
    fireEvent.click(submitButton);
    
    // Verify API call
    expect(axios.post).toHaveBeenCalledWith('/api/auth/register', {
      name: 'Test User',
      email: 'test@example.com',
      password: 'StrongPass123!'
    });
    
    // Check for success message
    await waitFor(() => {
      expect(screen.getByText(/registration successful/i)).toBeInTheDocument();
    });
    
    // Check that navigation to login page happens after successful registration
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
  
  test('shows error message on registration failure', async () => {
    // Mock error response
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          success: false,
          message: 'Email already in use'
        },
        status: 400
      }
    });
    
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    
    // Get input fields and submit button
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    
    // Fill form fields
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPass123!' } });
    
    // Submit form
    fireEvent.click(submitButton);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/email already in use/i)).toBeInTheDocument();
    });
    
    // Check that navigation was not called
    expect(mockNavigate).not.toHaveBeenCalled();
  });
  
  test('toggles password visibility when clicking eye icon', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    
    // Get password input and visibility toggle buttons
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const toggleButtons = screen.getAllByRole('button', { name: /toggle password visibility/i });
    
    // Initial state should be password (hidden)
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    
    // Click first toggle button (for password)
    fireEvent.click(toggleButtons[0]);
    
    // Password should now be visible
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password'); // Confirm still hidden
    
    // Click second toggle button (for confirm password)
    fireEvent.click(toggleButtons[1]);
    
    // Both passwords should now be visible
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    
    // Click both again to hide
    fireEvent.click(toggleButtons[0]);
    fireEvent.click(toggleButtons[1]);
    
    // Both should be hidden again
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmPasswordInput).toHaveAttribute('type', 'password');
  });
  
  test('redirects to login page when clicking sign in link', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );
    
    // Get sign in link
    const signInLink = screen.getByText(/sign in/i);
    
    // Click link
    fireEvent.click(signInLink);
    
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
        <Register />
      </MemoryRouter>
    );
    
    // Get input fields and submit button
    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    
    // Fill form fields
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'StrongPass123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPass123!' } });
    
    // Submit form
    fireEvent.click(submitButton);
    
    // Check for loading indicator
    await waitFor(() => {
      expect(screen.getByText(/signing up/i) || screen.getByRole('progressbar')).toBeInTheDocument();
    });
    
    // Button should be disabled during loading
    expect(submitButton).toBeDisabled();
    
    // Resolve the promise to complete the test
    resolvePromise({
      data: {
        success: true,
        message: 'Registration successful! Please check your email to verify your account.'
      }
    });
    
    // Wait for loading state to clear
    await waitFor(() => {
      expect(screen.queryByText(/signing up/i)).not.toBeInTheDocument();
    });
  });
}); 