import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  login: async (email, password) => {
    const response = await apiClient.post('/login', { email, password });
    return response.data;
  },

  uploadResume: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/upload-resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data; // { filename, text }
  },

  analyzeResume: async (filename, text) => {
    const response = await apiClient.post('/analyze-resume', { filename, text });
    return response.data; // Full report
  },

  analyzeJobDescription: async (resumeText, jdText) => {
    const response = await apiClient.post('/analyze-job-description', {
      resume_text: resumeText,
      jd_text: jdText,
    });
    return response.data; // { match_percentage, matching_skills, missing_skills }
  },

  getHistory: async () => {
    const response = await apiClient.get('/history');
    return response.data;
  },

  deleteHistory: async (id) => {
    const response = await apiClient.delete(`/history/${id}`);
    return response.data;
  },
};
