// src/app/auth/__tests__/page.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react'; // Import act
import AuthPage from '../page';
import * as authApi from '@/lib/supabase/auth'; // Import module to mock
import { supabase } from '@/lib/supabase/auth'; // Import supabase mock directly
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(), // Mock refresh if used
  }),
  useSearchParams: () => ({
    get: jest.fn(), // Mock get if used
  }),
}));

// Mock Supabase auth functions
jest.mock('@/lib/supabase/auth', () => ({
  handleSignIn: jest.fn(),
  handleSignUp: jest.fn(),
  handleGoogleSignIn: jest.fn(),
  handleForgotPassword: jest.fn(),
  handleSignOut: jest.fn(),
  getCurrentUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
  getUserProfile: jest.fn().mockResolvedValue({ data: null, error: null }),
  getUserRole: jest.fn().mockReturnValue(null),
  // Mock supabase client directly if AuthProvider imports it for getSession/onAuthStateChange
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    }
  }
}));

// Type assertion for mocks
const mockHandleSignIn = authApi.handleSignIn as jest.Mock;
const mockHandleSignUp = authApi.handleSignUp as jest.Mock;
const mockHandleGoogleSignIn = authApi.handleGoogleSignIn as jest.Mock;
const mockHandleForgotPassword = authApi.handleForgotPassword as jest.Mock;
const mockGetCurrentUser = authApi.getCurrentUser as jest.Mock;

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}));

// Helper to render with AuthProvider
const renderWithAuthProvider = async (ui: React.ReactElement) => {
    let result: ReturnType<typeof render>;
    // Wrap render in act to wait for initial useEffect updates in AuthProvider
    await act(async () => {
      result = render(<AuthProvider>{ui}</AuthProvider>);
    });
    // Wait for loading to potentially finish (optional, depends on AuthProvider implementation)
    // await waitFor(() => expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()); // Example
    // @ts-ignore
    return result;
};


describe('AuthPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockHandleSignIn.mockClear();
    mockHandleSignUp.mockClear();
    mockHandleGoogleSignIn.mockClear();
    mockHandleForgotPassword.mockClear();
    mockGetCurrentUser.mockClear();
    jest.clearAllMocks(); // Clears call counts etc. for all mocks

    (supabase.auth.getSession as jest.Mock).mockResolvedValue({ data: { session: null }, error: null });
    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
    });
    });
    (authApi.getCurrentUser as jest.Mock).mockResolvedValue({ data: { user: null }, error: null });

  test('renders login form by default', async () => {
    await renderWithAuthProvider(<AuthPage />);
    // Check for elements specific to the login form
    expect(screen.getByRole('heading', { name: /masuk ke hiring platform/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/alamat email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/kata sandi/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Masuk$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /masuk dengan google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /daftar menggunakan email/i })).toBeInTheDocument();
  });


  test('shows error message on failed login', async () => {
    // Mock failed login attempt - use the original error message from Supabase
    const originalErrorMessage = 'Invalid login credentials';
    // The user-friendly message that the component should display
    const expectedUserMessage = 'Email atau kata sandi salah'; // PERBAIKAN: Sesuaikan pesan ini jika berbeda
    mockHandleSignIn.mockResolvedValueOnce({ data: null, error: { message: originalErrorMessage } });

    await renderWithAuthProvider(<AuthPage />);

    const emailInput = screen.getByLabelText(/alamat email/i);
    const passwordInput = screen.getByLabelText(/kata sandi/i);
    const loginButton = screen.getByRole('button', { name: /^Masuk$/i });

    // Use act for state updates caused by user events
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(loginButton);
    });

    // Wait for the error toast to appear
    await waitFor(() => {
      expect(mockHandleSignIn).toHaveBeenCalledWith({ email: 'wrong@example.com', password: 'wrongpassword' });
      // PERBAIKAN: Harapkan pesan error yang ditampilkan ke pengguna, BUKAN pesan asli
      expect(require('react-hot-toast').toast.error).toHaveBeenCalledWith(expectedUserMessage);
    });
  });
});