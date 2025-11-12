import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react";
import LoadingCard from "../components/LoadingCard";
import ErrorCard from "../components/ErrorCard";
import DeleteItemModal from "../components/DeleteItemModal";
import { ErrorKeys, ERROR_CONFIG } from "../constants/errorMessages";
import { getItem, deleteItem } from "../services/ItemDetailService";
import { getItemBookingsByItem } from "../services/ItemBookingService";
import { formatDateTime } from "../utils/dateFormatting";

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
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

    getItemBookingsByItem(id)
      .then((response) => {
        if (response.errorKey) {
          console.error("Error fetching bookings:", response.error);
          // Don't set error key for bookings failure, just log it
        } else {
          setBookings(response.data || []);
        }
        setBookingsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching bookings:", error);
        setBookingsLoading(false);
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
              {item.category?.name || ""}
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

      <Card className="my-8 max-w-3xl mx-auto p-6 shadow-lg">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">Item Bookings</h3>
        {bookingsLoading ? (
          <LoadingCard message="Loading bookings..." />
        ) : bookings.length === 0 ? (
          <p className="text-gray-600 italic">No bookings for this item.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table hoverable>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Event Name</TableHeadCell>
                  <TableHeadCell>Start Date & Time</TableHeadCell>
                  <TableHeadCell>End Date & Time</TableHeadCell>
                  <TableHeadCell>Quantity</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow
                    key={booking.id}
                    className="bg-white dark:border-gray-700 dark:bg-gray-800 cursor-pointer hover:bg-gray-50"
                    onClick={() =>
                      navigate(`/itembookings/${booking.id}/edit`)
                    }>
                    <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {booking.event_name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-gray-700 dark:text-gray-400">
                      {formatDateTime(booking.event_start_datetime, {
                        month: "short",
                      })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-gray-700 dark:text-gray-400">
                      {formatDateTime(booking.event_end_datetime, {
                        month: "short",
                      })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-gray-700 dark:text-gray-400">
                      {booking.quantity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </>
  );
};

export default ItemDetail;
