import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import OTPModal from '../components/OTPModal';
import AdobeIntegrityChecker from '../components/AdobeIntegrityChecker';
import { auth, User } from '../lib/auth';
import { fileAPI, authAPI } from '../lib/api';
import { 
  FileText, 
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Eye,
  Shield,
  PenTool
} from 'lucide-react';
import toast from 'react-hot-toast';
// Dropzone removed: we only process existing files with metadata + OTP

interface FileItem {
  id: number;
  original_filename: string;
  file_size: number;
  file_type: string;
  upload_date: string;
  status: string;
  signature_count: number;
}

const FilesPage: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [selectedExistingFileId, setSelectedExistingFileId] = useState<number | ''>('');
  const [companyName, setCompanyName] = useState('');
  const [reason, setReason] = useState('');
  const [locationText, setLocationText] = useState('');
  const [signDatetime, setSignDatetime] = useState<string>('');
  const [showIntegrityChecker, setShowIntegrityChecker] = useState(false);
  const [selectedFileForIntegrity, setSelectedFileForIntegrity] = useState<{id: number, name: string} | null>(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [selectedFileForSigning, setSelectedFileForSigning] = useState<{id: number, name: string} | null>(null);
  const [signingReason, setSigningReason] = useState('');
  const [signingLocation, setSigningLocation] = useState('');
  const [showSignatureInfo, setShowSignatureInfo] = useState(false);
  const [selectedFileForSignature, setSelectedFileForSignature] = useState<{id: number, name: string} | null>(null);
  const [signatureInfo, setSignatureInfo] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      if (!auth.isAuthenticated()) {
        router.push('/login');
        return;
      }

      try {
        const currentUser = await auth.getCurrentUser();
        setUser(currentUser);
        await fetchFiles();
      } catch (error) {
        console.error('Error getting user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchFiles = async () => {
    try {
      const response = await fileAPI.getFiles();
      setFiles(response.data.data.files);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to fetch files');
    }
  };

  const handleOTPSuccess = async (sessionId: string) => {
    console.log('🔍 OTP Success (process existing):', sessionId);
    if (!selectedExistingFileId) {
      toast.error('Vui lòng chọn file');
      return;
    }
    if (!companyName || !reason || !locationText) {
      toast.error('Vui lòng nhập Company, Reason, Location');
      return;
    }
    setUploading(true);
    try {
      await fileAPI.processExistingFile(String(selectedExistingFileId), {
        company_name: companyName,
        reason,
        location: locationText,
        sign_datetime: new Date().toISOString(),
      });
      toast.success('Đã xử lý và ký số thành công');
      await fetchFiles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xử lý file thất bại');
    } finally {
      setUploading(false);
      setShowOTPModal(false);
    }
  };

  const handleOTPCancel = () => {
    console.log('🔍 OTP Modal cancelled');
    setShowOTPModal(false);
  };


  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await fileAPI.deleteFile(fileId.toString());
      toast.success('File deleted successfully');
      await fetchFiles();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete file');
    }
  };

  const handleViewOnline = async (fileId: number) => {
    try {
      // Lấy token từ cookie (theo auth.ts)
      const token = auth.getToken();
      console.log('🔍 Token check:', { 
        hasToken: !!token, 
        tokenLength: token?.length,
        isAuthenticated: auth.isAuthenticated()
      });
      
      if (!token) {
        toast.error('Please login first');
        return;
      }

      // Tạo URL với token
      const viewerUrl = `/api/files/${fileId}/view?token=${encodeURIComponent(token)}`;
      console.log('🔗 Opening viewer URL:', viewerUrl);
      
      // Mở viewer URL trong tab mới
      window.open(viewerUrl, '_blank');
    } catch (error: any) {
      console.error('❌ View online error:', error);
      toast.error('Failed to open file viewer');
    }
  };

  const handleCheckIntegrity = (fileId: number, fileName: string) => {
    setSelectedFileForIntegrity({ id: fileId, name: fileName });
    setShowIntegrityChecker(true);
  };

  const handleCloseIntegrityChecker = () => {
    setShowIntegrityChecker(false);
    setSelectedFileForIntegrity(null);
  };

  const handleViewSignature = async (fileId: number, fileName: string) => {
    try {
      setSelectedFileForSignature({ id: fileId, name: fileName });
      
      // Gọi API để lấy thông tin chữ ký
      const response = await fileAPI.getSignatureInfo(fileId.toString());
      
      if (response.data.success) {
        setSignatureInfo(response.data.data);
        setShowSignatureInfo(true);
      } else {
        toast.error('Không thể lấy thông tin chữ ký');
      }
    } catch (error: any) {
      console.error('❌ Error getting signature info:', error);
      toast.error('Lỗi khi lấy thông tin chữ ký: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDownloadFile = async (fileId: number, fileName: string) => {
    try {
      const token = auth.getToken();
      if (!token) {
        toast.error('Please login first');
        return;
      }

      const res = await fetch(`/api/files/${fileId}/download`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        try {
          const json = JSON.parse(text);
          toast.error(json.message || 'Failed to download file');
        } catch {
          toast.error(text || 'Failed to download file');
        }
        return;
      }

      const blob = await res.blob();
      // Validate: ensure it's a PDF, otherwise show server error instead of saving corrupt file
      try {
        const head = await blob.slice(0, 8).text();
        if (!head.startsWith('%PDF')) {
          const text = await blob.text();
          try {
            const json = JSON.parse(text);
            toast.error(json.message || 'Server returned non-PDF content');
          } catch {
            toast.error(text || 'Server returned non-PDF content');
          }
          return;
        }
      } catch {}
      let downloadName = 'document_signed.pdf';
      const cd = res.headers.get('Content-Disposition');
      const match = cd && cd.match(/filename="?([^";]+)"?/i);
      if (match && match[1]) {
        downloadName = match[1];
      } else if (fileName) {
        const base = fileName.replace(/\.pdf$/i, '');
        downloadName = `${base}_signed.pdf`;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.message || 'Failed to download file');
    }
  };

  const handleCloseSignatureInfo = () => {
    setShowSignatureInfo(false);
    setSelectedFileForSignature(null);
    setSignatureInfo(null);
  };

  const handleSignFile = (fileId: number, fileName: string) => {
    setSelectedFileForSigning({ id: fileId, name: fileName });
    setShowSignModal(true);
  };

  const handleCloseSignModal = () => {
    setShowSignModal(false);
    setSelectedFileForSigning(null);
    setSigningReason('');
    setSigningLocation('');
  };

  const handleConfirmSigning = async () => {
    if (!selectedFileForSigning) return;

    try {
      const response = await fileAPI.signFile(
        selectedFileForSigning.id.toString(),
        {
          reason: signingReason || 'Digital signature',
          location: signingLocation || 'Vietnam'
        }
      );

      if (response.data.success) {
        toast.success('File signed successfully with PKCS#7/CMS!');
        await fetchFiles();
        handleCloseSignModal();
      } else {
        toast.error(response.data.message || 'Failed to sign file');
      }
    } catch (error: any) {
      console.error('Sign file error:', error);
      toast.error(error.response?.data?.message || 'Failed to sign file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'uploaded':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'signed':
        return 'Signed';
      case 'uploaded':
        return 'Uploaded';
      case 'verified':
        return 'Verified';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner text-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Files - Digital Signature System</title>
        <meta name="description" content="Manage your files and documents" />
      </Head>
      <Layout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Files</h1>
              <p className="text-gray-600">Upload and manage your documents</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const token = auth.getToken();
                  const isAuth = auth.isAuthenticated();
                  console.log('🔍 Auth Debug:', { 
                    hasToken: !!token, 
                    tokenLength: token?.length,
                    isAuthenticated: isAuth,
                    token: token?.substring(0, 20) + '...'
                  });
                  toast.success(`Auth Status: ${isAuth ? 'Logged in' : 'Not logged in'}`);
                }}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
              >
                🔍 Debug Auth
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await authAPI.totpDebug();
                    console.log('🔍 TOTP Debug:', response.data);
                    toast.success(`TOTP Status: ${response.data.data.enabled ? 'Enabled' : 'Disabled'}`);
                  } catch (error: any) {
                    console.error('TOTP Debug Error:', error);
                    toast.error('TOTP Debug failed');
                  }
                }}
                className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
              >
                🔍 Debug TOTP
              </button>
            </div>
          </div>

          {/* Chọn file trong hệ thống và ký sau khi xác thực OTP */}
          <div className="bg-white shadow rounded-lg p-6">
            {/* Chọn file đã có trong hệ thống để xử lý */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Hoặc chọn file đã có trong hệ thống</label>
          <div className="flex items-center gap-2">
            <select
              value={selectedExistingFileId}
              onChange={(e) => setSelectedExistingFileId(e.target.value ? Number(e.target.value) : '')}
              className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Chọn file --</option>
              {files.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.original_filename} ({formatFileSize(f.file_size)})
                </option>
              ))}
            </select>
            <button
              disabled={!selectedExistingFileId || uploading || !companyName || !reason || !locationText}
              onClick={() => {
                if (!selectedExistingFileId) {
                  toast.error('Vui lòng chọn file');
                  return;
                }
                if (!companyName || !reason || !locationText) {
                  toast.error('Vui lòng nhập Company, Reason, Location');
                  return;
                }
                setShowOTPModal(true);
              }}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
            >
              Xác nhận ký
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Chức năng này sẽ chèn metadata, chuyển sang PDF (nếu cần) và ký số tự động.</p>
        </div>

        {/* Upload metadata form */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Company name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="ABC Co., Ltd"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Hanoi, VN"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Contract signing"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Sign date & time</label>
            <input
              type="text"
              value={new Date().toLocaleString()}
              readOnly
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
            />
          </div>
        </div>
          </div>

          {/* Files List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Your Files</h2>
            </div>
            
            {files.length === 0 ? (
              <div className="p-6 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No files</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Upload a file to get started with digital signing.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th className="table-header-cell">Status</th>
                      <th className="table-header-cell">File Name</th>
                      <th className="table-header-cell">Type</th>
                      <th className="table-header-cell">Size</th>
                      <th className="table-header-cell">Signatures</th>
                      <th className="table-header-cell">Upload Date</th>
                      <th className="table-header-cell">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {files.map((file) => (
                      <tr key={file.id}>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(file.status)}
                            <span className="text-sm">
                              {getStatusText(file.status)}
                            </span>
                          </div>
                        </td>
                        <td className="table-cell">
                          <div className="max-w-xs truncate" title={file.original_filename}>
                            {file.original_filename}
                          </div>
                        </td>
                        <td className="table-cell">
                          <span className="badge badge-info">
                            {file.file_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="table-cell">
                          {formatFileSize(file.file_size)}
                        </td>
                        <td className="table-cell">
                          <span className="text-sm">
                            {file.signature_count} signature{file.signature_count !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="table-cell">
                          {new Date(file.upload_date).toLocaleDateString()}
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewOnline(file.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="View Online"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadFile(file.id, file.original_filename)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Download (Adobe-signed)"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                <path d="M12 3a1 1 0 011 1v8.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L11 12.586V4a1 1 0 011-1z" />
                                <path d="M5 20a2 2 0 002 2h10a2 2 0 002-2v-3a1 1 0 10-2 0v3H7v-3a1 1 0 10-2 0v3z" />
                              </svg>
                            </button>
                            {/* Auto-sign enabled: hide manual sign button */}
                            {file.file_type === 'pdf' && file.status === 'signed' && (
                              <button
                                onClick={() => handleViewSignature(file.id, file.original_filename)}
                                className="text-green-600 hover:text-green-900"
                                title="View Digital Signature Info"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => handleCheckIntegrity(file.id, file.original_filename)}
                              className="text-green-600 hover:text-green-900"
                              title="Check Integrity with Adobe"
                            >
                              <Shield className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFile(file.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete File"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Layout>

      {/* OTP Modal */}
      <OTPModal
        isOpen={showOTPModal}
        onClose={handleOTPCancel}
        onSuccess={handleOTPSuccess}
        userEmail={user?.email}
      />

      {/* Adobe Integrity Checker Modal */}
      {showIntegrityChecker && selectedFileForIntegrity && (
        <AdobeIntegrityChecker
          fileId={selectedFileForIntegrity.id}
          fileName={selectedFileForIntegrity.name}
          onClose={handleCloseIntegrityChecker}
        />
      )}

      {/* Sign Document Modal */}
      {showSignModal && selectedFileForSigning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  🔐 Ký số tài liệu PKCS#7/CMS
                </h2>
                <p className="text-sm text-gray-600 mt-1">{selectedFileForSigning.name}</p>
              </div>
              <button
                onClick={handleCloseSignModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-blue-700 font-medium">Thông tin ký số PKCS#7</span>
                </div>
                <p className="text-blue-600 text-sm">
                  Tài liệu sẽ được ký số theo chuẩn PKCS#7/CMS với thuật toán SHA256withRSA. 
                  Sau khi ký, bạn có thể kiểm tra tính toàn vẹn bằng Adobe Acrobat Reader DC.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do ký số
                </label>
                <input
                  type="text"
                  value={signingReason}
                  onChange={(e) => setSigningReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ví dụ: Ký hợp đồng, Xác nhận tài liệu..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa điểm ký số
                </label>
                <input
                  type="text"
                  value={signingLocation}
                  onChange={(e) => setSigningLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ví dụ: Hà Nội, Việt Nam"
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-green-700 font-medium">Tính năng PKCS#7/CMS</span>
                </div>
                <ul className="text-green-600 text-sm space-y-1">
                  <li>• Ký số theo chuẩn PKCS#7/CMS quốc tế</li>
                  <li>• Sử dụng thuật toán SHA256withRSA</li>
                  <li>• Tương thích với Adobe Acrobat Reader DC</li>
                  <li>• Chữ ký số thật sự, không phải watermark</li>
                  <li>• Có thể xác minh tính toàn vẹn tài liệu</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-yellow-700 font-medium">Lưu ý quan trọng</span>
                </div>
                <ul className="text-yellow-600 text-sm space-y-1">
                  <li>• Chứng chỉ tự ký chỉ dành cho mục đích demo</li>
                  <li>• Trong thực tế cần sử dụng chứng chỉ từ CA tin cậy</li>
                  <li>• Sau khi ký, file sẽ có chữ ký số thật sự</li>
                  <li>• Có thể kiểm tra bằng Adobe Acrobat Reader DC</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={handleCloseSignModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmSigning}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <PenTool className="w-4 h-4" />
                Ký số PKCS#7
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signature Info Modal */}
      {showSignatureInfo && selectedFileForSignature && signatureInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  🔐 Thông tin chữ ký số
                </h2>
                <p className="text-sm text-gray-600 mt-1">{selectedFileForSignature.name}</p>
              </div>
              <button
                onClick={handleCloseSignatureInfo}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* File Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">📄 Thông tin file</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Tên file:</span>
                    <p className="text-gray-700">{signatureInfo.file.filename}</p>
                  </div>
                  <div>
                    <span className="font-medium">Loại file:</span>
                    <p className="text-gray-700">{signatureInfo.file.type.toUpperCase()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Trạng thái:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      signatureInfo.file.status === 'signed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {signatureInfo.file.status === 'signed' ? 'Đã ký' : 'Chưa ký'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Số lượng chữ ký:</span>
                    <p className="text-gray-700">{signatureInfo.signatureCount}</p>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800">🔐 Danh sách chữ ký số</h3>
                {signatureInfo.signatures.map((signature: any, index: number) => (
                  <div key={signature.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-800">Chữ ký #{index + 1}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        signature.verificationStatus === 'valid' 
                          ? 'bg-green-100 text-green-800' 
                          : signature.verificationStatus === 'invalid'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {signature.verificationStatus === 'valid' ? 'Hợp lệ' : 
                         signature.verificationStatus === 'invalid' ? 'Không hợp lệ' : 'Đang xử lý'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Hash chữ ký:</span>
                        <p className="text-gray-700 font-mono text-xs break-all">
                          {signature.signatureHash}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Ngày ký:</span>
                        <p className="text-gray-700">
                          {new Date(signature.signingDate).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>

                    {/* Certificate Info */}
                    {signature.certificate && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h5 className="font-medium text-gray-800 mb-2">📜 Thông tin chứng thư</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Serial Number:</span>
                            <p className="text-gray-700 font-mono text-xs">{signature.certificate.serialNumber}</p>
                          </div>
                          <div>
                            <span className="font-medium">Subject:</span>
                            <p className="text-gray-700">{signature.certificate.subject}</p>
                          </div>
                          <div>
                            <span className="font-medium">Issuer:</span>
                            <p className="text-gray-700">{signature.certificate.issuer}</p>
                          </div>
                          <div>
                            <span className="font-medium">Hết hạn:</span>
                            <p className="text-gray-700">
                              {new Date(signature.certificate.validTo).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Metadata */}
                    {signature.metadata && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h5 className="font-medium text-gray-800 mb-2">📋 Thông tin bổ sung</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {signature.metadata.signer_name && (
                            <div>
                              <span className="font-medium">Người ký:</span>
                              <p className="text-gray-700">{signature.metadata.signer_name}</p>
                            </div>
                          )}
                          {signature.metadata.signer_email && (
                            <div>
                              <span className="font-medium">Email:</span>
                              <p className="text-gray-700">{signature.metadata.signer_email}</p>
                            </div>
                          )}
                          {signature.metadata.reason && (
                            <div>
                              <span className="font-medium">Lý do ký:</span>
                              <p className="text-gray-700">{signature.metadata.reason}</p>
                            </div>
                          )}
                          {signature.metadata.location && (
                            <div>
                              <span className="font-medium">Địa điểm:</span>
                              <p className="text-gray-700">{signature.metadata.location}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={handleCloseSignatureInfo}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FilesPage;
