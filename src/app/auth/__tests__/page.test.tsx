// src/app/auth/__tests__/page.test.tsx
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthPage from '../page';
import { AuthProvider, useAuth } from '@/contexts/AuthContext'; // Import useAuth juga
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast'; // Impor toast

// --- Mocks (Pastikan Supabase mock detail) ---
const mockSignIn = jest.fn();
const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn((...args) => mockSignIn(...args)), // Pastikan mockSignIn dipanggil di sini
      // Mock fungsi lain jika diperlukan
    },
  },
}));

// Mock useAuth context (Pastikan state loading benar)
jest.mock('@/contexts/AuthContext', () => {
    const ActualAuthContext = jest.requireActual('@/contexts/AuthContext'); // Get actual context for provider
    return {
        useAuth: jest.fn(() => ({ // Mock the hook's return value
            user: null,
            role: null,
            loading: false, // Pastikan loading false agar komponen render
            showSplashScreen: false,
            splashRedirectTo: null,
            setShowSplashScreen: jest.fn(),
            setSplashRedirectTo: jest.fn(),
            logout: jest.fn(),
        })),
        AuthProvider: ActualAuthContext.AuthProvider, // Gunakan Provider asli
    };
});

// Mock toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));
// --- End Mocks ---

describe('AuthPage', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    // Reset supabase mock calls specifically
    (jest.requireMock('@/lib/supabase/client').supabase.auth.signInWithPassword as jest.Mock).mockClear();
    mockSignIn.mockClear(); // Reset mock function itself
    mockPush.mockClear();
    (toast.error as jest.Mock).mockClear();
    (toast.success as jest.Mock).mockClear();
     // Reset useAuth mock if needed between tests
    (useAuth as jest.Mock).mockImplementation(() => ({
        user: null, role: null, loading: false, /* ... rest */
        setShowSplashScreen: jest.fn(), setSplashRedirectTo: jest.fn(), logout: jest.fn(),
    }));
  });

  // ... (Test 1, 2, 3 tetap sama, pastikan pakai act)

  // Test 4: Menampilkan error dari Supabase saat login gagal
  test('shows error message on failed login', async () => {
    const errorMessage = 'Invalid login credentials';
    // Gunakan mock spesifik dari supabase.auth
    (jest.requireMock('@/lib/supabase/client').supabase.auth.signInWithPassword as jest.Mock)
        .mockResolvedValue({
            data: { user: null, session: null },
            error: { message: errorMessage, status: 400, name: 'AuthApiError' },
        });

    render(
      // AuthProvider sudah di-mock di atas
      <AuthPage />
    );

    // Tunggu elemen form muncul (jika ada potensi delay)
    const emailInput = await screen.findByLabelText(/alamat email/i);
    const passwordInput = await screen.findByLabelText(/kata sandi/i);
    const loginButton = await screen.findByRole('button', { name: /masuk/i });

    await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'WrongPassword123' } });
        fireEvent.click(loginButton);
    });

    // Tunggu mock dipanggil
    await waitFor(() => {
        // Cek mock spesifik
        expect(jest.requireMock('@/lib/supabase/client').supabase.auth.signInWithPassword).toHaveBeenCalledTimes(1);
    });
    // Cek toast error
    expect(toast.error).toHaveBeenCalledWith('Email atau kata sandi salah');
    expect(mockPush).not.toHaveBeenCalled();
  });

});