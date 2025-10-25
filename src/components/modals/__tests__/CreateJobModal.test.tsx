// src/components/modals/__tests__/CreateJobModal.test.tsx
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CreateJobModal } from '../CreateJobModal';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'react-hot-toast';

// --- Mocks ---
const mockInsert = jest.fn();
const mockGetUser = jest.fn();
const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn().mockImplementation((tableName: string) => {
      if (tableName === 'jobs') {
        return {
          insert: mockInsert,
        };
      }
      // Return object kosong default jika tabel lain, agar tidak error
      return {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    }),
     storage: {
      from: jest.fn().mockImplementation((bucketName: string) => {
         if (bucketName === 'company_logos') {
            return {
                upload: mockUpload,
                getPublicUrl: mockGetPublicUrl,
            };
         }
          // Return mock kosong jika bucket lain
          return {
             upload: jest.fn().mockResolvedValue({ data: null, error: new Error('Mock upload error')}),
             getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: null } }),
          };
      }),
    },
  },
}));

jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('gsap', () => ({
  gsap: {
    to: jest.fn(),
    fromTo: jest.fn(),
    set: jest.fn(),
    killTweensOf: jest.fn(),
  },
}));
// --- End Mocks ---

describe('CreateJobModal', () => {
  const mockOnClose = jest.fn();
  const mockOnJobCreated = jest.fn();

  beforeEach(() => {
    // Reset mocks
    mockInsert.mockClear();
    (supabase.auth.getUser as jest.Mock).mockClear();
    mockUpload.mockClear();
    mockGetPublicUrl.mockClear();
    mockOnClose.mockClear();
    mockOnJobCreated.mockClear();
    (toast.error as jest.Mock).mockClear();
    (toast.success as jest.Mock).mockClear();

    // Setup default successful mocks
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: { id: 'admin-user-id' } }, error: null });
    // Pastikan mock insert mengembalikan struktur chaining yang benar
    mockInsert.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { id: 'new-job-id' }, error: null })
    });
    mockUpload.mockResolvedValue({ data: { path: 'public/logo.png'}, error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://example.com/logo.png'} });

    // Reset from/storage mocks if needed
    (supabase.from as jest.Mock).mockClear();
    (supabase.from as jest.Mock).mockImplementation((tableName: string) => {
       if (tableName === 'jobs') return { insert: mockInsert };
       return { /* default empty mocks */
           insert: jest.fn().mockReturnThis(),
           select: jest.fn().mockReturnThis(),
           update: jest.fn().mockReturnThis(),
           delete: jest.fn().mockReturnThis(),
           eq: jest.fn().mockReturnThis(),
           single: jest.fn().mockResolvedValue({ data: null, error: null }),
       };
    });
    (supabase.storage.from as jest.Mock).mockClear();
    (supabase.storage.from as jest.Mock).mockImplementation((bucketName: string) => {
       if (bucketName === 'company_logos') return { upload: mockUpload, getPublicUrl: mockGetPublicUrl };
       return { upload: jest.fn().mockResolvedValue({ data: null, error: new Error('Mock upload error') }), getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: null } }) };
    });
  });

  // Test 1: Merender modal dengan benar
  test('renders modal correctly when open', async () => {
    render(
      <CreateJobModal
        isOpen={true}
        onClose={mockOnClose}
        onJobCreated={mockOnJobCreated}
      />
    );
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/job title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /publish job/i })).toBeInTheDocument();
  });

// Test 2: Menampilkan error validasi
  test('shows validation errors for required fields', async () => {
    render(
      <CreateJobModal
        isOpen={true}
        onClose={mockOnClose}
        onJobCreated={mockOnJobCreated}
      />
    );
    await screen.findByRole('dialog');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /publish job/i }));
    });

    // Cari teks error langsung di screen, setelah menunggu
    await waitFor(() => {
        expect(screen.getByText('Job title is required')).toBeInTheDocument();
        expect(screen.getByText('Job description is required')).toBeInTheDocument();
        expect(screen.getByText('Company name is required')).toBeInTheDocument();
        expect(screen.getByText('Location is required')).toBeInTheDocument();
        expect(screen.getByText('Number of candidates is required')).toBeInTheDocument();
    });


    expect(mockInsert).not.toHaveBeenCalled();
  });
  
  // Test 3: Memanggil Supabase insert
  test('calls Supabase insert with correct data on valid submission', async () => {
    render(
      <CreateJobModal
        isOpen={true}
        onClose={mockOnClose}
        onJobCreated={mockOnJobCreated}
      />
    );
    await screen.findByRole('dialog');

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/job title \*/i), { target: { value: 'Test Job Title' } });
      fireEvent.change(screen.getByLabelText(/job type \*/i), { target: { value: 'Full-time' } });
      fireEvent.change(screen.getByLabelText(/job description \*/i), { target: { value: 'Test Description' } });
      fireEvent.change(screen.getByLabelText(/company name \*/i), { target: { value: 'Test Company' } });
      fireEvent.change(screen.getByLabelText(/location \*/i), { target: { value: 'Test Location' } });
      fireEvent.change(screen.getByLabelText(/candidates needed \*/i), { target: { value: '2' } });
      fireEvent.change(screen.getByLabelText(/minimum salary/i), { target: { value: '5.000.000' } });
      fireEvent.change(screen.getByLabelText(/maximum salary/i), { target: { value: '8.000.000' } });
      fireEvent.change(screen.getByLabelText(/required skills/i), { target: { value: 'React, TypeScript' } }); // Tambah skill
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /publish job/i }));
    });

    expect(mockInsert).toHaveBeenCalledTimes(1);
    const insertedData = mockInsert.mock.calls[0][0][0];
    expect(insertedData).toMatchObject({
      job_title: 'Test Job Title',
      job_type: 'Full-time',
      job_description: 'Test Description',
      company_name: 'Test Company',
      location: 'Test Location',
      candidates_needed: 2,
      min_salary: 5000000,
      max_salary: 8000000,
      status: 'active',
      created_by: 'admin-user-id',
      required_skills: ['React', 'TypeScript'], // Cek skill sudah di-parse
      company_logo_url: null,
      form_configuration: expect.objectContaining({
          full_name: 'mandatory',
          email: 'mandatory',
      }),
    });

    expect(toast.success).toHaveBeenCalledWith('Job published successfully!');

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
    expect(mockOnJobCreated).toHaveBeenCalledTimes(1);
  });

   // Test 4: Memvalidasi rentang gaji
  test('shows error if minimum salary is greater than maximum salary', async () => {
     render(
      <CreateJobModal
        isOpen={true}
        onClose={mockOnClose}
        onJobCreated={mockOnJobCreated}
      />
    );
     await screen.findByRole('dialog');

     await act(async () => {
        fireEvent.change(screen.getByLabelText(/job title \*/i), { target: { value: 'Salary Test' } });
        fireEvent.change(screen.getByLabelText(/job description \*/i), { target: { value: 'Desc' } });
        fireEvent.change(screen.getByLabelText(/company name \*/i), { target: { value: 'Comp' } });
        fireEvent.change(screen.getByLabelText(/location \*/i), { target: { value: 'Loc' } });
        fireEvent.change(screen.getByLabelText(/candidates needed \*/i), { target: { value: '1' } });
        fireEvent.change(screen.getByLabelText(/minimum salary/i), { target: { value: '10.000.000' } });
        fireEvent.change(screen.getByLabelText(/maximum salary/i), { target: { value: '8.000.000' } });
     });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /publish job/i }));
     });

     expect(toast.error).toHaveBeenCalledWith('Minimum salary cannot be greater than maximum salary');
     expect(mockInsert).not.toHaveBeenCalled();
     expect(mockOnClose).not.toHaveBeenCalled();
  });
});