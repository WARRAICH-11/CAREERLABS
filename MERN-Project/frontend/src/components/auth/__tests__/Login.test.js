/**
 * Login Component Tests
 * 
 * Tests for the Login component, covering form validation,
 * authentication, and error handling.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

import Login from '../Login';

// Mock axios
jest.mock('axios');

// Mock navigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock localStorage
const mockSetItem = jest.fn();
const originalLocalStorage = window.localStorage;
beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(),
      setItem: mockSetItem,
      removeItem: jest.fn(),
    },
    writable: true,
  });
});

afterEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: originalLocalStorage,
    writable: true,
  });
  jest.clearAllMocks();
});

describe('Login Component', () => {
  test('renders login form', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    
    // Check for title
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    
    // Check for form elements
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    
    // Check for links
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });
  
  test('validates empty fields', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    
    // Get submit button
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Submit form without filling fields
    fireEvent.click(submitButton);
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
    
    // Verify axios was not called
    expect(axios.post).not.toHaveBeenCalled();
  });
  
  test('validates invalid email format', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    
    // Get email input and submit button
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Fill with invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    
    // Submit form
    fireEvent.click(submitButton);
    
    // Check for validation error
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
    
    // Verify axios was not called
    expect(axios.post).not.toHaveBeenCalled();
  });
  
  test('successfully submits login form and redirects', async () => {
    // Mock successful response
    const mockUserData = {
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      token: 'fake-jwt-token',
    };
    
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        user: mockUserData,
      }
    });
    
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    
    // Get input fields and submit button
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Fill form fields
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    
    // Submit form
    fireEvent.click(submitButton);
    
    // Verify API call
    expect(axios.post).toHaveBeenCalledWith('/api/auth/login', {
      email: 'test@example.com',
      password: 'Password123!'
    });
    
    // Check that user data was stored in localStorage
    await waitFor(() => {
      expect(mockSetItem).toHaveBeenCalledWith('user', JSON.stringify(mockUserData));
    });
    
    // Check that user was redirected
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
  
  test('shows error message on login failure', async () => {
    // Mock error response
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          success: false,
          message: 'Invalid email or password'
        },
        status: 401
      }
    });
    
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    
    // Get input fields and submit button
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Fill form fields
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'WrongPassword' } });
    
    // Submit form
    fireEvent.click(submitButton);
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
    
    // Check that navigation was not called
    expect(mockNavigate).not.toHaveBeenCalled();
  });
  
  test('toggles password visibility when clicking eye icon', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    
    // Get password input and visibility toggle button
    const passwordInput = screen.getByLabelText(/password/i);
    const visibilityToggle = screen.getByRole('button', { name: /toggle password visibility/i });
    
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
  
  test('redirects to forgot password page when clicking forgot password link', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    
    // Get forgot password link
    const forgotPasswordLink = screen.getByText(/forgot password/i);
    
    // Click link
    fireEvent.click(forgotPasswordLink);
    
    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });
  
  test('redirects to register page when clicking sign up link', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    
    // Get sign up link
    const signUpLink = screen.getByText(/sign up/i);
    
    // Click link
    fireEvent.click(signUpLink);
    
    // Verify navigation
    expect(mockNavigate).toHaveBeenCalledWith('/register');
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
        <Login />
      </MemoryRouter>
    );
    
    // Get input fields and submit button
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Fill form fields
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });
    
    // Submit form
    fireEvent.click(submitButton);
    
    // Check for loading indicator
    await waitFor(() => {
      expect(screen.getByText(/signing in/i) || screen.getByRole('progressbar')).toBeInTheDocument();
    });
    
    // Button should be disabled during loading
    expect(submitButton).toBeDisabled();
    
    // Resolve the promise to complete the test
    resolvePromise({
      data: {
        success: true,
        user: {
          name: 'Test User',
          email: 'test@example.com',
          role: 'user',
          token: 'fake-jwt-token',
        }
      }
    });
    
    // Wait for loading state to clear
    await waitFor(() => {
      expect(screen.queryByText(/signing in/i)).not.toBeInTheDocument();
    });
  });
}); 