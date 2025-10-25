// src/app/dashboard/__tests__/page.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
// Update the import path to the correct location of CandidateDashboard
import CandidateDashboard from '../../dashboard/page'; // Sesuaikan path jika perlu
import * as jobsApi from '@/lib/supabase/jobs'; // Mock module Supabase jobs
import * as applicationsApi from '@/lib/supabase/applications'; // Mock module Supabase applications
import { AuthProvider } from '@/contexts/AuthContext'; // Dibutuhkan oleh dashboard
import { useAuth } from '@/contexts/AuthContext'; // Mock context hook

// Mock next/navigation (tidak terlalu penting di sini, tapi mungkin dibutuhkan dependency lain)
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

// Mock Supabase jobs & applications functions
jest.mock('@/lib/supabase/jobs');
jest.mock('@/lib/supabase/applications');
const mockGetJobs = jobsApi.getJobs as jest.Mock;
const mockGetUserAppliedJobIds = applicationsApi.getUserAppliedJobIds as jest.Mock;
const mockGetUserApplicationStatuses = applicationsApi.getUserApplicationStatuses as jest.Mock;

// Mock useAuth context hook
jest.mock('@/contexts/AuthContext');
const mockUseAuth = useAuth as jest.Mock;

// Contoh data job untuk testing (hanya yang aktif atau sudah dilamar)
const mockCandidateJobsData = [
  {
    id: 'job-active-1',
    job_title: 'Active Frontend Job',
    status: 'active', // Job aktif
    created_at: new Date('2024-10-20').toISOString(),
    min_salary: 7000000,
    max_salary: 9000000,
    company_name: 'Active Corp',
    job_type: 'Full-time',
    location: 'Jakarta',
    job_description: "Description line 1\nDescription line 2",
  },
  {
    id: 'job-applied-inactive',
    job_title: 'Inactive But Applied Job',
    status: 'inactive', // Job tidak aktif
    created_at: new Date('2024-10-15').toISOString(),
    min_salary: 8000000,
    max_salary: 10000000,
    company_name: 'Legacy Systems',
    job_type: 'Contract',
    location: 'Remote',
     job_description: "Old description",
  },
   {
    id: 'job-active-2',
    job_title: 'Active Backend Job',
    status: 'active',
    created_at: new Date('2024-10-22').toISOString(),
    min_salary: 9000000,
    max_salary: 12000000,
    company_name: 'Server Solutions',
    job_type: 'Full-time',
    location: 'Bandung',
     job_description: "Backend work details",
  },
];

// Data aplikasi user
const mockAppliedJobIds = ['job-applied-inactive']; // User sudah melamar job ini
const mockApplicationStatuses = {
  'job-applied-inactive': 'submitted' as const, // Status lamaran
};

describe('CandidateDashboard', () => {
  beforeEach(() => {
    // Mock getJobs response
    mockGetJobs.mockResolvedValue({ data: mockCandidateJobsData, error: null });
    // Mock applied jobs data
    mockGetUserAppliedJobIds.mockResolvedValue({ data: mockAppliedJobIds, error: null });
    mockGetUserApplicationStatuses.mockResolvedValue({ data: mockApplicationStatuses, error: null });
    // Mock useAuth return value (user logged in)
    mockUseAuth.mockReturnValue({
      user: { id: 'candidate-user-id', email: 'candidate@test.com' },
      role: 'candidate',
      loading: false,
       // ... other context values if needed
        showSplashScreen: false,
        splashRedirectTo: null,
        setShowSplashScreen: jest.fn(),
        setSplashRedirectTo: jest.fn(),
        logout: jest.fn(),
    });

    // Reset API call mocks
    mockGetJobs.mockClear();
    mockGetUserAppliedJobIds.mockClear();
    mockGetUserApplicationStatuses.mockClear();
  });

  // Test 1: Merender daftar job yang visible (aktif atau sudah dilamar)
  test('renders visible jobs on initial load', async () => {
    render(
      <AuthProvider>
        <CandidateDashboard />
      </AuthProvider>
    );

    // Tunggu loading dan data fetch
    await waitFor(() => {
      // Job aktif harus muncul
      expect(screen.getByText('Active Frontend Job')).toBeInTheDocument();
      expect(screen.getByText('Active Backend Job')).toBeInTheDocument();
      // Job inactive tapi sudah dilamar juga harus muncul
      expect(screen.getByText('Inactive But Applied Job')).toBeInTheDocument();
    });

    // Cek jumlah job card
    // Cari semua elemen yang mungkin menjadi JobCardCandidate
    const jobCards = screen.getAllByRole('article'); // Ganti selector jika perlu
    expect(jobCards).toHaveLength(3); // 3 job yang visible
  });

  // Test 2: Menampilkan detail job pertama secara default
  test('displays details of the first job by default', async () => {
    render(
      <AuthProvider>
        <CandidateDashboard />
      </AuthProvider>
    );

    await waitFor(() => {
        // Job pertama adalah 'Active Frontend Job'
      expect(screen.getByRole('heading', { name: 'Active Frontend Job' })).toBeInTheDocument();
      expect(screen.getByText('Active Corp')).toBeInTheDocument();
       // Cek salah satu deskripsi
      expect(screen.getByText('Description line 1')).toBeInTheDocument();
    });
  });

  // Test 3: Memperbarui detail view saat job lain dipilih
  test('updates job details view when another job card is clicked', async () => {
    render(
      <AuthProvider>
        <CandidateDashboard />
      </AuthProvider>
    );

    await waitFor(() => {
        // Awalnya menampilkan job pertama
      expect(screen.getByRole('heading', { name: 'Active Frontend Job' })).toBeInTheDocument();
    });

    // Klik job kedua ('Inactive But Applied Job')
    const inactiveJobCard = screen.getByText('Inactive But Applied Job').closest('article');
    expect(inactiveJobCard).toBeInTheDocument();
    if (inactiveJobCard) {
      fireEvent.click(inactiveJobCard);
    }

    // Tunggu detail view update
    await waitFor(() => {
        // Cek detail job kedua
      expect(screen.getByRole('heading', { name: 'Inactive But Applied Job' })).toBeInTheDocument();
      expect(screen.getByText('Legacy Systems')).toBeInTheDocument();
      // Cek status "Applied"
      expect(screen.getByText(/your application has been sent/i)).toBeInTheDocument(); // Cek pesan status applied
       expect(screen.getByText(/submitted/i)).toBeInTheDocument(); // Cek badge status
    });
  });

  // Test 4: Filtering job berdasarkan search query
  test('filters jobs based on search query', async () => {
    render(
      <AuthProvider>
        <CandidateDashboard />
      </AuthProvider>
    );
    await waitFor(() => expect(mockGetJobs).toHaveBeenCalled());

    const searchInput = screen.getByPlaceholderText(/search by title, company, or location/i);
    fireEvent.change(searchInput, { target: { value: 'Backend' } });

    await waitFor(() => {
      // Hanya job backend yang muncul di list
      expect(screen.queryByText('Active Frontend Job')).not.toBeInTheDocument();
      expect(screen.getByText('Active Backend Job')).toBeInTheDocument();
      expect(screen.queryByText('Inactive But Applied Job')).not.toBeInTheDocument();

      // Detail view juga harus update ke job hasil filter pertama (jika ada)
      expect(screen.getByRole('heading', { name: 'Active Backend Job' })).toBeInTheDocument();
    });
  });

  // Test 5: Filtering job berdasarkan Job Type
  test('filters jobs based on job type button', async () => {
    render(
      <AuthProvider>
        <CandidateDashboard />
      </AuthProvider>
    );
    await waitFor(() => expect(mockGetJobs).toHaveBeenCalled());

    // Klik tombol filter (jika tersembunyi)
    const filterToggleButton = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filterToggleButton);

    // Klik filter 'Contract' (tunggu tombol muncul)
    const contractButton = await screen.findByRole('button', { name: /contract/i });
    fireEvent.click(contractButton);

    await waitFor(() => {
      // Hanya job contract yang muncul
      expect(screen.queryByText('Active Frontend Job')).not.toBeInTheDocument();
      expect(screen.queryByText('Active Backend Job')).not.toBeInTheDocument();
      expect(screen.getByText('Inactive But Applied Job')).toBeInTheDocument(); // Job contract

       // Detail view update
      expect(screen.getByRole('heading', { name: 'Inactive But Applied Job' })).toBeInTheDocument();
    });
  });

  // Tambahkan test case lain untuk:
  // - Filter Location, Company, Recent, Salary
  // - Tombol Clear Filters
  // - Tampilan Empty State saat filter tidak menghasilkan apa-apa
  // - Perilaku di mobile view (switching antara list dan detail) jika memungkinkan/diperlukan
});