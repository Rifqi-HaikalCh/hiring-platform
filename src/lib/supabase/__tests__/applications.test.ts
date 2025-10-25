// src/lib/supabase/__tests__/applications.test.ts
import {
  extractCandidateData,
  checkAndDeactivateJobIfFull,
  // getAcceptedApplicationsCount // Import jika perlu diuji terpisah
} from '@/lib/supabase/applications'; // <-- Ubah path import
import * as jobsApi from '@/lib/supabase/jobs'; // <-- Ubah path import
import { supabase } from '@/lib/supabase/client'; // <-- Ubah path import

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({ // <-- Ubah path mock
  supabase: {
    from: jest.fn(),
  },
}));

// Mock jobsApi
jest.mock('@/lib/supabase/jobs', () => ({ // <-- Ubah path mock
    getJobById: jest.fn(),
    updateJobStatus: jest.fn(),
}));
const mockUpdateJobStatus = jobsApi.updateJobStatus as jest.Mock;
const mockGetJobById = jobsApi.getJobById as jest.Mock;

// Mock console.error
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Supabase Applications Utilities', () => {

  // --- Tests for extractCandidateData ---
  describe('extractCandidateData', () => {
    test('should extract data with standard keys', () => {
      const data = {
        full_name: 'John Doe',
        email: 'john@example.com',
        phone_number: '12345',
        date_of_birth: '1990-01-01',
        domicile: 'City A',
        gender: 'Male',
        linkedin_link: 'https://linkedin.com/in/johndoe',
      };
      const result = extractCandidateData(data);
      expect(result).toEqual({
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '12345',
        date_of_birth: '1990-01-01',
        domicile: 'City A',
        gender: 'Male',
        linkedin_url: 'https://linkedin.com/in/johndoe',
      });
    });

    test('should handle alternative keys', () => {
      const data = {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        phone: '67890',
        dateOfBirth: '1992-02-02',
        address: 'City B',
        gender: 'Female',
        linkedin_url: 'https://linkedin.com/in/janedoe',
      };
      const result = extractCandidateData(data);
       expect(result).toEqual({
        full_name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '67890',
        date_of_birth: '1992-02-02',
        domicile: 'City B',
        gender: 'Female',
        linkedin_url: 'https://linkedin.com/in/janedoe',
      });
    });

    test('should prioritize specific keys (e.g., phone_number over phone)', () => {
       const data = { phone_number: 'priority123', phone: 'secondary456' };
       const result = extractCandidateData(data);
       expect(result.phone).toBe('priority123');
    });

     test('should prioritize specific keys (e.g., linkedin_link over others)', () => {
       const data = { linkedin_link: 'priorityLink', linkedin_url: 'secondaryUrl', linkedin: 'tertiary' };
       const result = extractCandidateData(data);
       expect(result.linkedin_url).toBe('priorityLink');
    });

    test('should return empty strings for missing fields', () => {
      const data = { email: 'only@email.com' };
      const result = extractCandidateData(data);
      expect(result).toEqual({
        full_name: '',
        email: 'only@email.com',
        phone: '',
        date_of_birth: '',
        domicile: '',
        gender: '',
        linkedin_url: '',
      });
    });

    test('should handle null or undefined input', () => {
      expect(extractCandidateData(null)).toEqual({});
      expect(extractCandidateData(undefined)).toEqual({});
      expect(extractCandidateData("not an object")).toEqual({});
    });
  });

  // --- Tests for checkAndDeactivateJobIfFull ---
  describe('checkAndDeactivateJobIfFull', () => {
      const jobId = 'full-job-id';
      let mockSelect: jest.Mock;
      let mockUpdate: jest.Mock; // Definisikan mockUpdate di scope ini

      beforeEach(() => {
          // Reset mocks for supabase.from calls
          mockSelect = jest.fn();
          mockUpdate = jest.fn(() => ({ // Definisikan mockUpdate di sini
              eq: jest.fn().mockResolvedValue({ error: null }) // Assume update success
          }));

          (supabase.from as jest.Mock).mockImplementation((tableName: string) => {
              if (tableName === 'jobs') {
                  return {
                      select: jest.fn().mockReturnThis(),
                      eq: jest.fn().mockReturnThis(),
                      single: mockGetJobById, // Gunakan mock function ini untuk fetch job
                      update: mockUpdate, // Gunakan mock function ini untuk update
                  };
              }
              if (tableName === 'applications') {
                  return {
                      select: mockSelect.mockReturnThis(), // Return mockSelect untuk count
                      eq: jest.fn().mockReturnThis(),
                  };
              }
              return {};
          });
          // mockUpdateJobStatus.mockClear(); // Kita mock supabase.from('jobs').update langsung
          mockGetJobById.mockClear();
          mockSelect.mockClear(); // Reset mockSelect juga
      });

      test('should deactivate job if accepted count >= needed and status is active', async () => {
          mockGetJobById.mockResolvedValue({ data: { id: jobId, candidates_needed: 1, status: 'active' }, error: null });
          mockSelect.mockReturnValue({ // Mock hasil query count
             select: jest.fn().mockReturnThis(), // Chaining select
             eq: jest.fn().mockReturnThis(), // Chaining eq
             then: jest.fn(callback => callback({ data: null, count: 1, error: null })) // Return count
          });

          const result = await checkAndDeactivateJobIfFull(jobId);

          expect(result.success).toBe(true);
          expect(result.deactivated).toBe(true);
          // Cek apakah supabase.from('jobs').update dipanggil
          expect(mockUpdate).toHaveBeenCalledWith({ status: 'inactive' });
      });

      test('should NOT deactivate job if accepted count < needed', async () => {
          mockGetJobById.mockResolvedValue({ data: { id: jobId, candidates_needed: 2, status: 'active' }, error: null });
           mockSelect.mockReturnValue({
             select: jest.fn().mockReturnThis(),
             eq: jest.fn().mockReturnThis(),
             then: jest.fn(callback => callback({ data: null, count: 1, error: null }))
           });


          const result = await checkAndDeactivateJobIfFull(jobId);

          expect(result.success).toBe(true);
          expect(result.deactivated).toBe(false);
          expect(mockUpdate).not.toHaveBeenCalled(); // Pastikan update tidak dipanggil
      });

       test('should NOT deactivate job if status is already inactive', async () => {
          mockGetJobById.mockResolvedValue({ data: { id: jobId, candidates_needed: 1, status: 'inactive' }, error: null });
            mockSelect.mockReturnValue({
             select: jest.fn().mockReturnThis(),
             eq: jest.fn().mockReturnThis(),
             then: jest.fn(callback => callback({ data: null, count: 1, error: null }))
            });

          const result = await checkAndDeactivateJobIfFull(jobId);

          expect(result.success).toBe(true);
          expect(result.deactivated).toBe(false);
           expect(mockUpdate).not.toHaveBeenCalled();
      });

      test('should return error if fetching job fails', async () => {
          mockGetJobById.mockResolvedValue({ data: null, error: new Error('Failed to fetch job') });
          const result = await checkAndDeactivateJobIfFull(jobId);
          expect(result.success).toBe(false);
          expect(result.error).toBeInstanceOf(Error);
          expect(mockUpdate).not.toHaveBeenCalled();
      });

       test('should return error if fetching count fails', async () => {
          mockGetJobById.mockResolvedValue({ data: { id: jobId, candidates_needed: 1, status: 'active' }, error: null });
           mockSelect.mockReturnValue({
               select: jest.fn().mockReturnThis(),
               eq: jest.fn().mockReturnThis(),
               then: jest.fn(callback => callback({ data: null, count: null, error: new Error('Count failed') })) // Mock error saat count
           });
          const result = await checkAndDeactivateJobIfFull(jobId);
          expect(result.success).toBe(false);
          expect(result.error).toBeInstanceOf(Error);
          expect((result.error as Error).message).toBe('Count failed');
          expect(mockUpdate).not.toHaveBeenCalled();
      });

      test('should return error if updating job status fails', async () => {
          mockGetJobById.mockResolvedValue({ data: { id: jobId, candidates_needed: 1, status: 'active' }, error: null });
          mockSelect.mockReturnValue({
             select: jest.fn().mockReturnThis(),
             eq: jest.fn().mockReturnThis(),
             then: jest.fn(callback => callback({ data: null, count: 1, error: null }))
           });
          // Mock gagal update
          mockUpdate.mockImplementation(() => ({
             eq: jest.fn().mockResolvedValue({ error: new Error('Update failed') }) // Mock error saat update
          }));

          const result = await checkAndDeactivateJobIfFull(jobId);

          expect(result.success).toBe(false);
          expect(result.error).toBeInstanceOf(Error);
          expect((result.error as Error).message).toBe('Update failed');
      });
  });
});

// Kembalikan mock console.error ke implementasi asli setelah semua test selesai
afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});