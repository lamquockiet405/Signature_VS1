import React, { useState, useEffect } from 'react';
import { X, Smartphone, Key, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';
import { authAPI } from '../lib/api';

interface TOTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string) => void;
  onCancel: () => void;
}

const TOTPModal: React.FC<TOTPModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onCancel
}) => {
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [manualKey, setManualKey] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && step === 'setup') {
      setupTOTP();
    }
  }, [isOpen, step]);

  const setupTOTP = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔍 Setting up TOTP...');
      const response = await authAPI.totpSetup();
      console.log('📡 TOTP setup response:', response.data);
      
      if (response.data.success) {
        setQrCodeUrl(response.data.data.qrCodeUrl);
        setManualKey(response.data.data.manualEntryKey);
        console.log('✅ TOTP setup successful');
      } else {
        setError(response.data.message || 'Không thể tạo TOTP secret');
        console.error('❌ TOTP setup failed:', response.data.message);
      }
    } catch (error: any) {
      console.error('💥 TOTP setup error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError(error.response?.data?.message || 'Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!token.trim()) {
      setError('Vui lòng nhập mã từ Google Authenticator');
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('🔍 Verifying TOTP token:', token);
      const response = await authAPI.totpVerify(token);
      console.log('📡 TOTP verification response:', response.data);

      if (response.data.success) {
        console.log('✅ TOTP verification successful');
        onSuccess(token);
      } else {
        setError(response.data.message || 'Mã không hợp lệ');
        console.error('❌ TOTP verification failed:', response.data.message);
      }
    } catch (error: any) {
      console.error('💥 TOTP verification error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError(error.response?.data?.message || 'Lỗi kết nối server');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(manualKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleClose = () => {
    setStep('setup');
    setToken('');
    setError('');
    setQrCodeUrl('');
    setManualKey('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 'setup' ? '🔐 Thiết lập Google Authenticator' : '📱 Xác thực TOTP'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {step === 'setup' ? (
          <div className="space-y-4">
            <div className="text-center">
              <Smartphone className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Thiết lập Google Authenticator
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Quét QR code bằng ứng dụng Google Authenticator hoặc nhập mã thủ công
              </p>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Đang tạo QR code...</p>
              </div>
            ) : (
              <>
                {qrCodeUrl && (
                  <div className="text-center">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="mx-auto border border-gray-200 rounded-lg"
                    />
                  </div>
                )}

                {manualKey && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        Mã thủ công:
                      </label>
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Đã copy
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <code className="text-sm bg-white p-2 rounded border block break-all">
                      {manualKey}
                    </code>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Hướng dẫn:</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Mở ứng dụng Google Authenticator</li>
                    <li>2. Nhấn "+" để thêm tài khoản</li>
                    <li>3. Quét QR code hoặc nhập mã thủ công</li>
                    <li>4. Nhấn "Tiếp tục" để xác thực</li>
                  </ol>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={() => setStep('verify')}
                disabled={loading || !qrCodeUrl}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <Key className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Xác thực TOTP
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Nhập mã 6 chữ số từ Google Authenticator
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã xác thực:
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setStep('setup')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Quay lại
              </button>
              <button
                onClick={handleVerify}
                disabled={loading || token.length !== 6}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Đang xác thực...' : 'Xác thực'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TOTPModal;
