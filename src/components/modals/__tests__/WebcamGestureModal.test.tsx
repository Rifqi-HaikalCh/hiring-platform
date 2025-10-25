// src/components/modals/__tests__/WebcamGestureModal.test.tsx
import React from 'react'; // Import React
import { render, screen, fireEvent, waitFor, within, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WebcamGestureModal } from '../WebcamGestureModal';

// --- Mocks ---
// Mock Webcam component correctly handling forwardRef
jest.mock('react-webcam', () => {
  const MockWebcam = React.forwardRef((props: any, ref: any) => ( // Use React.forwardRef
       <div data-testid="mock-webcam" {...props} ref={ref}>Mock Webcam</div>
   ));
  MockWebcam.displayName = 'MockWebcam'; // Add display name
  return MockWebcam;
});


const mockDetectForVideo = jest.fn().mockReturnValue({ landmarks: [] });
const mockCloseLandmarker = jest.fn();
const mockHandLandmarkerInstance = {
    detectForVideo: mockDetectForVideo,
    close: mockCloseLandmarker,
};
jest.mock('@mediapipe/tasks-vision', () => ({
  FilesetResolver: {
    forVisionTasks: jest.fn().mockResolvedValue({}),
  },
  HandLandmarker: {
    createFromOptions: jest.fn().mockResolvedValue(mockHandLandmarkerInstance),
  },
}));
// --- End Mocks ---


describe('WebcamGestureModal', () => {
  const mockOnClose = jest.fn();
  const mockOnCapture = jest.fn();

  // Store original mediaDevices
  const originalMediaDevices = navigator.mediaDevices;

  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnCapture.mockClear();
    // Mock navigator.mediaDevices using Object.defineProperty
    Object.defineProperty(navigator, 'mediaDevices', {
        value: {
            enumerateDevices: jest.fn().mockResolvedValue([]), // Mock enumerateDevices
            // Tambahkan mock fungsi lain jika diperlukan (getUserMedia, etc.)
        },
        writable: true // Buat properti bisa ditulis ulang untuk cleanup
    });

    // Reset mocks
    (jest.requireMock('@mediapipe/tasks-vision').HandLandmarker.createFromOptions as jest.Mock).mockClear().mockResolvedValue(mockHandLandmarkerInstance);
    mockDetectForVideo.mockClear().mockReturnValue({ landmarks: [] });
    mockCloseLandmarker.mockClear();
     // Reset mock enumerateDevices
    (navigator.mediaDevices.enumerateDevices as jest.Mock).mockClear().mockResolvedValue([]);
  });

   // Cleanup mediaDevices mock after tests
  afterAll(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: originalMediaDevices,
      writable: false, // Kembalikan ke read-only jika perlu
    });
  });


  test('renders modal when open and finishes loading', async () => {
    render(
      <WebcamGestureModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    );

    expect(screen.getByText(/loading ai model/i)).toBeInTheDocument();

    await waitFor(() => {
        expect(screen.queryByText(/loading ai model/i)).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('mock-webcam')).toBeInTheDocument();
    expect(screen.getByText(/follow the gesture sequence/i)).toBeInTheDocument();
    expect(screen.getByText(/one finger/i)).toBeInTheDocument();
  });

  test('does not render modal when closed', () => {
    render(
      <WebcamGestureModal
        isOpen={false}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', async () => {
     render(
      <WebcamGestureModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    );
     await waitFor(() => expect(screen.getByTestId('mock-webcam')).toBeInTheDocument());

     const dialog = screen.getByRole('dialog');
     // Cari tombol close (lebih baik gunakan querySelector jika role/name tidak stabil)
     // Asumsi tombolnya adalah button pertama di dalam header (Dialog.Panel > div pertama)
     const closeButton = within(dialog).getAllByRole('button')[0]; // Ambil button pertama

     expect(closeButton).toBeInTheDocument();

     await act(async () => {
        fireEvent.click(closeButton!);
     });
     expect(mockOnClose).toHaveBeenCalledTimes(1);
     expect(mockCloseLandmarker).toHaveBeenCalledTimes(1);
  });

  test('renders pose instructions correctly', async () => {
    render(
      <WebcamGestureModal
        isOpen={true}
        onClose={mockOnClose}
        onCapture={mockOnCapture}
      />
    );
    await waitFor(() => expect(screen.getByTestId('mock-webcam')).toBeInTheDocument());

    expect(screen.getByText('One Finger')).toBeInTheDocument();
    expect(screen.getByText('Two Fingers')).toBeInTheDocument();
    expect(screen.getByText('Three Fingers')).toBeInTheDocument();

    const poseInstructionsContainer = screen.getByText(/follow the gesture sequence/i).closest('div');
    expect(poseInstructionsContainer).toBeInTheDocument();

    // Pastikan container adalah HTMLElement sebelum menggunakan within
    if (!(poseInstructionsContainer instanceof HTMLElement)) {
        throw new Error('Instruction container not found or not an HTMLElement');
    }

    // Cari kartu instruksi (div di dalam container flex)
    const poseCards = within(poseInstructionsContainer).getAllByText(/finger/i).map(el => {
        const card = el.closest('div[class*="text-center"]'); // Cari parent card terdekat
        if (!(card instanceof HTMLElement)) {
            throw new Error('Pose card container not found or not an HTMLElement');
        }
        return card;
    });
    expect(poseCards.length).toBe(3);

    // Cari teks deskripsi di dalam kartu (yang sudah pasti HTMLElement)
    expect(within(poseCards[0]).getByText(/tunjukkan satu jari \(telunjuk\)/i)).toBeInTheDocument();
    expect(within(poseCards[1]).getByText(/tunjukkan dua jari \(peace sign\)/i)).toBeInTheDocument();
    expect(within(poseCards[2]).getByText(/tunjukkan tiga jari \(rock sign\)/i)).toBeInTheDocument();
  });

});