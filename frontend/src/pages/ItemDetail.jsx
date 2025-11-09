import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Card, Button } from "flowbite-react";
import LoadingCard from "../components/LoadingCard";
import ErrorCard from "../components/ErrorCard";
import DeleteItemModal from "../components/DeleteItemModal";
import { ErrorKeys, ERROR_CONFIG } from "../constants/errorMessages";
import { getItem, deleteItem } from "../services/ItemDetailService";

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    getItem(id)
      .then((response) => {
        setItem(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching item:", error);
        setErrorKey(ErrorKeys.LOAD_ITEM_FAILED);
        setLoading(false);
      });
  }, [id]);

  const handleDelete = () => {
    deleteItem(id)
      .then(() => {
        navigate("/items");
      })
      .catch((error) => {
        console.error("Error deleting item:", error);
        setErrorKey(ErrorKeys.DELETE_ITEM_FAILED);
        setShowDeleteModal(false);
      });
  };

  if (errorKey) {
    const errorConfig =
      ERROR_CONFIG[errorKey] || ERROR_CONFIG[ErrorKeys.GENERIC_ERROR];
    const { message, onBack, backLabel } = errorConfig;
    return (
      <ErrorCard
        message={message}
        onBack={onBack(navigate, id)}
        backLabel={backLabel}
      />
    );
  }

  if (loading) {
    return <LoadingCard message="Loading item..." />;
  }

  return (
    <>
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
          </ul>
        </div>

        <div className="flex justify-between gap-4">
          <Button color="red" onClick={() => setShowDeleteModal(true)}>
            Delete Item
          </Button>
          <Button color="green" onClick={() => navigate(`/items/${id}/edit`)}>
            Edit Item
          </Button>
          <Button color="blue" onClick={() => navigate(`/items/${id}/book`)}>
            Book Item
          </Button>
          <Button color="light" onClick={() => navigate("/items")}>
            ← Back to Items
          </Button>
        </div>
      </Card>

      <DeleteItemModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        itemName={item.name}
      />
    </>
  );
};

export default ItemDetail;
