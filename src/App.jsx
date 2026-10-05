import { useState } from "react";

function App() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const createUser = async (e) => {
    e.preventDefault();

    const response = await fetch("http://localhost:5000/api/users", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    const data = await response.json();

    console.log(data);
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

        <button type="submit">
          Create User
        </button>
      </form>
    </div>
  );
}

export default App;