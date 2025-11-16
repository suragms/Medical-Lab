import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store';
import Button from '../../components/ui/Button';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Demo credentials
    if (formData.email === 'admin@thyrocare.com' && formData.password === 'admin123') {
      login({
        id: '1',
        name: 'Awsin',
        email: formData.email,
        role: 'admin'
      });
      toast.success('Welcome back, Admin!');
      navigate('/dashboard');
    } else if (formData.email === 'staff@thyrocare.com' && formData.password === 'staff123') {
      login({
        id: '2',
        name: 'Staff Member',
        email: formData.email,
        role: 'staff'
      });
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>HEALit Med Laboratories</h1>
          <p>Kunnathpeedika Centre</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="Enter your password"
              required
            />
          </div>

          <Button type="submit" fullWidth icon={LogIn}>
            Login
          </Button>
        </form>

        <div className="demo-credentials">
          <p><strong>Demo Credentials:</strong></p>
          <p>Admin: admin@thyrocare.com / admin123</p>
          <p>Staff: staff@thyrocare.com / staff123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
