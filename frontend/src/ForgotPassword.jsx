import { useState } from "react";
import axios from "axios";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    try {
      const res = await axios.post(
        "https://lms-l9fr.onrender.com/api/users/forgot-password",
        { email }
      );

      setMessage(res.data.message);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Something went wrong"
      );
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="login-card">
        <h1>Forgot Password</h1>

        <p>
          Enter your registered email address.
        </p>

        <input
          type="email"
          placeholder="Enter Registered Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          className="btn-primary"
          onClick={handleSubmit}
        >
          Send Reset Link
        </button>

        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

export default ForgotPassword;