import { useSelector, useDispatch } from 'react-redux';
import { setCredentials, setUser, logout } from '../features/auth/authSlice.js';
import { authApi } from '../features/auth/authApi.js';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    dispatch(setCredentials(data.data));
    return data.data;
  };

  const register = async (payload) => {
    const { data } = await authApi.register(payload);
    return data.data;
  };

  const fetchMe = async () => {
    const { data } = await authApi.getMe();
    dispatch(setUser(data.data));
    return data.data;
  };

  const doLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return { user, isAuthenticated, login, register, fetchMe, logout: doLogout };
}
