import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import LoginForm from "../../components/forms/LoginForm";
import ROUTES from "../../routes/routePaths";

const LoginContainer = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const { login, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    // const savedPassword = localStorage.getItem("rememberedPassword");
    if (savedEmail) {
      setEmail(savedEmail);
      // setPassword(savedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    
    if (rememberMe) {
      localStorage.setItem("rememberedEmail", email);
      // localStorage.setItem("rememberedPassword", password);
    } else {
      localStorage.removeItem("rememberedEmail");
      // localStorage.removeItem("rememberedPassword");
    }

    try {
      const data = await login({ email, password });
      // Navigate based on role
      if (data.user?.role === "admin") {
        navigate(ROUTES.ADMIN_DASHBOARD);
      } else {
        navigate(ROUTES.USER_DOCUMENTS);
      }
    } catch {
      // Error is set in store
    }
  };

  return (
    <LoginForm
      email={email}
      password={password}
      rememberMe={rememberMe}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onRememberMeChange={setRememberMe}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
    />
  );
};

export default LoginContainer;
