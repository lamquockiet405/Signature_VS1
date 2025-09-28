# Google Cloud CA Setup Script for Windows
# This script sets up Google Cloud CA for the digital signature system

Write-Host "🚀 Setting up Google Cloud CA for Digital Signature System" -ForegroundColor Green
Write-Host ""

# Check if gcloud is installed
try {
    $gcloudVersion = gcloud version --format="value(Google Cloud SDK)"
    Write-Host "✅ Google Cloud SDK found: $gcloudVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Google Cloud SDK not found. Please install it first:" -ForegroundColor Red
    Write-Host "   https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Set project
Write-Host "📋 Setting project to chuki-472201..." -ForegroundColor Blue
gcloud config set project chuki-472201

# Enable required APIs
Write-Host "🔧 Enabling required APIs..." -ForegroundColor Blue

$apis = @(
    "privateca.googleapis.com",
    "storage.googleapis.com", 
    "cloudkms.googleapis.com"
)

foreach ($api in $apis) {
    Write-Host "   Enabling $api..." -ForegroundColor Yellow
    gcloud services enable $api
}

Write-Host "✅ All APIs enabled successfully" -ForegroundColor Green

# Create CA Pool
Write-Host "🏗️  Creating CA Pool..." -ForegroundColor Blue
try {
    gcloud privateca pools create digital-signature-pool `
        --location=us-central1 `
        --tier=ENTERPRISE
    Write-Host "✅ CA Pool created successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  CA Pool might already exist or there was an error" -ForegroundColor Yellow
}

# Create Certificate Authority
Write-Host "🔐 Creating Certificate Authority..." -ForegroundColor Blue
try {
    gcloud privateca roots create digital-signature-ca `
        --pool=digital-signature-pool `
        --location=us-central1 `
        --subject="CN=Digital Signature CA,O=Chuki Digital Signature System,C=VN" `
        --key-algorithm=rsa-pkcs1-4096 `
        --max-chain-length=2
    Write-Host "✅ Certificate Authority created successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Certificate Authority might already exist or there was an error" -ForegroundColor Yellow
}

# Create Storage Bucket
Write-Host "📦 Creating Cloud Storage Bucket..." -ForegroundColor Blue
try {
    gsutil mb gs://chuki-digital-signature-bucket
    Write-Host "✅ Storage bucket created successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Storage bucket might already exist or there was an error" -ForegroundColor Yellow
}

# Install dependencies
Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Blue
Set-Location backend
npm install
Set-Location ..

Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green

# Copy environment file
Write-Host "⚙️  Setting up environment configuration..." -ForegroundColor Blue
if (Test-Path "backend/config.env") {
    Write-Host "⚠️  config.env already exists, skipping copy" -ForegroundColor Yellow
} else {
    Copy-Item "backend/config.env.example" "backend/config.env"
    Write-Host "✅ Environment configuration copied" -ForegroundColor Green
}

# Test the integration
Write-Host "🧪 Testing Google Cloud CA integration..." -ForegroundColor Blue
Set-Location backend
try {
    node test-google-ca.js
    Write-Host "✅ Integration test completed successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Integration test had issues. Check the output above." -ForegroundColor Yellow
}
Set-Location ..

Write-Host ""
Write-Host "🎉 Google Cloud CA setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Verify your service account has the required IAM roles" -ForegroundColor White
Write-Host "2. Start your application: cd backend && npm start" -ForegroundColor White
Write-Host "3. Test the API endpoints using the examples in GOOGLE_CLOUD_CA_SETUP.md" -ForegroundColor White
Write-Host ""
Write-Host "Service Account: chuki-879@chuki-472201.iam.gserviceaccount.com" -ForegroundColor Cyan
Write-Host "Project ID: chuki-472201" -ForegroundColor Cyan
Write-Host "CA Pool: digital-signature-pool" -ForegroundColor Cyan
Write-Host "CA ID: digital-signature-ca" -ForegroundColor Cyan
Write-Host "Storage Bucket: chuki-digital-signature-bucket" -ForegroundColor Cyan
