// src/components/modals/__tests__/ApplyJobModal.test.tsx
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
// PERBAIKAN: Import QueryClient and QueryClientProvider
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 
import { ApplyJobModal } from '../ApplyJobModal'; // Adjust path if necessary
import * as applicationsApi from '@/lib/supabase/applications'; // Import API module
import { AuthProvider, useAuth } from '@/contexts/AuthContext'; // Mock context hook
import { supabase } from '@/lib/supabase/client';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

// Mock Supabase applications functions AND hooks
jest.mock('@/lib/supabase/applications', () => ({
  checkIfApplied: jest.fn(),
  useCheckIfApplied: jest.fn(), // Mock the hook
}));
const mockCheckIfApplied = applicationsApi.checkIfApplied as jest.Mock;
const mockUseCheckIfApplied = applicationsApi.checkIfApplied as jest.Mock; // Get the hook mock

// Mock Supabase client
const mockInsert = jest.fn();
const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null }),
    },
    from: jest.fn((tableName: string) => {
        if (tableName === 'applications') {
            return {
                insert: mockInsert,
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' }})
            };
        }
        return {};
    }),
    storage: {
      from: jest.fn(() => ({
         upload: mockUpload,
         getPublicUrl: mockGetPublicUrl,
      })),
    },
  },
}));

// Mock useAuth context hook
jest.mock('@/contexts/AuthContext');
const mockUseAuth = useAuth as jest.Mock;

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock WebcamGestureModal
jest.mock('../WebcamGestureModal', () => ({
  WebcamGestureModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) =>
    isOpen ? <div data-testid="mock-webcam-modal" onClick={onClose}>Mock Webcam Modal</div> : null,
}));

// --- Sample Job Data ---
const mockJobMandatory = {
  id: 'job-m',
  job_title: 'Mandatory Fields Job',
  company: 'Strict Inc.',
  form_configuration: {
    full_name: 'mandatory' as const,
    photo_profile: 'mandatory' as const,
    gender: 'mandatory' as const,
    domicile: 'mandatory' as const,
    email: 'mandatory' as const,
    phone_number: 'mandatory' as const,
    linkedin_link: 'mandatory' as const,
    date_of_birth: 'mandatory' as const,
  },
};

const mockJobOptional = {
  id: 'job-o',
  job_title: 'Optional Fields Job',
  company: 'Flexible Co.',
  form_configuration: {
    full_name: 'mandatory' as const,
    email: 'mandatory' as const,
    photo_profile: 'optional' as const,
    gender: 'optional' as const,
    domicile: 'optional' as const,
    phone_number: 'optional' as const,
    linkedin_link: 'optional' as const,
    date_of_birth: 'optional' as const,
  },
};

const mockJobMinimal = {
  id: 'job-min',
  job_title: 'Minimal Fields Job',
  company: 'Simple LLC',
  form_configuration: {
    full_name: 'mandatory' as const,
    email: 'mandatory' as const,
  },
};
// --- End Sample Job Data ---

// PERBAIKAN: Create a new QueryClient for testing
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries for faster tests
    },
  },
});

describe('ApplyJobModal', () => {
  const mockOnClose = jest.fn();
  let queryClient: QueryClient; // Declare queryClient

  beforeEach(() => {
    queryClient = createTestQueryClient(); // Create a new client for each test

    // Mock user logged in
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
    });
    
    // Mock the hook's return value to prevent loading state
    mockUseCheckIfApplied.mockReturnValue({
      data: { hasApplied: false, data: null },
      isLoading: false, // Set isLoading to false
      isError: false,
    });
    
    // Mock the API function
    mockCheckIfApplied.mockResolvedValue({ hasApplied: false, error: null });

    // Mock successful insert
    mockInsert.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'new-app-id' }, error: null })
    });
     // Mock successful upload and URL retrieval
    mockUpload.mockResolvedValue({ data: { path: 'public/photo.jpg'}, error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/photo.jpg'} });

    // Reset mocks
    mockOnClose.mockClear();
    mockInsert.mockClear();
    mockUpload.mockClear();
    mockGetPublicUrl.mockClear();
    mockCheckIfApplied.mockClear();
    mockUseCheckIfApplied.mockClear(); 

    // Reset Supabase 'from' mock calls
    (supabase.from as jest.Mock).mockClear();
     (supabase.from as jest.Mock).mockImplementation((tableName: string) => {
        if (tableName === 'applications') {
             return {
                insert: mockInsert,
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' }})
            };
        }
        return {};
     });
  });
  
  // PERBAIKAN: Helper function to wrap component in all necessary providers
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {ui}
        </AuthProvider>
      </QueryClientProvider>
    );
  };

  // Test 1: Renders mandatory fields correctly
  test('renders mandatory fields correctly based on config', () => {
    // Use the helper
    renderWithProviders(
      <ApplyJobModal isOpen={true} onClose={mockOnClose} job={mockJobMandatory as any} />
    );

    // Check all fields are present
    expect(screen.getByLabelText(/photo profile/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pronoun \(gender\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/domicile/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/link linkedin/i)).toBeInTheDocument();

    // Check * for mandatory fields
    expect(screen.getByLabelText(/full name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email \*/i)).toBeInTheDocument();
  });

   // Test 2: Does not render 'off' fields
  test('does not render fields set to "off"', () => {
    renderWithProviders(
      <ApplyJobModal isOpen={true} onClose={mockOnClose} job={mockJobMinimal as any} />
    );

    // Mandatory fields are present
    expect(screen.getByLabelText(/full name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email \*/i)).toBeInTheDocument();

    // Other fields (off) are not present
    expect(screen.queryByLabelText(/photo profile/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/pronoun \(gender\)/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/domicile/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/phone number/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/link linkedin/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/date of birth/i)).not.toBeInTheDocument();
  });

  // Test 3: Shows validation errors for empty mandatory fields
  test('shows validation errors for empty mandatory fields', async () => {
    renderWithProviders(
      <ApplyJobModal isOpen={true} onClose={mockOnClose} job={mockJobMandatory as any} />
    );

    // Click submit without filling
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    // Check for some error messages
    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/photo profile is required/i)).toBeInTheDocument();

    expect(mockInsert).not.toHaveBeenCalled();
  });

  // Test 4: Does not show validation errors for empty optional fields
  test('does not show validation errors for empty optional fields', async () => {
    renderWithProviders(
      <ApplyJobModal isOpen={true} onClose={mockOnClose} job={mockJobOptional as any} />
    );

    // Fill mandatory fields
    fireEvent.change(screen.getByLabelText(/full name \*/i), { target: { value: 'Optional Tester' } });
    fireEvent.change(screen.getByLabelText(/email \*/i), { target: { value: 'optional@test.com' } });

    // Click submit (optional fields left empty)
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    // Wait for submit process
    await waitFor(() => {
      // Ensure insert was called (no validation errors)
      expect(mockInsert).toHaveBeenCalledTimes(1);
      // Ensure no error messages for optional fields
      expect(screen.queryByText(/photo profile is required/i)).not.toBeInTheDocument(); // Corrected assertion
      expect(screen.queryByText(/gender is required/i)).not.toBeInTheDocument();
    });
  });

   // Test 5: Submits correct data including photo upload
  test('submits correct data including photo upload', async () => {
    renderWithProviders(
      <ApplyJobModal isOpen={true} onClose={mockOnClose} job={mockJobMandatory as any} />
    );

    // --- Fill mandatory fields ---
    fireEvent.change(screen.getByLabelText(/full name \*/i), { target: { value: 'Alice Photo' } });
    fireEvent.change(screen.getByLabelText(/email \*/i), { target: { value: 'alice.photo@example.com' } });
    fireEvent.click(screen.getByLabelText(/she\/her \(female\)/i));
    fireEvent.change(screen.getByPlaceholderText('81XXXXXXXXX'), { target: { value: '81122334455' } });
    fireEvent.change(screen.getByPlaceholderText(/linkedin.com\/in\/username/i), { target: { value: 'https://linkedin.com/in/alicephoto' } });
    
    // --- Mock Photo Upload ---
    const file = new File(['(⌐□_□)'], 'profile.png', { type: 'image/png' });
    // Find the file input.
    const fileInput = screen.getByTestId('photo-profile-upload-area').querySelector('input[type="file"]') as HTMLInputElement;
    
    await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
    });
    
    // Check for the alt text of the preview image
    await waitFor(() => expect(screen.getByAltText('Profile Preview')).toBeInTheDocument()); 

    // --- Click submit ---
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    // --- Wait for process and check ---
    await waitFor(() => {
        // Check upload was called
        expect(mockUpload).toHaveBeenCalledTimes(1);
        expect(mockUpload.mock.calls[0][0]).toContain('public/test-user-id-job-m'); // Check path
        expect(mockUpload.mock.calls[0][1]).toBe(file); // Check file
        // Check getPublicUrl was called
        expect(mockGetPublicUrl).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
        // Check insert was called
        expect(mockInsert).toHaveBeenCalledTimes(1);
        const submittedData = mockInsert.mock.calls[0][0][0];
        expect(submittedData.job_id).toBe('job-m');
        expect(submittedData.applicant_id).toBe('test-user-id');
        expect(submittedData.status).toBe('submitted');
        // Check application_data
        expect(submittedData.application_data).toMatchObject({
            full_name: 'Alice Photo',
            email: 'alice.photo@example.com',
            gender: 'female',
            phone_number: '+6281122334455',
            linkedin_link: 'https://linkedin.com/in/alicephoto',
            photo_profile_url: 'https://example.com/photo.jpg',
        });
        expect(submittedData.application_data.photo_profile).toBeUndefined();
    });

    // Check modal close and callback
    await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});