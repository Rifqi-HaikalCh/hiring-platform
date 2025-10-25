// src/app/admin/dashboard/__tests__/page.test.tsx
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminDashboard from '../page'; // Sesuaikan path jika perlu
import * as jobsApi from '@/lib/supabase/jobs'; // Mock module Supabase jobs
import { useRouter } from 'next/navigation'; // Mock next/navigation

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Supabase jobs functions
jest.mock('@/lib/supabase/jobs');
const mockGetJobs = jobsApi.getJobs as jest.Mock;
const mockUpdateJobStatus = jobsApi.updateJobStatus as jest.Mock;
const mockDeleteJob = jobsApi.deleteJob as jest.Mock;

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}));

// Mock window.confirm
global.confirm = jest.fn(() => true); // Default ke true (user mengonfirmasi)

// Contoh data job untuk testing
const mockJobsData = [
  {
    id: 'job1',
    job_title: 'Frontend Developer',
    status: 'active',
    created_at: new Date('2024-10-20').toISOString(),
    min_salary: 7000000,
    max_salary: 9000000,
    company_name: 'TechCorp',
  },
  {
    id: 'job2',
    job_title: 'Backend Engineer',
    status: 'inactive',
    created_at: new Date('2024-10-15').toISOString(),
    min_salary: 8000000,
    max_salary: 10000000,
    company_name: 'DataSys',
  },
  {
    id: 'job3',
    job_title: 'UI/UX Designer',
    status: 'draft',
    created_at: new Date('2024-10-22').toISOString(),
    min_salary: 6000000,
    max_salary: 8000000,
    company_name: 'Creative Solutions',
  },
];

describe('AdminDashboard', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    // Setup mock useRouter
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    // Mock getJobs response
    mockGetJobs.mockResolvedValue({ data: mockJobsData, error: null });
    // Reset other mocks
    mockUpdateJobStatus.mockClear();
    mockDeleteJob.mockClear();
    mockPush.mockClear();
    (global.confirm as jest.Mock).mockClear().mockReturnValue(true); // Reset confirm mock
  });

  // Test 1: Merender daftar job awal
  test('renders job list on initial load', async () => {
    render(<AdminDashboard />);

    // Tunggu data loading selesai
    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
      expect(screen.getByText('UI/UX Designer')).toBeInTheDocument();
    });

    // Cek jumlah job card
    const jobCards = screen.getAllByRole('article'); // Asumsi JobCardAdmin punya role 'article' atau cari cara lain
    expect(jobCards).toHaveLength(mockJobsData.length);

    // Cek quick stats
    expect(screen.getByText('Active Jobs').nextSibling).toHaveTextContent('1');
    expect(screen.getByText('Draft Jobs').nextSibling).toHaveTextContent('1');
    expect(screen.getByText('Total Jobs').nextSibling).toHaveTextContent('3');
  });

  // Test 2: Filtering berdasarkan keyword
  test('filters jobs based on search query', async () => {
    render(<AdminDashboard />);
    await waitFor(() => expect(mockGetJobs).toHaveBeenCalled()); // Pastikan data awal sudah load

    const searchInput = screen.getByPlaceholderText(/search by job details/i);
    fireEvent.change(searchInput, { target: { value: 'Frontend' } });

    // Cek hasil filter
    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      expect(screen.queryByText('Backend Engineer')).not.toBeInTheDocument();
      expect(screen.queryByText('UI/UX Designer')).not.toBeInTheDocument();
    });
  });

  // Test 3: Filtering berdasarkan status 'Active'
  test('filters jobs based on status filter button', async () => {
    render(<AdminDashboard />);
    await waitFor(() => expect(mockGetJobs).toHaveBeenCalled());

    const activeButton = screen.getByRole('button', { name: /active/i });
    fireEvent.click(activeButton);

    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      expect(screen.queryByText('Backend Engineer')).not.toBeInTheDocument();
      expect(screen.queryByText('UI/UX Designer')).not.toBeInTheDocument();
    });

    // Cek filter 'Inactive'
    const inactiveButton = screen.getByRole('button', { name: /inactive/i });
    fireEvent.click(inactiveButton);

    await waitFor(() => {
      expect(screen.queryByText('Frontend Developer')).not.toBeInTheDocument();
      expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
      expect(screen.queryByText('UI/UX Designer')).not.toBeInTheDocument();
    });
  });

  // Test 4: Sorting berdasarkan title (ascending)
  test('sorts jobs by title ascending', async () => {
      render(<AdminDashboard />);
      await waitFor(() => expect(mockGetJobs).toHaveBeenCalled());

      const titleSortButton = screen.getByRole('button', { name: /title/i });
      fireEvent.click(titleSortButton); // Klik pertama untuk ascending

      await waitFor(() => {
          const jobCards = screen.getAllByRole('article'); // Dapatkan ulang setelah sort
          const titles = jobCards.map(card => card.querySelector('h3')?.textContent); // Ambil judul dari h3
          expect(titles).toEqual([
              'Backend Engineer',
              'Frontend Developer',
              'UI/UX Designer',
          ]);
      });
  });

   // Test 5: Sorting berdasarkan title (descending)
  test('sorts jobs by title descending', async () => {
      render(<AdminDashboard />);
      await waitFor(() => expect(mockGetJobs).toHaveBeenCalled());

      const titleSortButton = screen.getByRole('button', { name: /title/i });
      fireEvent.click(titleSortButton); // Klik pertama (asc)
      fireEvent.click(titleSortButton); // Klik kedua (desc)

      await waitFor(() => {
          const jobCards = screen.getAllByRole('article');
          const titles = jobCards.map(card => card.querySelector('h3')?.textContent);
          expect(titles).toEqual([
              'UI/UX Designer',
              'Frontend Developer',
              'Backend Engineer',
          ]);
      });
  });

  // Test 6: Membuka modal Create Job
  test('opens create job modal when button is clicked', async () => {
    render(<AdminDashboard />);
    await waitFor(() => expect(mockGetJobs).toHaveBeenCalled());

    const createButton = screen.getByRole('button', { name: /create a new job/i });
    fireEvent.click(createButton);

    // Cek apakah modal muncul (berdasarkan title atau role)
    // Tunggu modal muncul
    expect(await screen.findByRole('dialog', { name: /create job opening/i })).toBeInTheDocument();
  });

   // Test 7: Memanggil fungsi delete saat tombol delete diklik dan dikonfirmasi
  test('calls deleteJob when delete action is confirmed', async () => {
    mockDeleteJob.mockResolvedValue({ error: null }); // Mock successful delete
    render(<AdminDashboard />);
    await waitFor(() => expect(mockGetJobs).toHaveBeenCalled());

    // Cari job card pertama (Frontend Developer)
    const frontendCard = screen.getByText('Frontend Developer').closest('article');
    expect(frontendCard).toBeInTheDocument();

    // Klik tombol action (...)
    const moreButton = within(frontendCard!).getByRole('button', { name: /more options/i }); // Ganti name jika berbeda
    fireEvent.click(moreButton);

    // Klik tombol delete di dropdown (tunggu dropdown muncul)
    const deleteButton = await screen.findByRole('button', { name: /delete job/i });
    fireEvent.click(deleteButton);

    // Pastikan window.confirm dipanggil
    expect(global.confirm).toHaveBeenCalledTimes(1);

    // Tunggu proses delete
    await waitFor(() => {
      expect(mockDeleteJob).toHaveBeenCalledWith('job1'); // Cek ID job
      // Cek apakah job card hilang
      expect(screen.queryByText('Frontend Developer')).not.toBeInTheDocument();
    });
  });

  // Test 8: Tidak memanggil delete jika konfirmasi dibatalkan
  test('does not call deleteJob when delete action is cancelled', async () => {
    (global.confirm as jest.Mock).mockReturnValue(false); // Mock user membatalkan
    render(<AdminDashboard />);
    await waitFor(() => expect(mockGetJobs).toHaveBeenCalled());

    const frontendCard = screen.getByText('Frontend Developer').closest('article');
    const moreButton = within(frontendCard!).getByRole('button', { name: /more options/i });
    fireEvent.click(moreButton);

    const deleteButton = await screen.findByRole('button', { name: /delete job/i });
    fireEvent.click(deleteButton);

    expect(global.confirm).toHaveBeenCalledTimes(1);
    expect(mockDeleteJob).not.toHaveBeenCalled();
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument(); // Job masih ada
  });

  // Tambahkan test case lain untuk:
  // - Aksi Edit
  // - Aksi Toggle Status
  // - Pagination (jika ada banyak data)
  // - Tampilan Empty State
});