// app/auth/signup/page.js
import SignupForm from '@/components/auth/SignupForm';
import AuthHeader from '@/components/auth/AuthHeader';
import styles from './SignupPage.module.css';

export const metadata = {
  title: 'Sign Up | AI CAD',
  description: 'Create an account for AI CAD',
};

export default function SignupPage() {
  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <AuthHeader />
        <SignupForm />
      </div>
    </div>
  );
}