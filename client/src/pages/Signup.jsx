import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSignup(email, password) {
    await signup(email, password);
    navigate('/', { replace: true });
  }

  return (
    <AuthForm
      title="Create your account"
      subtitle="Password must be at least 8 characters"
      submitLabel="Sign up"
      onSubmit={handleSignup}
      footer={{ text: 'Already have an account?', linkLabel: 'Log in', to: '/login' }}
    />
  );
}
