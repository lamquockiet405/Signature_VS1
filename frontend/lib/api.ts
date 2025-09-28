import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      Cookies.remove('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: {
    username: string;
    email: string;
    password: string;
    mst?: string;
    full_name: string;
    phone?: string;
    organization?: string;
  }) => api.post('/auth/register', userData),
  
  logout: () => api.post('/auth/logout'),
  
  getMe: () => api.get('/auth/me'),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),

  // TOTP API
  totpSetup: () => api.post('/auth/totp/setup'),
  totpVerify: (token: string) => api.post('/auth/totp/verify', { token }),
  totpStatus: () => api.get('/auth/totp/status'),
  totpDisable: () => api.post('/auth/totp/disable'),
  totpAuthenticate: (token: string) => api.post('/auth/totp/authenticate', { token }),
  totpDebug: () => api.get('/auth/totp/debug'),
};


// OTP API
export const otpAPI = {
  sendOTP: (email?: string, method = 'email') =>
    api.post('/otp/send', { email, method }),
  
  verifyOTP: (sessionId: string, otpCode: string) =>
    api.post('/otp/verify', { sessionId, otpCode }),
  
  getOTPStatus: (sessionId: string) =>
    api.get(`/otp/status/${sessionId}`),
  
  getOTPInfo: (sessionId: string) =>
    api.get(`/otp/info/${sessionId}`),
  
  deleteOTP: (sessionId: string) =>
    api.delete(`/otp/${sessionId}`),
};

// File API
export const fileAPI = {
  // Restore simple upload
  simpleUpload: (file: globalThis.File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/files/simple-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getFiles: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/files', { params }),
  getFile: (id: string) => api.get(`/files/${id}`),
  deleteFile: (id: string) => api.delete(`/files/${id}`),
  getViewerUrl: (id: string) => api.get(`/files/${id}/viewer-url`),
  getAdobeStatus: () => api.get('/files/adobe/status'),
  verifyUploadedFile: (id: string) => api.post(`/files/${id}/verify`),
  // PKCS#7 Digital Signing
  signFile: (id: string, data: { reason?: string; location?: string }) =>
    api.post(`/files/${id}/sign`, data),
  verifySignature: (id: string) => api.post(`/files/${id}/verify-signature`),
  getCertificateInfo: () => api.get('/files/certificate/info'),
  getSignatureInfo: (id: string) => api.get(`/files/${id}/signature-info`),
  processExistingFile: (
    id: string,
    meta: { company_name: string; reason: string; location: string; sign_datetime?: string }
  ) => api.post(`/files/${id}/process`, meta),
};

// Sign API
export const signAPI = {
  startSign: (data: { fileId: string; certificateId: string }) =>
    api.post('/sign/start', data),
  
  getSignStatus: (signatureId: string) => api.get(`/sign/status/${signatureId}`),
  
  verifySignature: (signatureId: string) => api.post('/sign/verify', { signatureId }),
};

// Signature API
export const signatureAPI = {
  createSignature: (data: {
    signatureData: string;
    documentId: string;
    documentType?: string;
    signerInfo?: {
      signer_name: string;
      reason: string;
      location: string;
      sign_datetime: string;
    };
  }) => api.post('/signatures/create', data),
  
  getSignatures: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/signatures', { params }),
  
  getSignature: (id: string) => api.get(`/signatures/${id}`),
  
  verifySignature: (id: string) => api.post(`/signatures/${id}/verify`),
  
  downloadSignature: (id: string) => api.get(`/signatures/${id}/download`, {
    responseType: 'blob',
  }),
  
  deleteSignature: (id: string) => api.delete(`/signatures/${id}`),

  verifySignatureImage: (id: string, file: globalThis.File, otp: { session: string; code: string }) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('otp_session', otp.session);
    formData.append('code', otp.code);
    return api.post(`/signatures/${id}/verify-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
