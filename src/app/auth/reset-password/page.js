// app/auth/reset-password/page.js - Fixed with Suspense Support
import { Suspense } from 'react';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import AuthHeader from '@/components/auth/AuthHeader';
import styles from './ResetPasswordPage.module.css';

export const metadata = {
  title: 'Reset Password | REG-GPT',
  description: 'Reset your Building Codes Assistant password',
};

// 🚀 FIX: Loading fallback component
function ResetPasswordLoading() {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <AuthHeader />
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 mt-4">Loading reset password form...</p>
        </div>
      </div>
    </div>
  );
}

// 🚀 FIX: Wrap ResetPasswordForm in Suspense to handle any useSearchParams usage
export default function ResetPasswordPage() {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <AuthHeader />
        <Suspense fallback={
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            <p className="text-gray-600 mt-4">Loading reset password form...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}