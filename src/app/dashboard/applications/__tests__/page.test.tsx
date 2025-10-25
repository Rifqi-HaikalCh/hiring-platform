// src/app/dashboard/applications/__tests__/page.test.tsx
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
// PASTIKAN NAMA IMPOR INI BENAR sesuai nama ekspor di ../page.tsx
import MyApplicationsPage from '../page';
import * as applicationsApi from '@/lib/supabase/applications'; // Mock module Supabase applications
import { useAuth } from '@/contexts/AuthContext'; // Mock AuthContext hook
import { act } from 'react'; // Import act

// --- MOCKS ---

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock AuthContext hook
jest.mock('../../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock Supabase applications functions using RELATIVE PATH
// Path: ../../../../lib/supabase/applications
jest.mock('../../../../lib/supabase/applications'); // Cukup mock path-nya
// Definisikan mock function setelah mock path
const mockGetUserAppliedJobs = applicationsApi.getUserAppliedJobs as jest.Mock;
const mockDeleteApplication = applicationsApi.deleteApplication as jest.Mock;

// Mock react-hot-toast (bisa pakai alias, biasanya aman)
jest.mock('react-hot-toast', () => ({ /* ... */ }));

// Mock lottie-react (bisa pakai alias)
jest.mock('lottie-react', () => ({ /* ... */ }));

// Mock window.confirm
global.confirm = jest.fn(() => true);

// Mock ApplicationDetailsModal using RELATIVE PATH
// Path: ../../../../components/modals/ApplicationDetailsModal
jest.mock('../../../../components/modals/ApplicationDetailsModal', () => {
    const MockModal = ({ isOpen, onClose, application }: any) =>
    isOpen ? (
      <div data-testid="mock-details-modal" aria-label="Application Details">
        Mock Modal for {application?.job?.job_title}
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  MockModal.displayName = 'MockApplicationDetailsModal';
  return { __esModule: true, default: MockModal };
});

// Mock komponen kartu aplikasi using RELATIVE PATH
// Path: ../../../components/candidate/ApplicationCardCandidate
jest.mock('../../../components/candidate/ApplicationCardCandidate', () => {
    const MockCard = ({ application, onViewDetails, onWithdraw }: any) => (
        <article data-testid={`app-card-${application.id}`}>
            <h2>{application.job.job_title}</h2>
            <p>{application.status}</p>
            <button onClick={() => onViewDetails(application)}>View Details</button>
            <button onClick={() => onWithdraw(application.id)}>Withdraw Application</button>
        </article>
    );
    MockCard.displayName = 'MockApplicationCardCandidate';
    return { __esModule: true, default: MockCard };
});

// --- END MOCKS ---


// Contoh data user untuk AuthContext
const mockUser = {
  id: 'test-user-id',
  email: 'candidate@example.com',
};

// Contoh data aplikasi yang sudah di-transform
const mockAppliedJobsData = [
    {
    id: 'app1', job_id: 'job1', status: 'submitted' as const, created_at: new Date('2024-10-25').toISOString(),
    job: { id: 'job1', job_title: 'Frontend Developer', company_name: 'Tech Solutions', location: 'Jakarta', status: 'active' as const, },
    application_data: { full_name: 'Test User' }
  },
  {
    id: 'app2', job_id: 'job2', status: 'accepted' as const, created_at: new Date('2024-10-20').toISOString(),
    job: { id: 'job2', job_title: 'Backend Engineer', company_name: 'Data Systems', location: 'Bandung', status: 'active' as const, },
    application_data: { full_name: 'Test User' }
  },
  {
    id: 'app3', job_id: 'job3', status: 'rejected' as const, created_at: new Date('2024-10-18').toISOString(),
    job: { id: 'job3', job_title: 'UI/UX Designer', company_name: 'Creative Minds', location: 'Surabaya', status: 'inactive' as const, },
    application_data: { full_name: 'Test User' }
  },
];

// Helper render function
const renderPage = async () => {
    let result: ReturnType<typeof render>;
    await act(async () => {
        result = render(<MyApplicationsPage />);
    });
    // @ts-ignore
    return result;
}

describe('ApplicationsPage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser, loading: false });
    mockGetUserAppliedJobs.mockResolvedValue({ data: mockAppliedJobsData, error: null });
    mockDeleteApplication.mockResolvedValue({ error: null });
    (global.confirm as jest.Mock).mockClear().mockReturnValue(true);
    jest.clearAllMocks();
  });

  // Test 1: Merender daftar aplikasi
  test('renders list of applied jobs', async () => {
    await renderPage();
    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
      expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
      expect(screen.getByText('UI/UX Designer')).toBeInTheDocument();
    });
    const applicationCards = screen.getAllByRole('article');
    expect(applicationCards).toHaveLength(mockAppliedJobsData.length);
    expect(screen.getByText('submitted')).toBeInTheDocument();
    expect(screen.getByText('accepted')).toBeInTheDocument();
    expect(screen.getByText('rejected')).toBeInTheDocument();
  });

  // Test 2: Filtering berdasarkan status
  test('filters applications based on status', async () => {
    await renderPage();
    await waitFor(() => expect(mockGetUserAppliedJobs).toHaveBeenCalled());
    const acceptedFilterButton = screen.getByRole('button', { name: /accepted/i });
    fireEvent.click(acceptedFilterButton);
    await waitFor(() => {
      expect(screen.queryByText('Frontend Developer')).not.toBeInTheDocument();
      expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
      expect(screen.queryByText('UI/UX Designer')).not.toBeInTheDocument();
    });
    const allFilterButton = screen.getByRole('button', { name: /all applications/i });
    fireEvent.click(allFilterButton);
    await waitFor(() => {
        expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
        expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
        expect(screen.getByText('UI/UX Designer')).toBeInTheDocument();
     })
  });

  // Test 3: Membuka modal detail aplikasi
  test('opens details modal when view details is clicked', async () => {
    await renderPage();
    await waitFor(() => expect(screen.getByText('Frontend Developer')).toBeInTheDocument());
    const firstCard = screen.getByTestId('app-card-app1');
    const detailsButton = within(firstCard).getByRole('button', { name: /view details/i });
    fireEvent.click(detailsButton);
    await waitFor(() => {
        const modal = screen.getByTestId('mock-details-modal');
        expect(modal).toBeInTheDocument();
        expect(within(modal).getByText(/Mock Modal for Frontend Developer/i)).toBeInTheDocument();
    });
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    await waitFor(() => {
        expect(screen.queryByTestId('mock-details-modal')).not.toBeInTheDocument();
    })
  });

  // Test 4: Memanggil fungsi delete saat tombol delete diklik dan dikonfirmasi
  test('calls deleteApplication when delete action is confirmed', async () => {
    await renderPage();
    await waitFor(() => expect(screen.getByText('Frontend Developer')).toBeInTheDocument());
    const firstCard = screen.getByTestId('app-card-app1');
    const deleteButton = within(firstCard).getByRole('button', { name: /withdraw application/i });
    fireEvent.click(deleteButton);
    expect(global.confirm).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(mockDeleteApplication).toHaveBeenCalledWith('app1');
      expect(require('react-hot-toast').toast.success).toHaveBeenCalledWith('Application withdrawn successfully');
    });
    await waitFor(() => {
        expect(mockGetUserAppliedJobs).toHaveBeenCalledTimes(1);
     });
  });

  // Test 5: Tidak memanggil delete jika konfirmasi dibatalkan
  test('does not call deleteApplication when delete action is cancelled', async () => {
    (global.confirm as jest.Mock).mockReturnValue(false);
    await renderPage();
    await waitFor(() => expect(screen.getByText('Frontend Developer')).toBeInTheDocument());
    const firstCard = screen.getByTestId('app-card-app1');
    const deleteButton = within(firstCard).getByRole('button', { name: /withdraw application/i });
    fireEvent.click(deleteButton);
    expect(global.confirm).toHaveBeenCalledTimes(1);
    expect(mockDeleteApplication).not.toHaveBeenCalled();
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    expect(require('react-hot-toast').toast.success).not.toHaveBeenCalled();
  });

  // Test 6: Menampilkan Empty State jika tidak ada aplikasi
  test('shows empty state when no applications are found', async () => {
    mockGetUserAppliedJobs.mockResolvedValue({ data: [], error: null });
    await renderPage();
    await waitFor(() => {
        expect(screen.getByText(/you haven't applied for any jobs yet/i)).toBeInTheDocument();
        expect(screen.getByTestId('mock-lottie')).toBeInTheDocument();
        expect(screen.queryByRole('article')).not.toBeInTheDocument();
    });
  });

});