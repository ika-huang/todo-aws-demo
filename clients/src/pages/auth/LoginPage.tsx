// src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await login(email, password);
      alert('登入成功');
      navigate('/todos');
    } catch (err: any) {
      alert('登入失敗: ' + err.message);
    }
  };

  return (
    <div>
      <h2>登入</h2>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder='Email' />
      <input type='password' value={password} onChange={(e) => setPassword(e.target.value)} placeholder='密碼' />
      <button onClick={handleLogin}>登入</button>
    </div>
  );
}
