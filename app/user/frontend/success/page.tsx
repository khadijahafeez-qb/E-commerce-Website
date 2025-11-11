'use client';

import { useRouter } from 'next/navigation';
import { CheckCircleOutlined } from '@ant-design/icons';

const SuccessPage = () => {
  const router = useRouter();

  const goToHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center p-6">
      <div className="bg-white shadow-2xl rounded-3xl p-12 max-w-lg text-center animate-fadeIn">
        <CheckCircleOutlined className="mx-auto w-24 h-24 text-green-500 mb-6" />
        <h1 className="text-4xl font-extrabold text-green-600 mb-4">
          Payment Successful!
        </h1>
        <p className="text-lg text-gray-700 mb-8">
          Thank you for your purchase. Your order has been confirmed.
        </p>
        <button
          onClick={goToHome}
          className="px-8 py-3 bg-green-500 text-white font-semibold rounded-full shadow-lg hover:bg-green-600 transition transform hover:-translate-y-1 hover:scale-105"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default SuccessPage;
