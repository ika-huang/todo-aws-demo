import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import Todos from './pages/todos/todosPage';
import TodoDetailPage from './pages/todos/TodoDetailPage';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path='/login' element={<Login />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path='/'
          element={
            <ProtectedRoute>
              <Todos />
            </ProtectedRoute>
          }
        />
        <Route path='/todos/:todoId' element={<TodoDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
