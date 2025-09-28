import React from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  FileText,
  Shield,
  Clock,
  Globe,
  Settings,
  Info
} from 'lucide-react';

const AdobeGuidePage: React.FC = () => {
  const steps = [
    {
      step: 1,
      title: 'Tải và cài đặt Adobe Acrobat Reader DC',
      description: 'Tải miễn phí Adobe Acrobat Reader DC từ trang chủ Adobe',
      icon: <Download className="w-6 h-6" />,
      details: [
        'Truy cập trang web chính thức của Adobe',
        'Tải phiên bản mới nhất của Adobe Acrobat Reader DC',
        'Cài đặt phần mềm theo hướng dẫn',
        'Khởi động Adobe Reader sau khi cài đặt'
      ],
      url: 'https://get.adobe.com/reader/',
      color: 'blue'
    },
    {
      step: 2,
      title: 'Mở file PDF',
      description: 'Mở file PDF cần kiểm tra bằng Adobe Acrobat Reader DC',
      icon: <FileText className="w-6 h-6" />,
      details: [
        'Khởi động Adobe Acrobat Reader DC',
        'Mở file PDF bằng cách kéo thả hoặc File > Open',
        'Đợi file được tải hoàn toàn',
        'Kiểm tra xem file có hiển thị đúng không'
      ],
      color: 'green'
    },
    {
      step: 3,
      title: 'Kiểm tra thanh thông báo',
      description: 'Nhìn vào thanh thông báo phía trên của Adobe Reader',
      icon: <Shield className="w-6 h-6" />,
      details: [
        'Tìm thanh thông báo màu ở phía trên cửa sổ Adobe Reader',
        'Quan sát màu sắc của thanh thông báo',
        'Đọc thông tin hiển thị trên thanh thông báo',
        'Nhấp vào thanh thông báo để xem chi tiết'
      ],
      indicators: {
        green: '✅ Màu xanh: Tài liệu hợp lệ, chữ ký số đúng',
        yellow: '⚠️ Màu vàng: Có cảnh báo (chứng chỉ chưa tin cậy, file bị chỉnh sửa)',
        red: '❌ Màu đỏ: Chữ ký không hợp lệ'
      },
      color: 'purple'
    },
    {
      step: 4,
      title: 'Xem chi tiết chữ ký',
      description: 'Nhấp vào biểu tượng chữ ký để xem thông tin chi tiết',
      icon: <Info className="w-6 h-6" />,
      details: [
        'Tìm biểu tượng chữ ký trong tài liệu',
        'Nhấp đúp vào biểu tượng chữ ký',
        'Xem thông tin người ký',
        'Kiểm tra thời gian ký',
        'Xem trạng thái chứng chỉ',
        'Kiểm tra thuật toán mã hóa'
      ],
      color: 'orange'
    }
  ];

  const tips = [
    'Luôn sử dụng phiên bản mới nhất của Adobe Reader để đảm bảo tính tương thích',
    'Kiểm tra kết nối internet để xác minh chứng chỉ trực tuyến',
    'Cài đặt chứng chỉ gốc vào hệ thống nếu được yêu cầu',
    'Kiểm tra thời gian hệ thống để đảm bảo timestamp chính xác',
    'Không mở file PDF từ nguồn không tin cậy',
    'Thường xuyên cập nhật Adobe Reader để có các bản vá bảo mật mới nhất'
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'green':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'purple':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'orange':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <>
      <Head>
        <title>Hướng dẫn sử dụng Adobe Acrobat Reader DC - Digital Signature System</title>
        <meta name="description" content="Hướng dẫn chi tiết cách sử dụng Adobe Acrobat Reader DC để kiểm tra tính toàn vẹn tài liệu có chữ ký số" />
      </Head>
      
      <Layout>
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              📄 Hướng dẫn sử dụng Adobe Acrobat Reader DC
            </h1>
            <p className="text-lg text-gray-600">
              Kiểm tra tính toàn vẹn tài liệu có chữ ký số
            </p>
          </div>

          {/* Status Indicators */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              Ý nghĩa màu sắc thanh thông báo
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-800">Màu xanh</span>
                </div>
                <p className="text-green-700 text-sm">
                  Tài liệu hợp lệ, chữ ký số đúng và đáng tin cậy
                </p>
              </div>
              
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">Màu vàng</span>
                </div>
                <p className="text-yellow-700 text-sm">
                  Có cảnh báo về chứng chỉ hoặc tài liệu đã bị chỉnh sửa
                </p>
              </div>
              
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-800">Màu đỏ</span>
                </div>
                <p className="text-red-700 text-sm">
                  Chữ ký không hợp lệ hoặc tài liệu đã bị hỏng
                </p>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900 text-center">
              Các bước thực hiện
            </h2>
            
            {steps.map((step, index) => (
              <div key={step.step} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className={`p-6 border-l-4 ${getColorClasses(step.color)}`}>
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getColorClasses(step.color)}`}>
                        {step.icon}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-bold">{step.step}</span>
                        <h3 className="text-xl font-semibold">{step.title}</h3>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{step.description}</p>
                      
                      {step.url && (
                        <div className="mb-4">
                          <a
                            href={step.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Tải xuống tại đây
                          </a>
                        </div>
                      )}
                      
                      {step.indicators && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-semibold text-gray-800 mb-2">Ý nghĩa màu sắc:</h4>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-gray-700">{step.indicators.green}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-yellow-600" />
                              <span className="text-sm text-gray-700">{step.indicators.yellow}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <XCircle className="w-4 h-4 text-red-600" />
                              <span className="text-sm text-gray-700">{step.indicators.red}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Chi tiết thực hiện:</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          {step.details.map((detail, detailIndex) => (
                            <li key={detailIndex}>{detail}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-600" />
              Mẹo sử dụng và lưu ý quan trọng
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 text-sm">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              Xử lý sự cố thường gặp
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-semibold text-yellow-800 mb-2">Thanh thông báo không hiển thị</h3>
                <p className="text-yellow-700 text-sm mb-2">Nguyên nhân có thể:</p>
                <ul className="list-disc list-inside text-yellow-700 text-sm space-y-1">
                  <li>File PDF không có chữ ký số</li>
                  <li>Phiên bản Adobe Reader quá cũ</li>
                  <li>File PDF bị hỏng hoặc không đúng định dạng</li>
                </ul>
              </div>
              
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">Chứng chỉ không tin cậy</h3>
                <p className="text-red-700 text-sm mb-2">Cách xử lý:</p>
                <ul className="list-disc list-inside text-red-700 text-sm space-y-1">
                  <li>Kiểm tra kết nối internet để xác minh chứng chỉ</li>
                  <li>Cài đặt chứng chỉ gốc vào hệ thống</li>
                  <li>Liên hệ với người ký để xác nhận tính hợp lệ</li>
                </ul>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Tài liệu đã bị chỉnh sửa</h3>
                <p className="text-blue-700 text-sm mb-2">Điều này có nghĩa:</p>
                <ul className="list-disc list-inside text-blue-700 text-sm space-y-1">
                  <li>Tài liệu đã được thay đổi sau khi ký</li>
                  <li>Chữ ký số không còn hợp lệ</li>
                  <li>Cần kiểm tra lại với người ký</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-gray-500 text-sm">
            <p>
              💡 <strong>Lưu ý:</strong> Adobe Acrobat Reader DC là công cụ miễn phí và đáng tin cậy nhất 
              để kiểm tra tính toàn vẹn của tài liệu có chữ ký số.
            </p>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default AdobeGuidePage;
