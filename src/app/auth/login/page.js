// app/auth/login/page.js
import LoginForm from '@/components/auth/LoginForm';
import AuthHeader from '@/components/auth/AuthHeader';
import styles from './LoginPage.module.css';

export const metadata = {
  title: 'Login | REG-GPT',
  description: 'Log in to your Building Codes Assistant account',
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