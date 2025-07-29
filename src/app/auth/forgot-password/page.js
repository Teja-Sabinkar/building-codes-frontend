// app/auth/forgot-password/page.js
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import AuthHeader from '@/components/auth/AuthHeader';
import styles from './ForgotPasswordPage.module.css';

export const metadata = {
  title: 'Forgot Password | AI CAD',
  description: 'Reset your AI CAD password',
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