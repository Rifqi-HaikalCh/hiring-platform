// src/components/modals/__tests__/ApplyJobModal.test.tsx
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ApplyJobModal } from '../ApplyJobModal'; // Sesuaikan path jika perlu
import * as applicationsApi from '@/lib/supabase/applications'; // Mock module Supabase applications
import { AuthProvider, useAuth } from '@/contexts/AuthContext'; // Mock context hook
import { supabase } from '@/lib/supabase/client';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

// Mock Supabase applications functions
jest.mock('@/lib/supabase/applications');
const mockCheckIfApplied = applicationsApi.checkIfApplied as jest.Mock;
// Mock insert application (lebih kompleks karena ada upload foto)
const mockInsert = jest.fn();
const mockStorageFrom = jest.fn().mockReturnThis();
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
                select: jest.fn().mockReturnThis(), // Tambahkan mock untuk select
                eq: jest.fn().mockReturnThis(),    // Tambahkan mock untuk eq
                single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' }}) // Mock not found for check
            };
        }
        // Tambahkan mock lain jika perlu
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

// Mock WebcamGestureModal (agar tidak render logic webcam asli)
jest.mock('./WebcamGestureModal', () => ({
  WebcamGestureModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) =>
    isOpen ? <div data-testid="mock-webcam-modal" onClick={onClose}>Mock Webcam Modal</div> : null,
}));

// Contoh data job dengan konfigurasi form berbeda
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
  // ... field job lainnya
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
   // ... field job lainnya
};

const mockJobMinimal = {
  id: 'job-min',
  job_title: 'Minimal Fields Job',
  company: 'Simple LLC',
  form_configuration: {
    full_name: 'mandatory' as const,
    email: 'mandatory' as const,
    // Field lain default ke 'off'
  },
  // ... field job lainnya
};


describe('ApplyJobModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    // Mock user logged in
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      // ... other context values
    });
    // Mock belum apply
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

    // Reset Supabase 'from' mock calls if needed
     (supabase.from as jest.Mock).mockClear();
     // Re-apply mock implementation for applications table
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

  // Test 1: Merender field mandatory dengan benar
  test('renders mandatory fields correctly based on config', () => {
    render(
      <AuthProvider>
        <ApplyJobModal isOpen={true} onClose={mockOnClose} job={mockJobMandatory as any} />
      </AuthProvider>
    );

    // Cek semua field ada
    expect(screen.getByLabelText(/photo profile/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pronoun \(gender\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/domicile/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/link linkedin/i)).toBeInTheDocument();

    // Cek tanda * untuk mandatory
    expect(screen.getByLabelText(/full name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email \*/i)).toBeInTheDocument();
    // ... cek tanda * untuk field mandatory lainnya
  });

   // Test 2: Tidak merender field 'off'
  test('does not render fields set to "off"', () => {
    render(
      <AuthProvider>
        <ApplyJobModal isOpen={true} onClose={mockOnClose} job={mockJobMinimal as any} />
      </AuthProvider>
    );

    // Field mandatory ada
    expect(screen.getByLabelText(/full name \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email \*/i)).toBeInTheDocument();

    // Field lain (yang off) tidak ada
    expect(screen.queryByLabelText(/photo profile/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/pronoun \(gender\)/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/domicile/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/phone number/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/link linkedin/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/date of birth/i)).not.toBeInTheDocument();
  });

  // Test 3: Menampilkan error validasi untuk field mandatory yang kosong
  test('shows validation errors for empty mandatory fields', async () => {
    render(
      <AuthProvider>
        <ApplyJobModal isOpen={true} onClose={mockOnClose} job={mockJobMandatory as any} />
      </AuthProvider>
    );

    // Klik submit tanpa mengisi
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    // Cek beberapa pesan error
    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/photo profile is required/i)).toBeInTheDocument(); // Karena belum ada foto
    // ... cek error mandatory lainnya

    expect(mockInsert).not.toHaveBeenCalled();
  });

  // Test 4: Tidak menampilkan error validasi untuk field optional yang kosong
  test('does not show validation errors for empty optional fields', async () => {
    render(
      <AuthProvider>
        <ApplyJobModal isOpen={true} onClose={mockOnClose} job={mockJobOptional as any} />
      </AuthProvider>
    );

    // Isi field mandatory
    fireEvent.change(screen.getByLabelText(/full name \*/i), { target: { value: 'Optional Tester' } });
    fireEvent.change(screen.getByLabelText(/email \*/i), { target: { value: 'optional@test.com' } });

    // Klik submit (field optional dibiarkan kosong)
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

     // Tunggu proses submit
    await waitFor(() => {
      // Pastikan insert dipanggil (tidak ada error validasi)
      expect(mockInsert).toHaveBeenCalledTimes(1);
       // Pastikan tidak ada pesan error untuk field optional
      expect(screen.queryByText(/photo profile is required/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/gender is required/i)).not.toBeInTheDocument();
      // ... cek field optional lainnya
    });
  });

   // Test 5: Mengirim data dengan benar (termasuk upload foto jika ada)
  test('submits correct data including photo upload', async () => {
    render(
      <AuthProvider>
        <ApplyJobModal isOpen={true} onClose={mockOnClose} job={mockJobMandatory as any} />
      </AuthProvider>
    );

    // --- Isi semua field mandatory ---
    fireEvent.change(screen.getByLabelText(/full name \*/i), { target: { value: 'Alice Photo' } });
    fireEvent.change(screen.getByLabelText(/email \*/i), { target: { value: 'alice.photo@example.com' } });
    // Mock pemilihan gender (contoh: klik radio button 'female')
    fireEvent.click(screen.getByLabelText(/she\/her \(female\)/i));
     // Mock pemilihan tanggal (perlu library date-fns atau mock DatePicker)
    // Untuk simplifikasi, anggap saja field.onChange dipanggil
    // fireEvent.change(screen.getByPlaceholderText(/select your date of birth/i), { target: { value: '15/05/1995' } }); // Ini mungkin tidak bekerja
    // Mock pemilihan Domicile (memerlukan interaksi dengan react-select, bisa kompleks)
    // Mock input nomor telepon
     fireEvent.change(screen.getByPlaceholderText('81XXXXXXXXX'), { target: { value: '81122334455' } });
     // Mock input LinkedIn
     fireEvent.change(screen.getByPlaceholderText(/linkedin.com\/in\/username/i), { target: { value: 'https://linkedin.com/in/alicephoto' } });


    // --- Mock Upload Foto ---
    const file = new File(['(⌐□_□)'], 'profile.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/photo profile/i).closest('div')?.querySelector('input[type="file"]') as HTMLInputElement;
    // Perlu menggunakan `await act` jika ada update state asynchronous di handleFileUpload
     await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
     });
     // Tunggu preview muncul
     await waitFor(() => expect(screen.getByAltText('Profile')).toBeInTheDocument());


    // --- Klik submit ---
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    // --- Tunggu proses dan cek ---
    await waitFor(() => {
        // Cek upload dipanggil
        expect(mockUpload).toHaveBeenCalledTimes(1);
        expect(mockUpload.mock.calls[0][0]).toContain('public/test-user-id-job-m'); // Cek path
        expect(mockUpload.mock.calls[0][1]).toBe(file); // Cek file
        // Cek getPublicUrl dipanggil
        expect(mockGetPublicUrl).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
        // Cek insert dipanggil
        expect(mockInsert).toHaveBeenCalledTimes(1);
        const submittedData = mockInsert.mock.calls[0][0][0];
        expect(submittedData.job_id).toBe('job-m');
        expect(submittedData.applicant_id).toBe('test-user-id');
        expect(submittedData.status).toBe('submitted');
        // Cek application_data
        expect(submittedData.application_data).toMatchObject({
            full_name: 'Alice Photo',
            email: 'alice.photo@example.com',
            gender: 'female',
            phone_number: '+6281122334455', // Cek country code + nomor
            linkedin_link: 'https://linkedin.com/in/alicephoto',
            photo_profile_url: 'https://example.com/photo.jpg', // Cek URL dari mock
            // Cek field lain yang diisi
        });
        // Pastikan photo_profile (data file/base64) tidak ada di payload akhir
        expect(submittedData.application_data.photo_profile).toBeUndefined();
    });

     // Cek modal close dan callback
    await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalledTimes(1);
        // expect(mockOnJobCreated).toHaveBeenCalledTimes(1); // Callback ini tidak ada di ApplyJobModal
    });
  });

  // Tambahkan test case lain untuk:
  // - Pengambilan foto via gesture (mock onCapture)
  // - Validasi format (email, phone, linkedin)
  // - Penanganan jika user sudah pernah apply
  // - Penanganan error saat upload foto
  // - Penanganan error saat insert aplikasi
});