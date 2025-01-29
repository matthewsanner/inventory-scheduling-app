import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}items`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }

    fetchData();
  }, []);

  return (
    <div>
      <h1>Item List</h1>
      <ul>
        {data.map((item) => (
          <li key={item.name}>
            <strong>{item.name}</strong>: {item.description} (Quantity:{" "}
            {item.quantity})
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
