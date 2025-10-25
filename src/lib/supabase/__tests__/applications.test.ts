// src/lib/supabase/__tests__/applications.test.ts
import {
  extractCandidateData,
  checkAndDeactivateJobIfFull,
} from '@/lib/supabase/applications';
import { supabase } from '@/lib/supabase/client';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(), // 'from' adalah mock function yang akan kita kontrol
  },
}));

// Mock console.error
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Supabase Applications Utilities', () => {
  // --- Tests for extractCandidateData ---
  describe('extractCandidateData', () => {
    // (Tidak ada perubahan di sini, semua tes 'extractCandidateData' Anda sudah benar)
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
      const data = {
        linkedin_link: 'priorityLink',
        linkedin_url: 'secondaryUrl',
        linkedin: 'tertiary',
      };
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
      expect(extractCandidateData('not an object')).toEqual({});
    });
  });

  // --- Tests for checkAndDeactivateJobIfFull ---
  describe('checkAndDeactivateJobIfFull', () => {
    const jobId = 'full-job-id';

    // Definisikan mock untuk *akhir* dari Supabase chain
    let mockJobSingle: jest.Mock;
    let mockJobUpdate: jest.Mock;
    let mockJobUpdateEq: jest.Mock;
    let mockAppCountFinalEq: jest.Mock; // Mock untuk .eq('status', 'accepted')

    beforeEach(() => {
      // 1. Buat mock baru untuk setiap test
      mockJobSingle = jest.fn();
      mockJobUpdateEq = jest.fn().mockResolvedValue({ error: null }); // Default update sukses
      mockJobUpdate = jest.fn().mockReturnValue({ eq: mockJobUpdateEq }); // .update().eq()
      mockAppCountFinalEq = jest.fn(); // Ini akan di-await, jadi kita set di tiap test

      // 2. Bersihkan implementasi (supabase.from) sebelumnya
      (supabase.from as jest.Mock).mockClear();

      // 3. Set implementasi baru untuk (supabase.from)
      (supabase.from as jest.Mock).mockImplementation((tableName: string) => {
        if (tableName === 'jobs') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: mockJobSingle, // ...select().eq().single()
              }),
            }),
            update: mockJobUpdate, // ...update()
          };
        }
        if (tableName === 'applications') {
          // Ini untuk getAcceptedApplicationsCount: .select(...).eq(...).eq(...)
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: mockAppCountFinalEq, // Akhir dari chain
              }),
            }),
          };
        }
        // Default return untuk tabel lain (jika ada)
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
          update: jest.fn().mockReturnThis(),
        };
      });
    });

    test('should deactivate job if accepted count >= needed and status is active', async () => {
      // 1. Setup: Job butuh 1, status 'active'
      mockJobSingle.mockResolvedValue({
        data: { id: jobId, candidates_needed: 1, status: 'active' },
        error: null,
      });
      // 2. Setup: Count 'accepted' adalah 1
      mockAppCountFinalEq.mockResolvedValue({
        data: null,
        count: 1,
        error: null,
      });

      // 3. Run
      const result = await checkAndDeactivateJobIfFull(jobId);

      // 4. Assert
      expect(result.success).toBe(true);
      expect(result.deactivated).toBe(true);
      expect(mockJobUpdate).toHaveBeenCalledWith({ status: 'inactive' });
      expect(mockJobUpdateEq).toHaveBeenCalledWith('id', jobId); // Pastikan update job yang benar
    });

    test('should NOT deactivate job if accepted count < needed', async () => {
      // 1. Setup: Job butuh 2, status 'active'
      mockJobSingle.mockResolvedValue({
        data: { id: jobId, candidates_needed: 2, status: 'active' },
        error: null,
      });
      // 2. Setup: Count 'accepted' adalah 1
      mockAppCountFinalEq.mockResolvedValue({
        data: null,
        count: 1,
        error: null,
      });

      // 3. Run
      const result = await checkAndDeactivateJobIfFull(jobId);

      // 4. Assert
      expect(result.success).toBe(true);
      expect(result.deactivated).toBe(false);
      expect(mockJobUpdate).not.toHaveBeenCalled();
    });

    test('should NOT deactivate job if status is already inactive', async () => {
      // 1. Setup: Job butuh 1, status 'inactive'
      mockJobSingle.mockResolvedValue({
        data: { id: jobId, candidates_needed: 1, status: 'inactive' },
        error: null,
      });
      // 2. Setup: Count 'accepted' adalah 1
      mockAppCountFinalEq.mockResolvedValue({
        data: null,
        count: 1,
        error: null,
      });

      // 3. Run
      const result = await checkAndDeactivateJobIfFull(jobId);

      // 4. Assert
      expect(result.success).toBe(true);
      expect(result.deactivated).toBe(false);
      expect(mockJobUpdate).not.toHaveBeenCalled();
    });

    test('should return error if fetching job fails', async () => {
      // 1. Setup: Gagal fetch job
      mockJobSingle.mockResolvedValue({
        data: null,
        error: new Error('Failed to fetch job'),
      });
      // (Count tidak perlu di-setup karena fungsi akan return error duluan)

      // 3. Run
      const result = await checkAndDeactivateJobIfFull(jobId);

      // 4. Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect((result.error as Error).message).toBe('Failed to fetch job');
      expect(mockJobUpdate).not.toHaveBeenCalled();
    });

    test('should return error if fetching count fails', async () => {
      // 1. Setup: Job sukses fetch
      mockJobSingle.mockResolvedValue({
        data: { id: jobId, candidates_needed: 1, status: 'active' },
        error: null,
      });
      // 2. Setup: Gagal fetch count (promise di akhir chain di-reject)
      mockAppCountFinalEq.mockRejectedValue(new Error('Count failed'));

      // 3. Run
      const result = await checkAndDeactivateJobIfFull(jobId);

      // 4. Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect((result.error as Error).message).toBe('Count failed');
      expect(mockJobUpdate).not.toHaveBeenCalled();
    });

    test('should return error if updating job status fails', async () => {
      // 1. Setup: Job sukses fetch
      mockJobSingle.mockResolvedValue({
        data: { id: jobId, candidates_needed: 1, status: 'active' },
        error: null,
      });
      // 2. Setup: Count 'accepted' adalah 1
      mockAppCountFinalEq.mockResolvedValue({
        data: null,
        count: 1,
        error: null,
      });
      // 3. Setup: Gagal update status
      mockJobUpdateEq.mockResolvedValue({ error: new Error('Update failed') });

      // 4. Run
      const result = await checkAndDeactivateJobIfFull(jobId);

      // 5. Assert
      expect(result.success).toBe(false);
      expect(result.error).toBeInstanceOf(Error);
      expect((result.error as Error).message).toBe('Update failed');
    });
  });
});

// Kembalikan mock console.error ke implementasi asli
afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});