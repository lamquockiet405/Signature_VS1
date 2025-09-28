import React, { useState, useEffect } from 'react';
import { X, Mail, Clock, AlertCircle, CheckCircle, Smartphone, Key } from 'lucide-react';
import { otpAPI } from '../lib/api';
import toast from 'react-hot-toast';
import TOTPModal from './TOTPModal';

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sessionId: string) => void;
  userEmail?: string;
}

const OTPModal: React.FC<OTPModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  userEmail 
}) => {
  const [otpCode, setOtpCode] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [authMethod, setAuthMethod] = useState<'email' | 'totp' | null>(null);
  const [showTOTPModal, setShowTOTPModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAuthMethod(null);
      setOtpCode('');
      setSessionId('');
      setTimeLeft(0);
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleSendOTP = async () => {
    setIsSending(true);
    try {
      const response = await otpAPI.sendOTP(userEmail);
      if (response.data.success) {
        setSessionId(response.data.sessionId);
        setExpiresAt(new Date(response.data.expiresAt));
        setTimeLeft(5 * 60); // 5 minutes
        toast.success('Mã OTP đã được gửi đến email của bạn');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể gửi mã OTP');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      toast.error('Vui lòng nhập đúng 6 chữ số');
      return;
    }

    setIsLoading(true);
    try {
      const response = await otpAPI.verifyOTP(sessionId, otpCode);
      if (response.data.success) {
        toast.success('Xác thực OTP thành công');
        onSuccess(sessionId);
        onClose();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Mã OTP không đúng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timeLeft > 0) {
      toast.error(`Vui lòng đợi ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')} để gửi lại`);
      return;
    }
    await handleSendOTP();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTOTPSuccess = (token: string) => {
    // Tạo một sessionId giả cho TOTP (không cần session thực sự)
    const fakeSessionId = `totp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    onSuccess(fakeSessionId);
    setShowTOTPModal(false);
    onClose();
  };

  const handleTOTPCancel = () => {
    setShowTOTPModal(false);
    setAuthMethod(null);
  };

  if (!isOpen) return null;

  // Nếu chưa chọn phương thức xác thực
  if (!authMethod) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Chọn phương thức xác thực
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600 text-center">
              Vui lòng chọn phương thức xác thực để tiếp tục
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setAuthMethod('email');
                  handleSendOTP();
                }}
                className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-3"
              >
                <Mail className="h-8 w-8 text-blue-500" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Email OTP</div>
                  <div className="text-sm text-gray-500">Nhận mã qua email</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setAuthMethod('totp');
                  setShowTOTPModal(true);
                }}
                className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-3"
              >
                <Smartphone className="h-8 w-8 text-green-500" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Google Authenticator</div>
                  <div className="text-sm text-gray-500">Sử dụng ứng dụng TOTP</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <TOTPModal
          isOpen={showTOTPModal}
          onClose={handleTOTPCancel}
          onSuccess={handleTOTPSuccess}
          onCancel={handleTOTPCancel}
        />
      </div>
    );
  }

  // Nếu đã chọn phương thức xác thực
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {authMethod === 'email' ? 'Xác thực OTP Email' : 'Xác thực TOTP'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {authMethod === 'email' && (
          <div className="space-y-4">
            <div className="text-center">
              <Mail className="mx-auto h-12 w-12 text-blue-500 mb-2" />
              <p className="text-gray-600">
                Mã OTP đã được gửi đến email của bạn
              </p>
              {userEmail && (
                <p className="text-sm text-gray-500 mt-1">{userEmail}</p>
              )}
            </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Nhập mã OTP (6 chữ số)
            </label>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtpCode(value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest"
              placeholder="000000"
              maxLength={6}
              disabled={isLoading}
            />
          </div>

          {timeLeft > 0 && (
            <div className="flex items-center justify-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              Mã OTP hết hạn sau: {formatTime(timeLeft)}
            </div>
          )}

          {timeLeft === 0 && sessionId && (
            <div className="flex items-center justify-center text-sm text-red-500">
              <AlertCircle className="h-4 w-4 mr-1" />
              Mã OTP đã hết hạn
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleResendOTP}
              disabled={isSending || timeLeft > 0}
              className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? 'Đang gửi...' : 'Gửi lại OTP'}
            </button>
            
            <button
              onClick={handleVerifyOTP}
              disabled={isLoading || otpCode.length !== 6}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang xác thực...' : 'Xác thực'}
            </button>
          </div>

            <div className="text-xs text-gray-500 text-center">
              <p>• Mã OTP có hiệu lực trong 5 phút</p>
              <p>• Vui lòng không chia sẻ mã này với bất kỳ ai</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OTPModal;
