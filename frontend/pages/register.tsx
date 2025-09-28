import React from 'react';
import Head from 'next/head';
import RegisterForm from '../components/RegisterForm';

const RegisterPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Register - Digital Signature System</title>
        <meta name="description" content="Register for Digital Signature System" />
      </Head>
      <RegisterForm />
    </>
  );
};

export default RegisterPage;
