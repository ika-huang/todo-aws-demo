import { useState } from 'react';
import { useAuthStore } from '../../store/auth'
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { register } = useAuthStore();

  const handleRegister = async () => {
    try {
      setError('');
      await register(email, password);
      alert('註冊成功，請檢查信箱驗證！');
      navigate('/login');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2>註冊</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        type='email'
        placeholder='Email'
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type='password'
        placeholder='密碼'
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleRegister}>註冊</button>
    </div>
  );
}
