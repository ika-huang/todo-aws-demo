import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export default function Navbar() {
  const navigate = useNavigate();
  const {
    accessToken,
    logout,
  } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav>
      {accessToken && <><Link to='/'>Todos</Link> | </>}<Link to='/register'>註冊</Link>
      <button onClick={handleLogout} style={{ marginLeft: '10px' }}>
        登出
      </button>
    </nav>
  );
}
