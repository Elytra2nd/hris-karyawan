import LoginForm from '@/components/login-form';

export default function LoginPage() {
  return (
    <main style={{
      display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center',
      background: '#FAFBFC', padding: 16,
      fontFamily: "'Satoshi', 'Inter', system-ui, sans-serif",
    }}>
      <LoginForm />
    </main>
  );
}