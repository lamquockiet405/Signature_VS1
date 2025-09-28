import React, { useState } from 'react';
import api from '../lib/api';

interface IntegrityResult {
  fileName: string;
  checkTime: string;
  status: 'valid' | 'warning' | 'invalid' | 'no_signature';
  color: 'green' | 'yellow' | 'red' | 'gray';
  message: string;
  summary: {
    hasSignature: boolean;
    signatureCount: number;
    issuesCount: number;
    warningsCount: number;
  };
  details: {
    hasSignature: boolean;
    signatureCount: number;
    issues: string[];
    warnings: string[];
    recommendations: string[];
  };
  adobeInstructions: {
    title: string;
    steps: Array<{
      step: number;
      title: string;
      description: string;
      url?: string;
      indicators?: {
        green: string;
        yellow: string;
        red: string;
      };
      details?: string[];
    }>;
    tips: string[];
  };
}

interface AdobeIntegrityCheckerProps {
  fileId: number;
  fileName: string;
  onClose: () => void;
}

const AdobeIntegrityChecker: React.FC<AdobeIntegrityCheckerProps> = ({
  fileId,
  fileName,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntegrityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const checkIntegrity = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Kiểm tra api có được định nghĩa không
      if (!api) {
        throw new Error('API client không được khởi tạo');
      }

      console.log('🔍 Starting integrity check for file ID:', fileId);
      const response = await api.post(`/files/${fileId}/check-integrity`);
      
      console.log('✅ Integrity check response:', response.data);
      
      if (response.data.success) {
        setResult(response.data.data);
        console.log('✅ Integrity check result:', response.data.data);
      } else {
        const errorMessage = response.data.message || 'Có lỗi xảy ra khi kiểm tra tính toàn vẹn';
        console.error('❌ Integrity check failed:', errorMessage);
        setError(errorMessage);
      }
    } catch (err: any) {
      console.error('❌ Integrity check error:', err);
      console.error('Error response:', err.response?.data);
      
      let errorMessage = 'Không thể kiểm tra tính toàn vẹn tài liệu';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Thêm thông tin chi tiết nếu có
      if (err.response?.data?.error) {
        errorMessage += ` (Chi tiết: ${err.response.data.error.message || 'Unknown error'})`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'invalid':
        return '❌';
      case 'no_signature':
        return '📄';
      default:
        return '❓';
    }
  };

  const getStatusColor = (color: string) => {
    switch (color) {
      case 'green':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'yellow':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'red':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'gray':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadgeColor = (color: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-800';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800';
      case 'red':
        return 'bg-red-100 text-red-800';
      case 'gray':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              🔍 Kiểm tra tính toàn vẹn tài liệu
            </h2>
            <p className="text-sm text-gray-600 mt-1">{fileName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Check Button */}
          <div className="mb-6">
            <button
              onClick={checkIntegrity}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang kiểm tra...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Kiểm tra tính toàn vẹn
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-700 font-medium">Lỗi kiểm tra</span>
                </div>
                <button
                  onClick={() => {
                    console.log('🔍 Debug info for file ID:', fileId);
                    console.log('🔍 Error details:', error);
                    alert(`Debug Info:\nFile ID: ${fileId}\nError: ${error}\n\nCheck browser console for more details.`);
                  }}
                  className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded"
                >
                  Debug
                </button>
              </div>
              <p className="text-red-600 mt-2">{error}</p>
              <div className="mt-3 text-sm text-red-500">
                <p><strong>Gợi ý khắc phục:</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Kiểm tra file có tồn tại và không bị hỏng</li>
                  <li>Đảm bảo file là định dạng PDF hợp lệ</li>
                  <li>Thử tải lại trang và kiểm tra lại</li>
                  <li>Liên hệ quản trị viên nếu lỗi vẫn tiếp tục</li>
                </ul>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-6">
              {/* Status Summary */}
              <div className={`p-4 rounded-lg border ${getStatusColor(result.color)}`}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{getStatusIcon(result.status)}</span>
                  <div>
                    <h3 className="font-semibold text-lg">{result.message}</h3>
                    <p className="text-sm opacity-75">
                      Kiểm tra lúc: {new Date(result.checkTime).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="text-center">
                    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(result.color)}`}>
                      {result.summary?.hasSignature ? 'Có chữ ký' : 'Không có chữ ký'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold">{result.summary?.signatureCount || 0}</div>
                    <div className="text-sm opacity-75">Chữ ký</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-red-600">{result.summary?.issuesCount || 0}</div>
                    <div className="text-sm opacity-75">Lỗi</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-yellow-600">{result.summary?.warningsCount || 0}</div>
                    <div className="text-sm opacity-75">Cảnh báo</div>
                  </div>
                </div>
              </div>

              {/* Issues and Warnings */}
              {((result.details.issues?.length || 0) > 0 || (result.details.warnings?.length || 0) > 0) && (
                <div className="space-y-4">
                  {(result.details.issues?.length || 0) > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Các vấn đề nghiêm trọng
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-red-700">
                        {(result.details.issues || []).map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(result.details.warnings?.length || 0) > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        Cảnh báo
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-yellow-700">
                        {(result.details.warnings || []).map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations */}
              {(result.details.recommendations?.length || 0) > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Khuyến nghị
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    {(result.details.recommendations || []).map((recommendation, index) => (
                      <li key={index}>{recommendation}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Adobe Instructions Toggle */}
              <div className="border-t pt-6">
                <button
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <svg className={`w-5 h-5 transition-transform ${showInstructions ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {showInstructions ? 'Ẩn' : 'Hiển thị'} hướng dẫn sử dụng Adobe Acrobat Reader DC
                </button>

                {showInstructions && (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">{result.adobeInstructions.title}</h4>
                    
                    <div className="space-y-4">
                      {result.adobeInstructions.steps.map((step) => (
                        <div key={step.step} className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                            {step.step}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-800">{step.title}</h5>
                            <p className="text-gray-600 text-sm mt-1">{step.description}</p>
                            
                            {step.url && (
                              <a 
                                href={step.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 text-sm mt-1 inline-block"
                              >
                                Tải xuống tại đây →
                              </a>
                            )}
                            
                            {step.indicators && (
                              <div className="mt-2 space-y-1">
                                <div className="text-sm">
                                  <span className="text-green-600 font-medium">✅ Xanh:</span> {step.indicators.green}
                                </div>
                                <div className="text-sm">
                                  <span className="text-yellow-600 font-medium">⚠️ Vàng:</span> {step.indicators.yellow}
                                </div>
                                <div className="text-sm">
                                  <span className="text-red-600 font-medium">❌ Đỏ:</span> {step.indicators.red}
                                </div>
                              </div>
                            )}
                            
                            {step.details && (
                              <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                                {step.details.map((detail, index) => (
                                  <li key={index}>{detail}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tips */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h5 className="font-medium text-gray-800 mb-2">💡 Mẹo sử dụng:</h5>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {result.adobeInstructions.tips.map((tip, index) => (
                          <li key={index}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdobeIntegrityChecker;
