import { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function ResetPassword() {
  const { token } = useParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async () => {
    if (password !== confirmPassword) {
      return setMessage("Passwords do not match");
    }

    try {
      const res = await axios.post(
        `https://lms-l9fr.onrender.com/api/users/reset-password/${token}`,
        {
          password,
        }
      );

      setMessage(res.data.message);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Reset failed"
      );
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="login-card">
        <h1>Reset Password</h1>

        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button
          className="btn-primary"
          onClick={handleReset}
        >
          Reset Password
        </button>

        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

export default ResetPassword;