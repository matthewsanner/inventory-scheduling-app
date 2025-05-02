import { useParams } from "react-router";
import { useState, useEffect } from "react";
import axios from "axios";
import { Card, Button } from "flowbite-react";

const ItemDetail = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}items/${id}/`)
      .then((response) => setItem(response.data))
      .catch((error) => console.error("Error fetching item:", error));
  }, [id]);

  if (!item) {
    return <p className="text-center mt-10 text-gray-500">Loading item...</p>;
  }

  return (
    <Card className="my-8 max-w-2xl mx-auto p-6 shadow-lg">
      <h2 className="text-4xl font-bold mb-4 text-gray-800">{item.name}</h2>
      {item.image && (
        <div className="flex justify-center mb-4">
          <img src={item.image} alt={item.name} className="w-64 h-auto" />
        </div>
      )}
      <p className="mb-4 text-gray-700 text-lg">
        {item.description ? (
          item.description
        ) : (
          <em>No description available.</em>
        )}
      </p>

      <div className="bg-gray-50 rounded-lg p-4 mb-6 border">
        <ul className="grid grid-cols-2 gap-4 text-gray-700 text-sm">
          <li>
            <strong className="block font-semibold">Category:</strong>
            {item.category_long}
          </li>
          <li>
            <strong className="block font-semibold">Quantity:</strong>
            {item.quantity}
          </li>
          <li>
            <strong className="block font-semibold">Color:</strong>
            {item.color}
          </li>
          <li>
            <strong className="block font-semibold">Location:</strong>
            {item.location}
          </li>
          <li>
            <strong className="block font-semibold">Checked Out:</strong>
            {item.checked_out ? "Yes" : "No"}
          </li>
          <li>
            <strong className="block font-semibold">In Repair:</strong>
            {item.in_repair ? "Yes" : "No"}
          </li>
        </ul>
      </div>

      <div className="flex justify-end">
        <Button href="/items">← Back to Items</Button>
      </div>
    </Card>
  );
};

export default ItemDetail;
