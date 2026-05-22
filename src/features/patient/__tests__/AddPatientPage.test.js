import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AddPatientPage from '../AddPatientPage';

// Mock the necessary modules
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

jest.mock('../../store', () => ({
  useAuthStore: () => ({
    role: 'admin',
    user: { userId: 'test-user' }
  })
}));

jest.mock('../../services/authService', () => ({
  getCurrentUser: () => ({ userId: 'test-user' })
}));

jest.mock('../shared/dataService', () => ({
  getProfiles: () => [
    { profileId: '1', name: 'Test Profile', testIds: [], packagePrice: 100 }
  ],
  getProfileById: () => ({ profileId: '1', name: 'Test Profile', testIds: [], packagePrice: 100 }),
  getProfileWithTests: () => ({ profileId: '1', name: 'Test Profile', tests: [], packagePrice: 100 }),
  searchTests: () => [],
  addTestToMaster: jest.fn(),
  addProfile: () => ({ profileId: '2', name: 'New Profile', testIds: [], packagePrice: null }),
  addPatient: () => ({ patientId: 'pat123', name: 'John Doe' }),
  createVisit: () => ({ visitId: 'visit123' }),
  getSettings: () => ({ allowStaffEditPrice: true, allowManualTests: true })
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('AddPatientPage', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'healit_profiles') {
        return JSON.stringify([
          { profileId: '1', name: 'Test Profile', testIds: [], packagePrice: 100, active: true }
        ]);
      }
      if (key === 'healit_settings') {
        return JSON.stringify({ allowStaffEditPrice: true, allowManualTests: true });
      }
      return null;
    });
  });

  test('renders patient registration form', () => {
    render(
      <BrowserRouter>
        <AddPatientPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Register Patient & Configure Tests')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Age *')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone Number *')).toBeInTheDocument();
  });

  test('shows validation errors for required fields', async () => {
    render(
      <BrowserRouter>
        <AddPatientPage />
      </BrowserRouter>
    );

    const submitButton = screen.getByText('Continue to Sample Collection →');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Full name is required')).toBeInTheDocument();
      expect(screen.getByText('Enter a valid 10-digit phone number')).toBeInTheDocument();
      expect(screen.getByText('Select a test profile to continue')).toBeInTheDocument();
    });
  });

  test('allows filling patient information', () => {
    render(
      <BrowserRouter>
        <AddPatientPage />
      </BrowserRouter>
    );

    const nameInput = screen.getByLabelText('Full Name *');
    const ageInput = screen.getByLabelText('Age *');
    const phoneInput = screen.getByLabelText('Phone Number *');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(ageInput, { target: { value: '30' } });
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });

    expect(nameInput.value).toBe('John Doe');
    expect(ageInput.value).toBe('30');
    expect(phoneInput.value).toBe('1234567890');
  });
});