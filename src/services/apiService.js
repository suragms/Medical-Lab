/**
 * Centralized API Service for HEALit Lab
 * Handles all HTTP requests to backend
 */

const API_BASE_URL = import.meta.env.PROD
  ? '/.netlify/functions/api'  // Production: Netlify Functions
  : 'http://localhost:8888/.netlify/functions/api';  // Development: Netlify Dev

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // ===== PATIENTS =====
  async getPatients() {
    return this.request('/patients');
  }

  async createPatient(patientData) {
    return this.request('/patients', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  }

  async updatePatient(patientId, updates) {
    return this.request(`/patients/${patientId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deletePatient(patientId) {
    return this.request(`/patients/${patientId}`, {
      method: 'DELETE',
    });
  }

  // ===== TEST RESULTS =====
  async getResults(patientId = null) {
    const query = patientId ? `?patientId=${patientId}` : '';
    return this.request(`/results${query}`);
  }

  async createResult(resultData) {
    return this.request('/results', {
      method: 'POST',
      body: JSON.stringify(resultData),
    });
  }

  async updateResult(resultId, updates) {
    return this.request(`/results/${resultId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // ===== FINANCIAL =====
  async getRevenue() {
    return this.request('/financial/revenue');
  }

  async createRevenue(revenueData) {
    return this.request('/financial/revenue', {
      method: 'POST',
      body: JSON.stringify(revenueData),
    });
  }

  async getExpenses() {
    return this.request('/financial/expenses');
  }

  async createExpense(expenseData) {
    return this.request('/financial/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  }

  async updateExpense(expenseId, updates) {
    return this.request(`/financial/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteExpense(expenseId) {
    return this.request(`/financial/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  }

  // ===== ACTIVITIES =====
  async getActivities(filters = {}) {
    const params = new URLSearchParams();
    if (filters.staffId) params.append('staffId', filters.staffId);
    if (filters.patientId) params.append('patientId', filters.patientId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/activities${query}`);
  }

  async createActivity(activityData) {
    return this.request('/activities', {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
  }

  // ===== SETTINGS =====
  async getSettings() {
    return this.request('/settings');
  }

  async updateSettings(settingsData) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    });
  }

  // ===== USERS =====
  async getUsers() {
    return this.request('/users');
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // ===== BULK SYNC =====
  async syncAllData(localData) {
    return this.request('/sync', {
      method: 'POST',
      body: JSON.stringify(localData),
    });
  }

  async getAllData() {
    return this.request('/sync');
  }

  // ===== HEALTH CHECK =====
  async healthCheck() {
    return this.request('/health');
  }
}

export const apiService = new ApiService();
export default apiService;
