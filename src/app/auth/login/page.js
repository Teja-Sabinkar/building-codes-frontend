// app/auth/login/page.js
import LoginForm from '@/components/auth/LoginForm';
import AuthHeader from '@/components/auth/AuthHeader';
import styles from './LoginPage.module.css';

export const metadata = {
  title: 'Login | AI CAD',
  description: 'Log in to your AI CAD account',
};

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <AuthHeader />
        <LoginForm />
      </div>
    </div>
  );
}