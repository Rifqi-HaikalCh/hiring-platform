// jest.setup.js
import '@testing-library/jest-dom';
import { mockAnimationsApi } from 'jsdom-testing-mocks';
import dotenv from 'dotenv'; // Import dotenv

// Muat variabel dari .env.test SEBELUM mock lain dijalankan
dotenv.config({ path: '.env.test' });

// Mock API animasi
mockAnimationsApi();

// Opsional: Tambahkan mock global lain di sini jika perlu
// Contoh: Mock matchMedia (sering dibutuhkan untuk UI responsif)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});