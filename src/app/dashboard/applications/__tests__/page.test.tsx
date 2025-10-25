// src/app/dashboard/applications/__tests__/page.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MyApplicationsPage from '../page'; // Sesuaikan path jika perlu
import * as applicationsApi from '@/lib/supabase/applications'; // Mock module Supabase applications
import { AuthProvider, useAuth } from '@/contexts/AuthContext'; // Mock context hook

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

// Mock Supabase applications functions
jest.mock('@/lib/supabase/applications');
const mockGetUserAppliedJobs = applicationsApi.getUserAppliedJobs as jest.Mock;

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

// Mock ApplicationDetailsModal
jest.mock('@/components/modals/ApplicationDetailsModal', () => ({
  ApplicationDetailsModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void; }) =>
    isOpen ? <div data-testid="mock-details-modal" onClick={onClose}>Mock Details Modal</div> : null,
}));

// Contoh data aplikasi untuk testing
const mockApplicationsData = [
  {
    id: 'app1',
    job_id: 'job1',
    status: 'submitted' as const,
    created_at: new Date('2024-10-24').toISOString(),
    job: {
      id: 'job1',
      job_title: 'Frontend Developer',
      company_name: 'TechCorp',
      min_salary: 7000000,
      max_salary: 9000000,
      // ... field job lainnya
    },
  },
  {
    id: 'app2',
    job_id: 'job2',
    status: 'pending' as const,
    created_at: new Date('2024-10-23').toISOString(),
    job: {
      id: 'job2',
      job_title: 'Backend Engineer',
      company_name: 'DataSys',
      min_salary: 8000000,
      max_salary: 10000000,
       // ... field job lainnya
    },
  },
  {
    id: 'app3',
    job_id: 'job3',
    status: 'accepted' as const,
    created_at: new Date('2024-10-22').toISOString(),
    job: {
      id: 'job3',
      job_title: 'UI/UX Designer',
      company_name: 'Creative Solutions',
      min_salary: 6000000,
      max_salary: 8000000,
      // ... field job lainnya
    },
  },
    {
    id: 'app4',
    job_id: 'job4',
    status: 'rejected' as const,
    created_at: new Date('2024-10-21').toISOString(),
    job: {
      id: 'job4',
      job_title: 'Data Analyst',
      company_name: 'Insight Inc.',
      min_salary: 7500000,
      max_salary: 9500000,
      // ... field job lainnya
    },
  },
];

describe('MyApplicationsPage', () => {
  beforeEach(() => {
    // Mock user logged in
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      // ... other context values
    });
    // Mock API response
    mockGetUserAppliedJobs.mockResolvedValue({ data: mockApplicationsData, error: null });

    // Reset mocks
    mockGetUserAppliedJobs.mockClear();
  });

  // Test 1: Merender daftar aplikasi
  test('renders list of applied jobs', async () => {
    render(
      <AuthProvider>
        <MyApplicationsPage />
      </AuthProvider>
    );

    // Tunggu data load
    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
      expect(screen.getByText('UI/UX Designer')).toBeInTheDocument();
      expect(screen.getByText('Data Analyst')).toBeInTheDocument();
    });

    // Cek jumlah kartu aplikasi
    const applicationCards = screen.getAllByRole('article'); // Ganti selector jika Card tidak punya role article
    expect(applicationCards).toHaveLength(mockApplicationsData.length);

    // Cek status badge
    expect(screen.getByText('Submitted')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  // Test 2: Filtering berdasarkan status 'Pending'
  test('filters applications by status', async () => {
    render(
      <AuthProvider>
        <MyApplicationsPage />
      </AuthProvider>
    );
    await waitFor(() => expect(mockGetUserAppliedJobs).toHaveBeenCalled());

    // Klik filter 'Pending'
    const pendingFilterButton = screen.getByRole('button', { name: /pending/i });
    fireEvent.click(pendingFilterButton);

    // Tunggu UI update
    await waitFor(() => {
      // Hanya aplikasi 'Pending' yang muncul
      expect(screen.queryByText('Frontend Developer')).not.toBeInTheDocument();
      expect(screen.getByText('Backend Engineer')).toBeInTheDocument(); // Ini yang pending
      expect(screen.queryByText('UI/UX Designer')).not.toBeInTheDocument();
      expect(screen.queryByText('Data Analyst')).not.toBeInTheDocument();
    });

    // Klik filter 'Accepted'
    const acceptedFilterButton = screen.getByRole('button', { name: /accepted/i });
    fireEvent.click(acceptedFilterButton);

     await waitFor(() => {
      // Hanya aplikasi 'Accepted' yang muncul
      expect(screen.queryByText('Frontend Developer')).not.toBeInTheDocument();
      expect(screen.queryByText('Backend Engineer')).not.toBeInTheDocument();
      expect(screen.getByText('UI/UX Designer')).toBeInTheDocument(); // Ini yang accepted
      expect(screen.queryByText('Data Analyst')).not.toBeInTheDocument();
    });

     // Klik filter 'All'
    const allFilterButton = screen.getByRole('button', { name: /all applications/i });
    fireEvent.click(allFilterButton);

     await waitFor(() => {
      // Semua aplikasi muncul lagi
       expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
      expect(screen.getByText('UI/UX Designer')).toBeInTheDocument();
      expect(screen.getByText('Data Analyst')).toBeInTheDocument();
       const applicationCards = screen.getAllByRole('article');
       expect(applicationCards).toHaveLength(mockApplicationsData.length);
    });
  });

  // Test 3: Membuka modal detail saat kartu diklik
  test('opens details modal when an application card is clicked', async () => {
     render(
      <AuthProvider>
        <MyApplicationsPage />
      </AuthProvider>
    );
    await waitFor(() => expect(mockGetUserAppliedJobs).toHaveBeenCalled());

     // Klik kartu pertama (Frontend Developer)
     const frontendCard = screen.getByText('Frontend Developer').closest('article');
     expect(frontendCard).toBeInTheDocument();
     if (frontendCard) {
         fireEvent.click(frontendCard);
     }

     // Tunggu modal muncul
     await waitFor(() => {
         expect(screen.getByTestId('mock-details-modal')).toBeInTheDocument();
     });

     // Pastikan judul job di modal sesuai (jika modal menampilkan judul)
     // Ini tergantung implementasi mock modal atau modal asli
  });

   // Test 4: Menampilkan Empty State jika tidak ada aplikasi
  test('displays empty state when no applications are found', async () => {
    mockGetUserAppliedJobs.mockResolvedValue({ data: [], error: null }); // Mock data kosong
    render(
      <AuthProvider>
        <MyApplicationsPage />
      </AuthProvider>
    );

    // Tunggu loading selesai
    await waitFor(() => {
      expect(screen.getByText(/no applications found/i)).toBeInTheDocument();
      expect(screen.getByText(/you haven't applied to any jobs yet/i)).toBeInTheDocument();
      // Pastikan tidak ada kartu aplikasi
      expect(screen.queryByRole('article')).not.toBeInTheDocument();
    });
  });

});