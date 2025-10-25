// src/components/modals/__tests__/ApplicationDetailsModal.test.tsx
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ApplicationDetailsModal } from '../ApplicationDetailsModal';
import * as applicationsApi from '@/lib/supabase/applications';

// Mock extractCandidateData
jest.mock('@/lib/supabase/applications', () => ({
  // Penting: Gunakan __esModule: true dan default jika diperlukan
  // Tergantung bagaimana kamu mengekspor extractCandidateData
  __esModule: true, // Coba tambahkan ini
  ...jest.requireActual('@/lib/supabase/applications'), // Pertahankan fungsi asli lainnya jika ada
  extractCandidateData: jest.fn((data) => ({ // Mock spesifik
    full_name: data?.full_name || 'Mock Name',
    email: data?.email || 'mock@email.com',
    phone: data?.phone_number || '+62MockPhone',
    gender: data?.gender || 'MockGender',
    date_of_birth: data?.date_of_birth || new Date('1990-01-01').toISOString(),
    domicile: data?.domicile || 'Mock Domicile',
    linkedin_url: data?.linkedin_link || 'https://linkedin.com/mock',
  })),
}));

// Contoh data aplikasi lengkap
const mockApplicationDetail = {
  id: 'app-detail-1',
  job_id: 'job-detail-1',
  status: 'accepted' as const,
  created_at: new Date('2024-10-20T08:00:00Z').toISOString(),
  application_data: {
    full_name: 'Detailed Candidate', email: 'detail@example.com', phone_number: '+628129876543', gender: 'Female', date_of_birth: new Date('1992-03-10').toISOString(), domicile: 'Bandung', linkedin_link: 'https://linkedin.com/in/detailed',
  },
  job: {
    id: 'job-detail-1', job_title: 'Senior Product Manager', job_type: 'Full-time', company_name: 'Innovate Hub', company_logo: 'https://example.com/innovate-logo.png', location: 'Bandung, West Java', department: 'Product', required_skills: ['Roadmap', 'Agile', 'Market Research'], min_salary: 15000000, max_salary: 20000000, status: 'active', job_description: "Lead product strategy...\nManage roadmap...",
  },
};

describe('ApplicationDetailsModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
    // Pastikan mock di-reset dan di-apply ulang
    (applicationsApi.extractCandidateData as jest.Mock).mockClear().mockImplementation((data: any) => ({
        full_name: data?.full_name || 'Mock Name', email: data?.email || 'mock@email.com', phone: data?.phone_number || '+62MockPhone', gender: data?.gender || 'MockGender', date_of_birth: data?.date_of_birth || new Date('1990-01-01').toISOString(), domicile: data?.domicile || 'Mock Domicile', linkedin_url: data?.linkedin_link || 'https://linkedin.com/mock',
    }));
  });

  test('renders modal with application details when open', async () => {
    await act(async () => { // Bungkus render dalam act
      render(
        <ApplicationDetailsModal
          isOpen={true}
          onClose={mockOnClose}
          application={mockApplicationDetail}
        />
      );
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(mockApplicationDetail.job.job_title)).toBeInTheDocument();
    expect(screen.getByText(mockApplicationDetail.job.company_name)).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByAltText(mockApplicationDetail.job.company_name)).toHaveAttribute('src', mockApplicationDetail.job.company_logo);

    expect(screen.getByText('Job Information')).toBeInTheDocument();
    expect(screen.getByText(mockApplicationDetail.job.job_type)).toBeInTheDocument();
    expect(screen.getByText(mockApplicationDetail.job.location)).toBeInTheDocument();
    expect(screen.getByText(mockApplicationDetail.job.department as string)).toBeInTheDocument();

    // Regex Salary yang lebih toleran terhadap spasi dan non-breaking space (\u00A0)
    expect(screen.getByText(/Rp\s*15\.000\.000\s*-\s*Rp\s*20\.000\.000/i)).toBeInTheDocument();

    expect(screen.getByText('Roadmap')).toBeInTheDocument();
    expect(screen.getByText('Agile')).toBeInTheDocument();

    expect(screen.getByText('Your Submitted Information')).toBeInTheDocument();
    expect(screen.getByText('Detailed Candidate')).toBeInTheDocument();
    expect(screen.getByText('detail@example.com')).toBeInTheDocument();
    expect(screen.getByText('+628129876543')).toBeInTheDocument();
    expect(screen.getByText('Female')).toBeInTheDocument();
    expect(screen.getByText('10 March 1992')).toBeInTheDocument();
    expect(screen.getByText('Bandung')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view profile/i })).toHaveAttribute('href', 'https://linkedin.com/in/detailed');

    expect(screen.getByText('20 October 2024')).toBeInTheDocument();
  });

  test('does not render modal when closed', () => {
    render(
      <ApplicationDetailsModal
        isOpen={false}
        onClose={mockOnClose}
        application={mockApplicationDetail}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', async () => {
     await act(async () => {
        render(
        <ApplicationDetailsModal
            isOpen={true}
            onClose={mockOnClose}
            application={mockApplicationDetail}
        />
        );
     });

    // Tombol close ada di header (ikon X) dan footer
    // Kita cari yang di footer saja untuk lebih mudah
    const closeButtonFooter = screen.getByRole('button', { name: /close/i });
    expect(closeButtonFooter).toBeInTheDocument();

    await act(async () => {
        fireEvent.click(closeButtonFooter);
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('renders fallback or hides optional fields when data is missing', async () => {
     const minimalApplication = {
        ...mockApplicationDetail,
        application_data: { full_name: 'Minimal Candidate', email: 'minimal@example.com', },
        job: { ...mockApplicationDetail.job, department: undefined, required_skills: undefined, company_logo: undefined, },
     };
     (applicationsApi.extractCandidateData as jest.Mock).mockReturnValue({
        full_name: 'Minimal Candidate', email: 'minimal@example.com', phone: '', gender: '', date_of_birth: '', domicile: '', linkedin_url: '',
     });

     await act(async () => {
        render(
        <ApplicationDetailsModal
            isOpen={true}
            onClose={mockOnClose}
            application={minimalApplication}
        />
        );
     });

     expect(screen.getByText('Minimal Candidate')).toBeInTheDocument();
     expect(screen.getByText('minimal@example.com')).toBeInTheDocument();
     // Cek bahwa label + value untuk field kosong tidak muncul
     // Cari berdasarkan parent container-nya
     const jobInfoContainer = screen.getByText('Job Information').closest('div');
     expect(jobInfoContainer).toBeInTheDocument();
     expect(within(jobInfoContainer!).queryByText(/department/i)).not.toBeInTheDocument(); // Cek label department
     expect(within(jobInfoContainer!).queryByText(/required skills/i)).not.toBeInTheDocument(); // Cek label skills

      const candidateInfoContainer = screen.getByText('Your Submitted Information').closest('div');
      expect(candidateInfoContainer).toBeInTheDocument();
      // Cari elemen yang menampilkan nomor telepon (mungkin span atau p)
      expect(within(candidateInfoContainer!).queryByText('+')).not.toBeInTheDocument(); // Nomor telepon biasanya dimulai dengan +
      expect(within(candidateInfoContainer!).queryByText(/gender/i)).not.toBeInTheDocument(); // Cek label gender


     expect(screen.getByText(minimalApplication.job.company_name.charAt(0).toUpperCase())).toBeInTheDocument();
     expect(screen.queryByAltText(minimalApplication.job.company_name)).not.toBeInTheDocument();
   });
});