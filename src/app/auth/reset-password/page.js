// app/auth/reset-password/page.js
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import AuthHeader from '@/components/auth/AuthHeader';
import styles from './ResetPasswordPage.module.css';

export const metadata = {
  title: 'Reset Password | REG-GPT',
  description: 'Reset your Building Codes Assistant password',
};

export default function ResetPasswordPage() {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <AuthHeader />
        <ResetPasswordForm />
      </div>
    </div>
  );
}