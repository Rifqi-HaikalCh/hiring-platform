// src/app/notifications/__tests__/page.test.tsx
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react'; // Import act
import '@testing-library/jest-dom';
import NotificationsPage from '../page';
import * as notificationsApi from '@/lib/supabase/notifications';
import { AuthProvider, useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast'; // Impor toast

// --- Mocks ---
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
jest.mock('@/lib/supabase/notifications');
const mockGetUserNotifications = notificationsApi.getUserNotifications as jest.Mock;
// ... (mock fungsi lain tetap sama)
const mockMarkNotificationAsRead = notificationsApi.markNotificationAsRead as jest.Mock;
const mockMarkAllNotificationsAsRead = notificationsApi.markAllNotificationsAsRead as jest.Mock;
const mockDeleteNotification = notificationsApi.deleteNotification as jest.Mock;

jest.mock('@/contexts/AuthContext'); // Mock hook
const mockUseAuth = useAuth as jest.Mock;

jest.mock('react-hot-toast', () => ({ // Mock toast
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock data
const mockNotificationsData = [
    { id: 'notif1', user_id: 'test-user-id', title: 'Lamaran Diterima', message: 'Selamat!', type: 'status_change' as const, related_application_id: 'app1', is_read: false, created_at: new Date('2024-10-25T10:00:00Z').toISOString() },
    { id: 'notif2', user_id: 'test-user-id', title: 'Lamaran Sedang Ditinjau', message: 'Sedang ditinjau.', type: 'status_change' as const, related_application_id: 'app2', is_read: true, created_at: new Date('2024-10-24T15:30:00Z').toISOString() },
    { id: 'notif3', user_id: 'test-user-id', title: 'Lowongan Ditutup', message: 'Telah ditutup.', type: 'job_closed' as const, related_job_id: 'job4', is_read: false, created_at: new Date('2024-10-25T09:00:00Z').toISOString() },
];
// --- End Mocks ---

describe('NotificationsPage', () => {
  const mockPush = jest.fn();
  const mockUserId = 'test-user-id'; // Definisikan ID user

  beforeEach(() => {
    // Mock user logged in & loading false
    mockUseAuth.mockReturnValue({
      user: { id: mockUserId, email: 'test@example.com' },
      role: 'candidate',
      loading: false, // Penting: pastikan loading false
      // ... mocks lainnya untuk context
      setShowSplashScreen: jest.fn(), setSplashRedirectTo: jest.fn(), logout: jest.fn(),
    });
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    mockGetUserNotifications.mockResolvedValue({ data: [...mockNotificationsData], error: null });
    // Reset mocks
    mockGetUserNotifications.mockClear();
    mockMarkNotificationAsRead.mockClear();
    mockMarkAllNotificationsAsRead.mockClear();
    mockDeleteNotification.mockClear();
    mockPush.mockClear();
    (toast.error as jest.Mock).mockClear();
    (toast.success as jest.Mock).mockClear();

     // Mock ulang response jika perlu
    mockMarkNotificationAsRead.mockResolvedValue({ data: { ...mockNotificationsData[0], is_read: true }, error: null });
    mockMarkAllNotificationsAsRead.mockResolvedValue({ error: null });
    mockDeleteNotification.mockResolvedValue({ error: null });
  });

  // Test 1: Merender daftar notifikasi awal
  test('renders notifications list with all filter initially', async () => {
    render(
      // AuthProvider mungkin tidak perlu jika hook sudah di-mock
      // <AuthProvider>
        <NotificationsPage />
      // </AuthProvider>
    );

    // Tunggu mock API dipanggil SEBELUM memeriksa elemen
    await waitFor(() => {
        expect(mockGetUserNotifications).toHaveBeenCalledWith(mockUserId); // Cek ID user
    });

    // SEKARANG baru cek elemennya
    expect(screen.getByText('Lamaran Diterima')).toBeInTheDocument();
    expect(screen.getByText('Lamaran Sedang Ditinjau')).toBeInTheDocument();
    expect(screen.getByText('Lowongan Ditutup')).toBeInTheDocument();

    const notificationCards = screen.getAllByRole('article');
    expect(notificationCards).toHaveLength(mockNotificationsData.length);
    const allFilterButton = screen.getByRole('button', { name: /all \(\d+\)/i });
    expect(allFilterButton).toHaveClass('bg-gradient-to-r'); // Class aktif
  });

  // Test 2: Filtering
  test('filters notifications by unread status', async () => {
    render(<NotificationsPage />);
    // Tunggu mock API dipanggil dulu
    await waitFor(() => expect(mockGetUserNotifications).toHaveBeenCalled());

    // Filter 'Unread' (tidak perlu act karena hanya filter state lokal)
    const unreadFilterButton = screen.getByRole('button', { name: /unread \(\d+\)/i });
    fireEvent.click(unreadFilterButton);

    // Langsung cek hasilnya
    expect(screen.getByText('Lamaran Diterima')).toBeInTheDocument();
    expect(screen.queryByText('Lamaran Sedang Ditinjau')).not.toBeInTheDocument();
    expect(screen.getByText('Lowongan Ditutup')).toBeInTheDocument();
    const notificationCards = screen.getAllByRole('article');
    expect(notificationCards).toHaveLength(2);
  });

   // Test 3: Klik notifikasi unread
  test('calls markAsRead and navigates when unread notification is clicked', async () => {
    render(<NotificationsPage />);
    await waitFor(() => expect(mockGetUserNotifications).toHaveBeenCalled());

    const unreadNotificationCard = screen.getByText('Lamaran Diterima').closest('article');
    expect(unreadNotificationCard).toBeInTheDocument();
    expect(unreadNotificationCard).toHaveClass('border-l-teal-500');

    // Klik (bungkus dalam act jika ada state update)
    await act(async () => {
        if (unreadNotificationCard) {
            fireEvent.click(unreadNotificationCard);
        }
    });

    // Tunggu mock dipanggil
    await waitFor(() => {
      expect(mockMarkNotificationAsRead).toHaveBeenCalledWith('notif1');
      expect(mockPush).toHaveBeenCalledWith('/my-applications');
    });

     // Cek UI update (setelah waitFor mock)
     // Cari lagi elemennya setelah update state
     const updatedCard = await screen.findByText('Lamaran Diterima'); // Gunakan findByText
     expect(updatedCard.closest('article')).not.toHaveClass('border-l-teal-500');
  });


  // Test 4: Klik tombol 'Mark as read'
  test('calls markAsRead when "Mark as read" button is clicked', async () => {
    render(<NotificationsPage />);
    await waitFor(() => expect(mockGetUserNotifications).toHaveBeenCalled());

    const unreadNotificationCard = screen.getByText('Lamaran Diterima').closest('article');
    const markReadButton = within(unreadNotificationCard!).getByRole('button', { name: /mark as read/i });

     await act(async () => { // Bungkus dalam act
        fireEvent.click(markReadButton);
     });


    await waitFor(() => {
      expect(mockMarkNotificationAsRead).toHaveBeenCalledWith('notif1');
    });
     // Cek UI update setelah waitFor
    expect(within(unreadNotificationCard!).queryByRole('button', { name: /mark as read/i })).not.toBeInTheDocument();
    expect(unreadNotificationCard).not.toHaveClass('border-l-teal-500');

  });

  // Test 5: Klik 'Mark all as read'
  test('calls markAllAsRead when "Mark all as read" button is clicked', async () => {
    render(<NotificationsPage />);
    await waitFor(() => expect(mockGetUserNotifications).toHaveBeenCalled());

    const markAllButton = screen.getByRole('button', { name: /mark all as read/i });
     await act(async () => { // Bungkus dalam act
        fireEvent.click(markAllButton);
     });

    await waitFor(() => {
      expect(mockMarkAllNotificationsAsRead).toHaveBeenCalledWith(mockUserId);
    });
     // Cek UI update setelah waitFor
    const notificationCards = screen.getAllByRole('article');
    notificationCards.forEach(card => {
        expect(card).not.toHaveClass('border-l-teal-500');
        expect(within(card).queryByRole('button', { name: /mark as read/i })).not.toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /mark all as read/i })).not.toBeInTheDocument();

  });

  // Test 6: Klik delete
  test('calls deleteNotification when delete button is clicked', async () => {
     render(<NotificationsPage />);
    await waitFor(() => expect(mockGetUserNotifications).toHaveBeenCalled());

     const readNotificationCard = screen.getByText('Lamaran Sedang Ditinjau').closest('article');
     // Cari tombol delete berdasarkan title/aria-label jika ada, atau struktur
     const deleteButton = within(readNotificationCard!).getByRole('button', { name: /delete/i }); // Asumsi name atau aria-label ada

      await act(async () => { // Bungkus dalam act
        fireEvent.click(deleteButton);
      });

     await waitFor(() => {
         expect(mockDeleteNotification).toHaveBeenCalledWith('notif2');
     });
     // Cek UI update setelah waitFor
     expect(screen.queryByText('Lamaran Sedang Ditinjau')).not.toBeInTheDocument();
  });

  // Test 7: Empty state
  test('displays empty state when no notifications are found', async () => {
    mockGetUserNotifications.mockResolvedValue({ data: [], error: null });
     render(<NotificationsPage />);

     // Tunggu mock dipanggil dulu
     await waitFor(() => expect(mockGetUserNotifications).toHaveBeenCalled());

     // Cek empty state
     expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
     expect(screen.getByText(/you don't have any notifications yet/i)).toBeInTheDocument();
     expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

});