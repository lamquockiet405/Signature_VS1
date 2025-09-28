import React, { useState, useEffect, useRef } from 'react';
import SignatureCanvas from './SignatureCanvas';
import { signatureAPI, fileAPI } from '../lib/api';

interface UserFile {
  id: number;
  original_filename: string;
  file_type: string;
  file_size: number;
  upload_date: string;
}

interface DigitalSignatureProps {
  onSignatureCreated?: (signatureId: string) => void;
  documentId?: string;
  documentType?: string;
}

const DigitalSignature: React.FC<DigitalSignatureProps> = ({
  onSignatureCreated,
  documentId = 'signature-document',
  documentType = 'signature'
}) => {
  const [files, setFiles] = useState<UserFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>('');
  const [signatureData, setSignatureData] = useState<string>('');
  const [signerName, setSignerName] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [locationText, setLocationText] = useState<string>('');
  const [signDate, setSignDate] = useState<string>(new Date().toISOString().slice(0, 16));
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const signatureCanvasRef = useRef<any>(null);
  const [pubPem, setPubPem] = useState<string>('');
  const [pubDerB64, setPubDerB64] = useState<string>('');

  // Load files
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await fileAPI.getFiles();
      if (response.data?.success !== false) {
        const list = response.data.data?.files || [];
        setFiles(list);
        if (list.length > 0) {
          setSelectedFileId(list[0].id.toString());
        }
      }
    } catch (e) {
      console.error('Error loading files:', e);
      setError('Không thể tải danh sách file');
    }
  };

  const handleSignatureChange = (data: string) => {
    setSignatureData(data);
    setError('');
  };

  const handleSignatureClear = () => {
    setSignatureData('');
    setError('');
  };

  const createDigitalSignature = async () => {
    if (!signatureData) {
      setError('Vui lòng tạo chữ ký trước');
      return;
    }

    if (!selectedFileId) {
      setError('Vui lòng chọn file');
      return;
    }

    setIsCreating(true);
    setError('');
    setSuccess('');

    try {
      // Convert data URL to base64
      const base64Data = signatureData.split(',')[1];

      const response = await signatureAPI.createSignature({
        signatureData: base64Data,
        documentId: selectedFileId || documentId,
        documentType,
        signerInfo: {
          signer_name: signerName,
          reason,
          location: locationText,
          sign_datetime: signDate
        }
      });

      if (response.data.success) {
        setSuccess('Chữ ký số đã được tạo thành công!');
        if (onSignatureCreated) {
          onSignatureCreated(response.data.data.signatureId);
        }
        // Lưu public keys để hiện nút tải về
        setPubPem(response.data.data.public_key_pem || '');
        setPubDerB64(response.data.data.public_key_der_base64 || '');
        // Clear signature after successful creation
        if (signatureCanvasRef.current) {
          signatureCanvasRef.current.clear();
        }
      } else {
        setError(response.data.message || 'Có lỗi xảy ra khi tạo chữ ký');
      }
    } catch (error: any) {
      console.error('Error creating signature:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi tạo chữ ký');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="digital-signature-container max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Tạo Chữ Ký Số</h2>
      
      {/* File Selection (dữ liệu từ bảng files) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chọn File
        </label>
        <select
          value={selectedFileId}
          onChange={(e) => setSelectedFileId(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Chọn file --</option>
          {files.map((f) => (
            <option key={f.id} value={f.id.toString()}>
              {f.original_filename}
            </option>
          ))}
        </select>
      </div>

      {/* Signature Canvas */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vẽ Chữ Ký
        </label>
        <SignatureCanvas
          ref={signatureCanvasRef}
          width={800}
          height={400}
          onSignatureChange={handleSignatureChange}
          onSignatureClear={handleSignatureClear}
          className="w-full"
        />
      </div>

      {/* Signer Information */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tên người ký
          </label>
          <input
            type="text"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nhập tên người ký"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lý do ký
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nhập lý do ký"
          />
        </div>
      </div>

      {/* Document Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">Thông tin tài liệu</h3>
        <div className="text-sm text-blue-700">
          <p><strong>ID tài liệu:</strong> {documentId}</p>
          <p><strong>Loại tài liệu:</strong> {documentType}</p>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={createDigitalSignature}
          disabled={!signatureData || !selectedFileId || isCreating}
          className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isCreating ? 'Đang tạo chữ ký...' : 'Tạo Chữ Ký Số'}
        </button>
        
        <button
          onClick={() => {
            if (signatureCanvasRef.current) {
              signatureCanvasRef.current.clear();
            }
            setError('');
            setSuccess('');
          }}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Làm mới
        </button>
      </div>

      {/* Download Public Keys */}
      {(pubPem || pubDerB64) && (
        <div className="mt-4 flex gap-3">
          {pubPem && (
            <button
              onClick={() => {
                const blob = new Blob([pubPem], { type: 'application/x-pem-file' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'public_key.pem';
                a.click();
                window.URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Tải Public Key (PEM)
            </button>
          )}
          {pubDerB64 && (
            <button
              onClick={() => {
                const byteChars = atob(pubDerB64);
                const byteNums = new Array(byteChars.length).fill(0).map((_, i) => byteChars.charCodeAt(i));
                const byteArray = new Uint8Array(byteNums);
                const blob = new Blob([byteArray], { type: 'application/octet-stream' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'public_key.der';
                a.click();
                window.URL.revokeObjectURL(url);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Tải Public Key (DER)
            </button>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-medium text-yellow-800 mb-2">Hướng dẫn sử dụng:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Chọn file cần ký từ danh sách</li>
          <li>• Vẽ chữ ký của bạn trên canvas bằng chuột hoặc cảm ứng</li>
          <li>• Có thể thay đổi màu sắc và độ dày nét vẽ</li>
          <li>• Nhấn "Tạo Chữ Ký Số" để tạo chữ ký số</li>
          <li>• Chữ ký sẽ được mã hóa và lưu trữ an toàn</li>
        </ul>
      </div>
    </div>
  );
};

export default DigitalSignature;