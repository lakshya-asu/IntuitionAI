import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [userId] = useState('user123'); // In a real app, handle proper authentication

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Adjust the URL if needed; here we're using localhost for the prototype
      const res = await axios.post('http://localhost:8000/query', {
        user_id: userId,
        query: query,
        profile: {} // Dummy profile data; add more details as you refine the system
      });
      setResponse(res.data.response);
    } catch (error) {
      console.error(error);
      setResponse("Error processing your query.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Personalized Learning Assistant</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          style={{ width: "100%", height: "100px" }}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your query here..."
        />
        <br />
        <button type="submit" style={{ marginTop: "10px" }}>Submit Query</button>
      </form>
      {response && (
        <div style={{ marginTop: "20px" }}>
          <h2>Response:</h2>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}

export default App;
