import { useState, useEffect } from "react";
import axios from "axios";

const Items = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Make sure the API URL is correct.
    axios
      .get(`${import.meta.env.VITE_API_URL}items`)
      .then((response) => setItems(response.data))
      .catch((error) => console.error("Error fetching items:", error));
  }, []);

  console.log(items);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Items</h1>
      <ul>
        {items.length === 0 ? (
          <p>No items available</p>
        ) : (
          items.map((item) => (
            <li key={item.id} className="border-b py-2">
              {item.name} - {item.category_long}
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default Items;
