// src/components/candidate/__tests__/JobCardCandidate.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { JobCardCandidate } from '../JobCardCandidate'; // Sesuaikan path jika perlu

// Contoh data job untuk testing
const mockJob = {
  id: 'job-123',
  title: 'Frontend Developer',
  company: 'Tech Corp',
  location: 'Jakarta',
  salaryRange: {
    min: 7000000,
    max: 9000000,
  },
  jobType: 'Full-time',
  companyLogo: 'https://example.com/logo.png',
};

describe('JobCardCandidate', () => {
  // Test 1: Merender detail job dengan benar
  test('renders job details correctly', () => {
    render(
      <JobCardCandidate
        job={mockJob}
        isActive={false}
        isApplied={false}
        onClick={jest.fn()}
      />
    );

    expect(screen.getByText(mockJob.title)).toBeInTheDocument();
    expect(screen.getByText(mockJob.company)).toBeInTheDocument();
    expect(screen.getByText(mockJob.location)).toBeInTheDocument();
    expect(screen.getByText(mockJob.jobType)).toBeInTheDocument();
    // Cek format salary (mungkin perlu disesuaikan dengan format di komponen)
    expect(screen.getByText(/Rp7\.000\.000 - Rp9\.000\.000/i)).toBeInTheDocument();
    // Cek logo (berdasarkan alt text atau src)
    expect(screen.getByAltText(mockJob.company)).toHaveAttribute('src', mockJob.companyLogo);
  });

  // Test 2: Merender style 'active' dengan benar
  test('applies active styles when isActive is true', () => {
    const { container } = render(
      <JobCardCandidate
        job={mockJob}
        isActive={true} // Set isActive ke true
        isApplied={false}
        onClick={jest.fn()}
      />
    );

    // Cek apakah class yang menandakan 'active' ada
    // Sesuaikan nama class ini dengan implementasimu (misalnya dari cn())
    const cardElement = container.firstChild; // Asumsi Card adalah elemen pertama
    expect(cardElement).toHaveClass('border-l-teal-600'); // Contoh class active
    expect(cardElement).toHaveClass('bg-teal-50');
  });

  // Test 3: Merender tampilan 'applied' dengan benar
  test('renders applied badge and styles when isApplied is true', () => {
    render(
      <JobCardCandidate
        job={mockJob}
        isActive={false}
        isApplied={true} // Set isApplied ke true
        onClick={jest.fn()}
      />
    );

    // Cek badge 'Applied'
    expect(screen.getByText(/applied/i)).toBeInTheDocument();
    // Cek apakah style disabled/opacity diterapkan
    const cardElement = screen.getByText(mockJob.title).closest('div[class*="opacity-"]'); // Cari parent dengan class opacity
    expect(cardElement).toHaveClass('opacity-60'); // Contoh class applied
  });

  // Test 4: Memanggil fungsi onClick saat kartu diklik
  test('calls onClick handler with job id when clicked', () => {
    const handleClick = jest.fn();
    render(
      <JobCardCandidate
        job={mockJob}
        isActive={false}
        isApplied={false}
        onClick={handleClick} // Berikan mock function
      />
    );

    // Klik kartu (elemen terluar atau elemen spesifik)
    const cardElement = screen.getByText(mockJob.title).closest('div[class*="cursor-pointer"]'); // Cari parent yang clickable
    if (cardElement) {
      fireEvent.click(cardElement);
    }

    // Cek apakah handleClick dipanggil dengan ID job yang benar
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(mockJob.id);
  });

  // Test 5: Merender fallback jika logo tidak ada
  test('renders fallback when companyLogo is not provided', () => {
    const jobWithoutLogo = { ...mockJob, companyLogo: undefined };
    render(
      <JobCardCandidate
        job={jobWithoutLogo}
        isActive={false}
        isApplied={false}
        onClick={jest.fn()}
      />
    );

    // Cek apakah fallback (misalnya inisial perusahaan) dirender
    // Cek elemen berdasarkan teks atau struktur
    expect(screen.getByText(jobWithoutLogo.company.charAt(0).toUpperCase())).toBeInTheDocument();
    // Pastikan img tidak ada
    expect(screen.queryByAltText(jobWithoutLogo.company)).not.toBeInTheDocument();
  });
});