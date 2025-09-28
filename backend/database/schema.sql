-- Database schema cho hệ thống chữ ký số
-- PostgreSQL Database Schema

-- Bảng người dùng
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    mst VARCHAR(20) UNIQUE, -- Mã số thuế
    full_name VARCHAR(100),
    phone VARCHAR(20),
    organization VARCHAR(100),
    totp_secret VARCHAR(255), -- TOTP secret cho Google Authenticator
    totp_enabled BOOLEAN DEFAULT false, -- Trạng thái TOTP
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Bảng chứng thư số
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    issuer VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP NOT NULL,
    public_key TEXT NOT NULL, -- PEM format
    private_key_encrypted TEXT, -- Encrypted private key
    certificate_chain TEXT, -- Full certificate chain
    cloud_ca_key_id TEXT, -- ID tham chiếu private key lưu ở CloudCA
    public_key_pem TEXT, -- Public key PEM (nếu không dùng field public_key cũ)
    pem_csr TEXT, -- CSR đã gửi CloudCA
    otp_methods TEXT[] DEFAULT ARRAY['email'],
    status VARCHAR(20) DEFAULT 'active', -- active, expired, revoked
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng files
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_hash VARCHAR(64) NOT NULL, -- SHA256 hash
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'uploaded', -- uploaded, signed, verified
    company_name VARCHAR(255),
    reason TEXT,
    location VARCHAR(255),
    sign_datetime TIMESTAMP NULL
);

-- Bảng chữ ký số
CREATE TABLE digital_signatures (
    id SERIAL PRIMARY KEY,
    file_id INTEGER REFERENCES files(id) ON DELETE CASCADE,
    certificate_id INTEGER REFERENCES certificates(id) ON DELETE CASCADE,
    signature_data TEXT, -- CMS/PKCS#7 signature
    signature_hash VARCHAR(64) NOT NULL, -- Hash của signature
    signed_file_path VARCHAR(500), -- Đường dẫn file đã ký
    signing_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verification_status VARCHAR(20) DEFAULT 'pending', -- pending, valid, invalid, expired
    cloud_ca_request_id VARCHAR(100), -- ID request từ Cloud-CA
    requires_otp BOOLEAN DEFAULT TRUE,
    authorized BOOLEAN DEFAULT FALSE,
    authorized_at TIMESTAMP NULL,
    otp_session_id TEXT NULL,
    metadata JSONB -- Thông tin bổ sung
);

-- OTP sessions table (nếu không dùng Redis)
CREATE TABLE IF NOT EXISTS otp_sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    method TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng sessions
CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng audit log
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id INTEGER,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes để tối ưu performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_mst ON users(mst);
CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_certificates_serial ON certificates(serial_number);
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_signatures_file_id ON digital_signatures(file_id);
CREATE INDEX idx_signatures_certificate_id ON digital_signatures(certificate_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Trigger để update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at BEFORE UPDATE ON certificates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
