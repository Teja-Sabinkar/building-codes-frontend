// app/auth/forgot-password/page.js - Fixed Structure
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import AuthHeader from '@/components/auth/AuthHeader';
import styles from './ForgotPasswordPage.module.css';

export const metadata = {
  title: 'Forgot Password | REG-GPT',
  description: 'Reset your Building Codes Assistant password',
};

export default function ForgotPasswordPage() {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <AuthHeader />
        <ForgotPasswordForm />
      </div>
    </div>
  );
}