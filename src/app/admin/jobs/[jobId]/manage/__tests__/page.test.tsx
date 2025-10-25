// src/app/admin/jobs/[jobId]/manage/__tests__/page.test.tsx
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import ManageCandidatesPage from '../page'; // Sesuaikan path jika perlu
import * as jobsApi from '@/lib/supabase/jobs'; // Mock module Supabase jobs
import * as applicationsApi from '@/lib/supabase/applications'; // Mock module Supabase applications
import { useRouter, useParams } from 'next/navigation'; // Mock next/navigation hooks

// --- MOCKS ---

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(), // Mock useParams
}));

// Mock Supabase jobs & applications functions
jest.mock('@/lib/supabase/jobs');
jest.mock('@/lib/supabase/applications');
const mockGetJobById = jobsApi.getJobById as jest.Mock;
const mockGetApplicationsByJobId = applicationsApi.getApplicationsByJobId as jest.Mock;
const mockUpdateApplicationStatus = applicationsApi.updateApplicationStatus as jest.Mock;
const mockCheckAndDeactivateJobIfFull = applicationsApi.checkAndDeactivateJobIfFull as jest.Mock; // Mock fungsi ini

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock lottie-react
jest.mock('lottie-react', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="mock-lottie">Mock Lottie Animation</div>),
}));
// --- END MOCKS ---


// Contoh data job detail
const mockJobDetail = {
  id: 'test-job-id',
  job_title: 'Software Engineer',
  status: 'active',
  candidates_needed: 2, // Contoh
  // ... field job lainnya
};

// Contoh data aplikasi
const mockApplicationsData = [
  {
    id: 'app1',
    job_id: 'test-job-id',
    applicant_id: 'user1',
    status: 'submitted' as const,
    created_at: new Date('2024-10-24').toISOString(),
    application_data: {
      full_name: 'Alice Wonderland',
      email: 'alice@example.com',
      phone_number: '+628123456789',
      // ... data kandidat lainnya
    },
  },
  {
    id: 'app2',
    job_id: 'test-job-id',
    applicant_id: 'user2',
    status: 'pending' as const,
    created_at: new Date('2024-10-23').toISOString(),
    application_data: {
      full_name: 'Bob The Builder',
      email: 'bob@example.com',
      phone_number: '+628987654321',
      // ... data kandidat lainnya
    },
  },
];

// Mock extractCandidateData
const mockExtractCandidateData = applicationsApi.extractCandidateData as jest.Mock;
mockExtractCandidateData.mockImplementation((data: any) => ({
  full_name: data?.full_name || '-',
  email: data?.email || '-',
  phone: data?.phone_number || '-', // Sesuaikan dengan key yang benar
  // ... mapping field lainnya
}));

describe('ManageCandidatesPage', () => {
  const mockPush = jest.fn();
  const mockJobId = 'test-job-id';

  beforeEach(() => {
    // Setup mock useRouter dan useParams
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useParams as jest.Mock).mockReturnValue({
      jobId: mockJobId, // Berikan nilai jobId
    });

    // Mock API responses
    mockGetJobById.mockResolvedValue({ data: mockJobDetail, error: null });
    mockGetApplicationsByJobId.mockResolvedValue({ data: mockApplicationsData, error: null });
    mockUpdateApplicationStatus.mockResolvedValue({ data: { ...mockApplicationsData[0], status: 'accepted' }, error: null }); // Contoh response update
    mockCheckAndDeactivateJobIfFull.mockResolvedValue({ success: true, deactivated: false }); // Default tidak auto-deactivate

    // Reset mocks
    mockGetJobById.mockClear();
    mockGetApplicationsByJobId.mockClear();
    mockUpdateApplicationStatus.mockClear();
    mockCheckAndDeactivateJobIfFull.mockClear();
    mockPush.mockClear();
    mockExtractCandidateData.mockClear();
    // Panggil implementasi mock lagi jika perlu
    mockExtractCandidateData.mockImplementation((data: any) => ({
        full_name: data?.full_name || '-', email: data?.email || '-', phone: data?.phone_number || '-',
    }));
  });

  // Test 1: Merender judul job dan tabel kandidat
  test('renders job title and candidate table', async () => {
    render(<ManageCandidatesPage />);

    // Tunggu data load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: mockJobDetail.job_title })).toBeInTheDocument();
      expect(screen.getByText('Alice Wonderland')).toBeInTheDocument();
      expect(screen.getByText('Bob The Builder')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/search candidates/i)).toBeInTheDocument();
    });

    // Cek jumlah baris data di tabel (tidak termasuk header)
    const tableRows = screen.getAllByRole('row');
    expect(tableRows).toHaveLength(mockApplicationsData.length + 1); // +1 untuk header
  });

  // Test 2: Filtering kandidat berdasarkan nama
  test('filters candidates based on search query', async () => {
    render(<ManageCandidatesPage />);
    await waitFor(() => expect(mockGetApplicationsByJobId).toHaveBeenCalled());

    const searchInput = screen.getByPlaceholderText(/search candidates/i);
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    await waitFor(() => {
      expect(screen.getByText('Alice Wonderland')).toBeInTheDocument();
      expect(screen.queryByText('Bob The Builder')).not.toBeInTheDocument();
    });
  });

  // Test 3: Pagination (jika data lebih dari page size)
  test('handles pagination correctly', async () => {
    // Buat data mock lebih banyak dari page size default (10)
    const manyApplications = Array.from({ length: 15 }, (_, i) => ({
      ...mockApplicationsData[0],
      id: `app${i + 1}`,
      applicant_id: `user${i + 1}`,
      application_data: { full_name: `Candidate ${i + 1}`, email: `c${i+1}@example.com` },
    }));
    mockGetApplicationsByJobId.mockResolvedValue({ data: manyApplications, error: null });
    mockExtractCandidateData.mockImplementation((data: any) => ({
        full_name: data?.full_name || '-', email: data?.email || '-', phone: data?.phone_number || '-',
    }));

    render(<ManageCandidatesPage />);
    await waitFor(() => expect(screen.getByText('Candidate 1')).toBeInTheDocument());

    // Cek info pagination awal
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();

    // Klik Next
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Cek info pagination setelah klik Next
    await waitFor(() => {
      expect(screen.getByText('Candidate 11')).toBeInTheDocument(); // Kandidat di halaman 2
      expect(screen.queryByText('Candidate 1')).not.toBeInTheDocument(); // Kandidat halaman 1 hilang
    });
    expect(screen.getByRole('button', { name: /previous/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
  });

  // Test 4: Memanggil update status saat action 'Accept' diklik
  test('calls updateApplicationStatus when Accept action is clicked', async () => {
    render(<ManageCandidatesPage />);
    await waitFor(() => expect(mockGetApplicationsByJobId).toHaveBeenCalled());

    // Cari baris Alice
    const aliceRow = screen.getByText('Alice Wonderland').closest('tr');
    expect(aliceRow).toBeInTheDocument();

    // Cari tombol di dalam *sel terakhir* (action cell) agar tidak ambigu
    const actionCell = aliceRow!.lastChild as HTMLElement;
    const actionButton = within(actionCell).getByRole('button');
    fireEvent.click(actionButton);

    // PERBAIKAN BARU: Ganti role 'button' menjadi 'menuitem' untuk dropdown
    const acceptButton = await screen.findByRole('menuitem', { name: /accept/i });
    fireEvent.click(acceptButton);

    // Tunggu proses update
    await waitFor(() => {
      expect(mockUpdateApplicationStatus).toHaveBeenCalledWith('app1', 'accepted');
      // Cek apakah status di UI terupdate (berdasarkan StatusBadge)
      const updatedBadge = within(aliceRow!).getByText(/accepted/i);
      expect(updatedBadge).toBeInTheDocument();
    });

     // Cek apakah fungsi auto-deactivate dipanggil
    expect(mockCheckAndDeactivateJobIfFull).toHaveBeenCalledWith(mockJobId);
  });

  // Test 5: Memanggil fungsi auto-deactivate dan mereload job jika kuota terpenuhi
  test('calls checkAndDeactivateJobIfFull and reloads job if quota met', async () => {
    // Mock bahwa kuota akan terpenuhi dan job akan dinonaktifkan
    mockCheckAndDeactivateJobIfFull.mockResolvedValue({ success: true, deactivated: true });
    // Mock response job setelah update status (menjadi inactive)
    const inactiveJob = { ...mockJobDetail, status: 'inactive' };
    mockGetJobById.mockResolvedValueOnce({ data: mockJobDetail, error: null }) // Initial load
                 .mockResolvedValueOnce({ data: inactiveJob, error: null }); // Reload after deactivate

    render(<ManageCandidatesPage />);
    
    // PERBAIKAN BARU: Gunakan matcher fungsi yang lebih robust (menghapus spasi ekstra)
    await waitFor(() => 
      expect(screen.getByText((content, el) => el!.textContent.replace(/\s+/g, ' ').trim() === "Status: Active")).toBeInTheDocument()
    ); // Status awal

    // Lakukan aksi 'Accept' seperti test sebelumnya
    const aliceRow = screen.getByText('Alice Wonderland').closest('tr');
    // Cari tombol di dalam *sel terakhir* (action cell)
    const actionCell = aliceRow!.lastChild as HTMLElement;
    const actionButton = within(actionCell).getByRole('button');
    fireEvent.click(actionButton);
    
    // PERBAIKAN BARU: Ganti role 'button' menjadi 'menuitem'
    const acceptButton = await screen.findByRole('menuitem', { name: /accept/i });
    fireEvent.click(acceptButton);

    // Tunggu update status aplikasi dan pengecekan auto-deactivate
    await waitFor(() => {
      expect(mockUpdateApplicationStatus).toHaveBeenCalledWith('app1', 'accepted');
      expect(mockCheckAndDeactivateJobIfFull).toHaveBeenCalledWith(mockJobId);
    });

    // Tunggu job data direload dan status di header berubah
    // PERBAIKAN BARU: Gunakan matcher fungsi yang robust untuk 'Inactive'
    await waitFor(() => {
      expect(screen.getByText((content, el) => el!.textContent.replace(/\s+/g, ' ').trim() === "Status: Inactive")).toBeInTheDocument();
    });
  });
});