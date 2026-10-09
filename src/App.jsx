import { useState } from "react";

function App() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const createUser = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            username,
            email,
            password,
          }),
        }
      );
      const login = async (e) => {
        e.preventDefault();

        try {
          const response = await fetch(
            "http://localhost:5000/api/auth/login",
            {
              method: "POST",

              headers: {
                "Content-Type": "application/json",
              },

              body: JSON.stringify({
                email: loginEmail,
                password: loginPassword,
              }),
            }
          );

          const data = await response.json();

          if (!response.ok) {
            console.log("Login failed:", data.message);
            return;
          }

          console.log("Login successful:", data);

          localStorage.setItem("token", data.token);
        } catch (error) {
          console.error("Login request failed:", error);
        }
      };

      const data = await response.json();

      if (!response.ok) {
        console.log("Registration failed:", data.message);
        return;
      }

      console.log("Registration successful:", data);
    } catch (error) {
      console.error("Request failed:", error);
    }
  };

  return (
    <div>
      <h1>ConnectCord</h1>

      <h2>Create User</h2>

      <form onSubmit={createUser}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <h2>Login</h2>

        <form onSubmit={login}>
          <input
            type="email"
            placeholder="Email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
          />

          <button type="submit">
            Login
          </button>
        </form>

        <button type="submit">
          Create User
        </button>
      </form>
    </div>
  );
}

export default App;