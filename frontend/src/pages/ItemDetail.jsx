import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import axios from "axios";
import { Card, Button, Modal, ModalHeader, ModalBody } from "flowbite-react";
import { HiOutlineExclamationCircle } from "react-icons/hi";

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}items/${id}/`)
      .then((response) => setItem(response.data))
      .catch((error) => console.error("Error fetching item:", error));
  }, [id]);

  const handleDelete = () => {
    axios
      .delete(`${import.meta.env.VITE_API_URL}items/${id}/`)
      .then(() => {
        navigate("/items");
      })
      .catch((error) => console.error("Error deleting item:", error));
  };

  if (!item) {
    return <p className="text-center mt-10 text-gray-500">Loading item...</p>;
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

        <div className="flex justify-between gap-4">
          <Button color="red" onClick={() => setShowDeleteModal(true)}>
            Delete Item
          </Button>
          <Button color="green" onClick={() => navigate(`/items/${id}/edit`)}>
            Edit Item
          </Button>
          <Button href="/items">← Back to Items</Button>
        </div>
      </Card>

      <Modal
        show={showDeleteModal}
        size="md"
        onClose={() => setShowDeleteModal(false)}
        popup>
        <ModalHeader />
        <ModalBody>
          <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Are you sure you want to delete &ldquo;{item.name}&rdquo;?
            </h3>
            <div className="flex justify-center gap-4">
              <Button color="red" onClick={handleDelete}>
                Yes, I&apos;m sure
              </Button>
              <Button color="gray" onClick={() => setShowDeleteModal(false)}>
                No, cancel
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>
    </>
  );
};

export default ItemDetail;
