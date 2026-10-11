import axios from 'axios';

// Central API URL configuration (no trailing slash)
export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

// Create Axios client with 60s timeout for Render free server spin-up
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Listener callbacks for cold-start server status banner
const coldStartListeners = new Set();
export const onServerWaking = (callback) => {
  coldStartListeners.add(callback);
  return () => coldStartListeners.delete(callback);
};
const notifyServerWaking = (isWaking, message = '') => {
  coldStartListeners.forEach((cb) => cb(isWaking, message));
};

// Request Interceptor: Attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hirelens_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: 401 redirect & automatic retry with cold-start feedback
apiClient.interceptors.response.use(
  (response) => {
    notifyServerWaking(false);
    return response;
  },
  async (error) => {
    const config = error.config;

    // Handle 401 Unauthorized -> Clear credentials and redirect to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('hirelens_token');
      localStorage.removeItem('hirelens_user');
      if (window.location.pathname !== '/login') {
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login?redirect=${returnUrl}`;
      }
      return Promise.reject(error);
    }

    // Free tier sleeping detection (Network timeout or ECONNABORTED / 502 / 503 / 504)
    const isNetworkOrTimeout =
      error.code === 'ECONNABORTED' ||
      !error.response ||
      error.response.status >= 502;

    if (config && isNetworkOrTimeout) {
      config.__retryCount = config.__retryCount || 0;
      const MAX_RETRIES = 4;

      if (config.__retryCount < MAX_RETRIES) {
        config.__retryCount += 1;
        notifyServerWaking(
          true,
          `Waking up the server (free hosting), this can take up to a minute... (Attempt ${config.__retryCount}/${MAX_RETRIES})`
        );

        // Exponential backoff wait (2s, 4s, 6s, 8s)
        const delayMs = config.__retryCount * 2500;
        await new Promise((resolve) => setTimeout(resolve, delayMs));

        return apiClient(config);
      }
    }

    notifyServerWaking(false);
    return Promise.reject(error);
  }
);

// Silent ping to /health on app startup
export const pingServerHealth = async () => {
  try {
    await apiClient.get('/health', { timeout: 15000 });
    return true;
  } catch (err) {
    return false;
  }
};

export const api = {
  // Authentication
  register: async (name, email, password) => {
    const response = await apiClient.post('/auth/register', { name, email, password });
    if (response.data?.access_token) {
      localStorage.setItem('hirelens_token', response.data.access_token);
      localStorage.setItem('hirelens_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.data?.access_token) {
      localStorage.setItem('hirelens_token', response.data.access_token);
      localStorage.setItem('hirelens_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore if offline
    } finally {
      localStorage.removeItem('hirelens_token');
      localStorage.removeItem('hirelens_user');
    }
  },

  updateProfile: async (name) => {
    const response = await apiClient.put('/auth/profile', { name });
    if (response.data?.user) {
      localStorage.setItem('hirelens_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  changePassword: async (current_password, new_password) => {
    const response = await apiClient.put('/auth/password', { current_password, new_password });
    return response.data;
  },

  deleteAccount: async () => {
    const response = await apiClient.delete('/auth/account');
    localStorage.removeItem('hirelens_token');
    localStorage.removeItem('hirelens_user');
    return response.data;
  },

  // Resume operations
  uploadResume: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/upload-resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    return response.data; // { filename, text }
  },

  analyzeResume: async (filename, text, targetRole = 'Full-Stack Developer') => {
    const response = await apiClient.post('/analyze-resume', {
      filename,
      text,
      target_role: targetRole,
    });
    return response.data;
  },

  // Job Description Matching
  analyzeJobDescription: async (resumeText, jdText, roleTitle = 'Target Role', reportId = null) => {
    const response = await apiClient.post('/analyze-job-description', {
      resume_text: resumeText,
      jd_text: jdText,
      role_title: roleTitle,
      report_id: reportId,
    });
    return response.data;
  },

  getJdMatches: async () => {
    const response = await apiClient.get('/jd-matches');
    return response.data;
  },

  // Detailed Analysis Modules
  extractSkills: async (text) => {
    const response = await apiClient.post('/extract-skills', { text });
    return response.data;
  },

  calculateAtsScore: async (text) => {
    const response = await apiClient.post('/calculate-ats-score', { text });
    return response.data;
  },

  generateSuggestions: async (text) => {
    const response = await apiClient.post('/generate-suggestions', { text });
    return response.data;
  },

  keywordAnalysis: async (text, targetRole = 'Full-Stack Developer') => {
    const response = await apiClient.post('/keyword-analysis', {
      text,
      target_role: targetRole,
    });
    return response.data;
  },

  weakVerbAnalysis: async (text) => {
    const response = await apiClient.post('/weak-verb-analysis', { text });
    return response.data;
  },

  predictImprovement: async (currentScore, suggestions) => {
    const response = await apiClient.post('/predict-improvement', {
      current_score: currentScore,
      suggestions,
    });
    return response.data;
  },

  // History CRUD
  getHistory: async () => {
    const response = await apiClient.get('/history');
    return response.data;
  },

  getHistoryItem: async (id) => {
    const response = await apiClient.get(`/history/${id}`);
    return response.data;
  },

  deleteHistory: async (id) => {
    const response = await apiClient.delete(`/history/${id}`);
    return response.data;
  },

  healthCheck: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

export default api;
