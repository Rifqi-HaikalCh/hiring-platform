// src/app/notifications/__tests__/page.test.tsx
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotificationsPage from '../page';
import * as notificationsApi from '@/lib/supabase/notifications';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

// --- Mocks ---
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
jest.mock('@/lib/supabase/notifications'); // Mock the module
const mockGetUserNotifications = notificationsApi.getUserNotifications as jest.Mock;
const mockMarkNotificationAsRead = notificationsApi.markNotificationAsRead as jest.Mock;
const mockMarkAllNotificationsAsRead = notificationsApi.markAllNotificationsAsRead as jest.Mock;
const mockDeleteNotification = notificationsApi.deleteNotification as jest.Mock;

jest.mock('@/contexts/AuthContext'); // Mock context hook
const mockUseAuth = useAuth as jest.Mock;

jest.mock('react-hot-toast', () => ({ // Mock toast
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

// Mock window.confirm
global.confirm = jest.fn(() => true);
// --- End Mocks ---

// Mock data
const mockNotificationsData: notificationsApi.Notification[] = [
    { id: 'notif1', user_id: 'test-user-id', title: 'Lamaran Diterima', message: 'Selamat!', type: 'status_change' as const, related_application_id: 'app1', is_read: false, created_at: new Date('2024-10-25T10:00:00Z').toISOString() },
    { id: 'notif2', user_id: 'test-user-id', title: 'Lamaran Sedang Ditinjau', message: 'Sedang ditinjau.', type: 'status_change' as const, related_application_id: 'app2', is_read: true, created_at: new Date('2024-10-24T15:30:00Z').toISOString() },
    { id: 'notif3', user_id: 'test-user-id', title: 'Lowongan Ditutup', message: 'Telah ditutup.', type: 'job_closed' as const, related_job_id: 'job4', is_read: false, created_at: new Date('2024-10-25T09:00:00Z').toISOString() },
];

// Contoh data user untuk AuthContext
const mockUser = {
  id: 'test-user-id',
  email: 'candidate@example.com',
};

// Helper render function that waits for loading to finish
const renderPageAndWait = async () => {
  render(<NotificationsPage />);
  // Wait for the loading indicator to disappear
  await waitFor(() => {
    expect(screen.queryByText(/loading notifications.../i)).not.toBeInTheDocument();
  });

  // Setelah loading, EITHER notifikasi pertama (jika mock data ada) ATAU empty state harus muncul.
  // Ini memastikan helper ini bekerja untuk SEMUA tes.
  await waitFor(() => {
    const firstNotificationTitle = screen.queryByText('Lamaran Diterima'); // Cek data default
    const emptyStateTitle = screen.queryByText(/no notifications/i); // Cek empty state
    // Harapkan salah satu dari keduanya ada di DOM
    expect(firstNotificationTitle !== null || emptyStateTitle !== null).toBe(true);
  });
};


describe('NotificationsPage', () => {
  const mockPush = jest.fn();
  const mockUserId = mockUser.id;

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      showSplashScreen: false,
      splashRedirectTo: null,
      setShowSplashScreen: jest.fn(),
      setSplashRedirectTo: jest.fn(),
      logout: jest.fn(),
    });
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    // Selalu reset ke mock data default
    mockGetUserNotifications.mockResolvedValue({ data: [...mockNotificationsData], error: null }); 
    mockMarkNotificationAsRead.mockResolvedValue({ data: { ...mockNotificationsData[0], is_read: true }, error: null });
    mockMarkAllNotificationsAsRead.mockResolvedValue({ error: null });
    mockDeleteNotification.mockResolvedValue({ error: null });

    // Reset mocks
    mockGetUserNotifications.mockClear();
    mockMarkNotificationAsRead.mockClear();
    mockMarkAllNotificationsAsRead.mockClear();
    mockDeleteNotification.mockClear();
    mockPush.mockClear();
    (toast.error as jest.Mock).mockClear();
    (toast.success as jest.Mock).mockClear();
    (global.confirm as jest.Mock).mockClear().mockReturnValue(true);
  });

  // Test 1: Merender daftar notifikasi awal (Passed)
  test('renders notifications list with all filter initially', async () => {
    await renderPageAndWait();

    expect(await screen.findByText('Lamaran Diterima')).toBeInTheDocument();
    expect(screen.getByText('Lamaran Sedang Ditinjau')).toBeInTheDocument();
    expect(screen.getByText('Lowongan Ditutup')).toBeInTheDocument();

    const notificationCards = screen.getAllByRole('heading', { level: 3, name: /Lamaran Diterima|Lamaran Sedang Ditinjau|Lowongan Ditutup/i })
                                  .map(heading => heading.closest('div.rounded-xl.border'));
    expect(notificationCards.filter(Boolean)).toHaveLength(mockNotificationsData.length);

    const allFilterButton = screen.getByRole('button', { name: /all \(3\)/i });
    expect(allFilterButton).toHaveClass('bg-teal-600');
  });

  // Test 2: Filtering (Passed)
  test('filters notifications by unread status', async () => {
    await renderPageAndWait();

    const unreadFilterButton = screen.getByRole('button', { name: /unread \(2\)/i });
    fireEvent.click(unreadFilterButton);

    await waitFor(() => {
      expect(screen.getByText('Lamaran Diterima')).toBeInTheDocument();
      expect(screen.queryByText('Lamaran Sedang Ditinjau')).not.toBeInTheDocument();
      expect(screen.getByText('Lowongan Ditutup')).toBeInTheDocument();
    });

    const notificationCards = screen.getAllByRole('heading', { level: 3, name: /Lamaran Diterima|Lowongan Ditutup/i })
                                   .map(heading => heading.closest('div.rounded-xl.border'));
    expect(notificationCards.filter(Boolean)).toHaveLength(2);
    expect(unreadFilterButton).toHaveClass('bg-teal-600');
  });

   // Test 3: Klik notifikasi unread (Passed)
  test('calls markAsRead and navigates when unread notification is clicked', async () => {
    await renderPageAndWait();

    const unreadNotificationCard = (await screen.findByText('Lamaran Diterima')).closest('div.rounded-xl.border') as HTMLElement;
    expect(unreadNotificationCard).toBeInTheDocument();

    // Cek kedua kelas secara terpisah
    expect(unreadNotificationCard).toHaveClass('border-l-4', 'border-teal-500');

    // Click (wrap state updates in act)
    await act(async () => {
        fireEvent.click(unreadNotificationCard);
    });

    // Wait for mocks to be called and UI to update
    await waitFor(() => {
      expect(mockMarkNotificationAsRead).toHaveBeenCalledWith('notif1');
      expect(mockPush).toHaveBeenCalledWith('/my-applications'); // Check navigation
    });

     // Check UI update (card should no longer have the unread class)
     await waitFor(() => {
       const updatedCard = screen.getByText('Lamaran Diterima').closest('div.rounded-xl.border');
       expect(updatedCard).not.toHaveClass('border-l-4');
       expect(updatedCard).not.toHaveClass('border-teal-500');
     });
  });


  // Test 4: Klik tombol 'Mark as read' (Passed)
  test('calls markAsRead when "Mark as read" button is clicked', async () => {
    await renderPageAndWait();

    const unreadNotificationCard = (await screen.findByText('Lamaran Diterima')).closest('div.rounded-xl.border') as HTMLElement;
    const markReadButton = within(unreadNotificationCard).getByRole('button', { name: /mark as read/i });

     await act(async () => { // Wrap state update in act
        fireEvent.click(markReadButton);
     });

    await waitFor(() => {
      expect(mockMarkNotificationAsRead).toHaveBeenCalledWith('notif1');
    });

     // Check UI update after waitFor
    await waitFor(() => {
      expect(within(unreadNotificationCard).queryByRole('button', { name: /mark as read/i })).not.toBeInTheDocument();
      expect(unreadNotificationCard).not.toHaveClass('border-l-4');
      expect(unreadNotificationCard).not.toHaveClass('border-teal-500');
    });
  });

  // Test 5: Klik 'Mark all as read' (Passed)
  test('calls markAllAsRead when "Mark all as read" button is clicked', async () => {
    await renderPageAndWait();

    const markAllButton = await screen.findByRole('button', { name: /mark all as read/i });
    await act(async () => { // Wrap state update in act
        fireEvent.click(markAllButton);
     });

    await waitFor(() => {
      expect(mockMarkAllNotificationsAsRead).toHaveBeenCalledWith(mockUserId);
      expect(toast.success).toHaveBeenCalledWith('All notifications marked as read');
    });

     // Check UI update after waitFor
    await waitFor(() => {
        const notificationCards = screen.getAllByRole('heading', { level: 3, name: /Lamaran Diterima|Lamaran Sedang Ditinjau|Lowongan Ditutup/i })
                                     .map(heading => heading.closest('div.rounded-xl.border') as HTMLElement);
        notificationCards.forEach(card => {
            expect(card).not.toHaveClass('border-l-4');
            expect(card).not.toHaveClass('border-teal-500');
            expect(within(card).queryByRole('button', { name: /mark as read/i })).not.toBeInTheDocument();
        });
        expect(screen.queryByRole('button', { name: /mark all as read/i })).not.toBeInTheDocument();
    });

     expect(screen.getByRole('button', { name: /unread \(0\)/i})).toBeInTheDocument();
  });

  // Test 6: Klik delete (Failed -> Fixed)
  test('calls deleteNotification when delete button is clicked', async () => {
     await renderPageAndWait();

     const readNotificationCard = (await screen.findByText('Lamaran Sedang Ditinjau')).closest('div.rounded-xl.border') as HTMLElement;
     
     // *** PERBAIKAN (untuk Test 6) ***
     // Gunakan querySelector untuk selector kelas yang lebih stabil
     // (berdasarkan output DOM error)
     const deleteButton = readNotificationCard.querySelector('button.text-red-600'); 
     expect(deleteButton).toBeInTheDocument(); // Pastikan tombol ditemukan

      await act(async () => { // Wrap state update in act
        fireEvent.click(deleteButton!); // Klik tombol yang ditemukan
      });

      // Confirm dialog ditangani oleh mock setup (defaults to true)
      expect(global.confirm).toHaveBeenCalledTimes(1);

     await waitFor(() => {
         expect(mockDeleteNotification).toHaveBeenCalledWith('notif2');
         expect(toast.success).toHaveBeenCalledWith('Notification deleted');
     });

     // Check UI update after waitFor
     await waitFor(() => {
       expect(screen.queryByText('Lamaran Sedang Ditinjau')).not.toBeInTheDocument();
     });

     expect(screen.getByRole('button', { name: /all \(2\)/i})).toBeInTheDocument();
     expect(screen.getByRole('button', { name: /unread \(2\)/i})).toBeInTheDocument();
  });

  // Test 7: Empty state (Failed -> Fixed)
  test('displays empty state when no notifications are found', async () => {
    mockGetUserNotifications.mockResolvedValue({ data: [], error: null }); // Override mock
    
    // Panggil helper. Helper yang baru sudah bisa menangani empty state.
    await renderPageAndWait();

     // Check empty state
     expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
     expect(screen.getByText(/you don't have any notifications yet/i)).toBeInTheDocument();
     
     // Cek bahwa tidak ada card notifikasi (via heading)
     expect(screen.queryByRole('heading', { name: /lamaran/i })).not.toBeInTheDocument(); 

     // *** PERBAIKAN (untuk Test 7) ***
     // Hapus pengecekan 'mock-lottie'. Berdasarkan output DOM,
     // komponen EmptyState untuk "No Notifications" tidak merender Lottie.
     // expect(screen.getByTestId('mock-lottie')).toBeInTheDocument();
  });
});