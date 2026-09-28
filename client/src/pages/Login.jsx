import { useNavigate, useLocation } from 'react-router-dom';
import AuthForm from '../components/AuthForm.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogin(email, password) {
    await login(email, password);
    // Go back to the page the user originally wanted
    navigate(location.state?.from || '/', { replace: true });
  }

  return (
    <AuthForm
      title="Welcome back"
      subtitle="Log in to keep studying"
      submitLabel="Log in"
      onSubmit={handleLogin}
      footer={{ text: "Don't have an account?", linkLabel: 'Sign up', to: '/signup' }}
    />
  );
}
