import React, { useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';
import { auth } from '../lib/auth';
import { fileAPI } from '../lib/api';
import toast from 'react-hot-toast';

const SimpleUploadPage: React.FC = () => {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f && f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Only PDF files are allowed');
      e.currentTarget.value = '';
      setFile(null);
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.isAuthenticated()) {
      router.push('/login');
      return;
    }
    if (!file) {
      toast.error('Please choose a file');
      return;
    }
    setUploading(true);
    try {
      await fileAPI.simpleUpload(file);
      toast.success('Uploaded successfully');
      router.push('/files');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Simple Upload</title>
      </Head>
      <div style={{ maxWidth: 600, margin: '20px auto', padding: 20, background: 'white', borderRadius: 8, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
        <h1 style={{ marginBottom: 16 }}>Simple Upload</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <input type="file" accept="application/pdf,.pdf" onChange={handleFileChange} disabled={uploading} />
          </div>
          <button type="submit" disabled={uploading || !file} style={{ padding: '8px 16px' }}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default SimpleUploadPage;