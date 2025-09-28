import React from 'react';
import Head from 'next/head';
import LoginForm from '../components/LoginForm';

const LoginPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Login - Digital Signature System</title>
        <meta name="description" content="Login to Digital Signature System" />
      </Head>
      <LoginForm />
    </>
  );
};

export default LoginPage;
