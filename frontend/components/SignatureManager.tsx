import React, { useState, useEffect } from 'react';
import { signatureAPI } from '../lib/api';

interface Signature {
  id: string;
  signature_hash: string;
  verification_status: string;
  created_at?: string;
  signing_date?: string;
  signature_data?: string;
  certificate_serial?: string;
  certificate_subject?: string;
  creator_username?: string;
  metadata?: any;
}

interface SignatureManagerProps {
  onSignatureSelect?: (signature: Signature) => void;
}

const SignatureManager: React.FC<SignatureManagerProps> = ({ onSignatureSelect }) => {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedSignature, setSelectedSignature] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadSignatures();
  }, [page, statusFilter]);

  // Reload when component is remounted (when key changes)
  useEffect(() => {
    loadSignatures();
  }, []);

  const loadSignatures = async () => {
    try {
      setLoading(true);

      const response = await signatureAPI.getSignatures({
        page: parseInt(page.toString()),
        limit: 10,
        status: statusFilter || undefined
      });
      
      if (response.data.success) {
        setSignatures(response.data.data.signatures);
        setTotalPages(response.data.data.pagination.pages);
      } else {
        setError('Không thể tải danh sách chữ ký');
      }
    } catch (error) {
      console.error('Error loading signatures:', error);
      setError('Có lỗi xảy ra khi tải danh sách chữ ký');
    } finally {
      setLoading(false);
    }
  };

  const verifySignature = async (signatureId: string) => {
    try {
      const response = await signatureAPI.verifySignature(signatureId);
      
      if (response.data.success) {
        // Reload signatures to update status
        loadSignatures();
        alert(`Chữ ký ${response.data.data.valid ? 'hợp lệ' : 'không hợp lệ'}`);
      } else {
        alert('Có lỗi xảy ra khi xác thực chữ ký');
      }
    } catch (error) {
      console.error('Error verifying signature:', error);
      alert('Có lỗi xảy ra khi xác thực chữ ký');
    }
  };

  const downloadSignature = async (signatureId: string) => {
    try {
      const response = await signatureAPI.downloadSignature(signatureId);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `signature_${signatureId}.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading signature:', error);
      const message = error?.response?.data?.message || 'Có lỗi xảy ra khi tải xuống chữ ký';
      alert(message);
    }
  };

  const deleteSignature = async (signatureId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa chữ ký này?')) {
      return;
    }

    try {
      const response = await signatureAPI.deleteSignature(signatureId);
      
      if (response.data.success) {
        loadSignatures();
        alert('Chữ ký đã được xóa thành công');
      } else {
        alert('Có lỗi xảy ra khi xóa chữ ký');
      }
    } catch (error) {
      console.error('Error deleting signature:', error);
      alert('Có lỗi xảy ra khi xóa chữ ký');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pending': { text: 'Chờ xử lý', class: 'bg-yellow-100 text-yellow-800' },
      'valid': { text: 'Hợp lệ', class: 'bg-green-100 text-green-800' },
      'invalid': { text: 'Không hợp lệ', class: 'bg-red-100 text-red-800' },
      'expired': { text: 'Hết hạn', class: 'bg-gray-100 text-gray-800' },
      'error': { text: 'Lỗi', class: 'bg-red-100 text-red-800' }
    } as const;

    const statusInfo = (statusMap as any)[status] || { text: status, class: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="signature-manager max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quản Lý Chữ Ký Số</h2>
        <button
          onClick={loadSignatures}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Làm mới
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="valid">Hợp lệ</option>
          <option value="invalid">Không hợp lệ</option>
          <option value="expired">Hết hạn</option>
          <option value="error">Lỗi</option>
        </select>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Signatures List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chứng thư
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Người tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {signatures.map((signature, index) => (
                <tr key={signature.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{signature.certificate_subject || 'N/A'}</div>
                      <div className="text-gray-500 text-xs">
                        Serial: {signature.certificate_serial || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-blue-600 font-medium text-sm">
                          {signature.creator_username ? signature.creator_username.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{signature.creator_username || 'Unknown'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(signature.verification_status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(signature.signing_date || signature.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onSignatureSelect?.(signature)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Xem
                      </button>
                      <button
                        onClick={() => verifySignature(String(signature.id))}
                        className="text-green-600 hover:text-green-900"
                      >
                        Xác thực
                      </button>
                      <button
                        onClick={() => downloadSignature(String(signature.id))}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        Tải xuống
                      </button>
                      <button
                        onClick={() => deleteSignature(String(signature.id))}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {signatures.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">Không có chữ ký nào</div>
            <div className="text-gray-400 text-sm mt-2">Tạo chữ ký mới để bắt đầu</div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Trước
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-2 border rounded-lg ${
                  pageNum === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            ))}
            
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignatureManager;
