import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Card, Button, Label, TextInput } from "flowbite-react";
import LoadingCard from "../components/LoadingCard";
import ErrorCard from "../components/ErrorCard";
import DeleteItemBookingModal from "../components/DeleteItemBookingModal";
import { ErrorKeys, ERROR_CONFIG } from "../constants/errorMessages";
import {
  fetchItemBookingById,
  updateItemBooking,
  deleteItemBooking,
} from "../services/EditItemBookingService";

const EditItemBooking = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    quantity: 1,
  });

  const [bookingData, setBookingData] = useState(null);
  const [errorKey, setErrorKey] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetchItemBookingById(id);
        setBookingData(response.data);
        setFormData({
          quantity: response.data.quantity,
        });
      } catch (error) {
        console.error("Error fetching item booking:", error);
        setErrorKey(ErrorKeys.LOAD_ITEM_BOOKING_FAILED);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setErrorKey(null);

    const errors = {};
    const quantityNum = parseInt(formData.quantity, 10);
    if (!formData.quantity || isNaN(quantityNum) || quantityNum < 1)
      errors.quantity = "Quantity must be at least 1.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      // Ensure quantity is a number for the API
      const submitData = {
        quantity: parseInt(formData.quantity, 10),
      };
      await updateItemBooking(id, submitData);
      // Navigate back to item detail page
      navigate(`/items/${bookingData.item}`);
    } catch (error) {
      console.error("Error updating item booking:", error);
      // Handle backend validation errors
      if (error.response?.data) {
        const backendErrors = error.response.data;
        // Check for quantity validation error from backend
        if (backendErrors.quantity) {
          setFormErrors({
            quantity: Array.isArray(backendErrors.quantity)
              ? backendErrors.quantity[0]
              : backendErrors.quantity,
          });
        } else {
          setErrorKey(ErrorKeys.UPDATE_ITEM_BOOKING_FAILED);
        }
      } else {
        setErrorKey(ErrorKeys.UPDATE_ITEM_BOOKING_FAILED);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteItemBooking(id);
      // Navigate back to item detail page
      navigate(`/items/${bookingData.item}`);
    } catch (error) {
      console.error("Error deleting item booking:", error);
      setErrorKey(ErrorKeys.DELETE_ITEM_BOOKING_FAILED);
      setShowDeleteModal(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (errorKey) {
    const errorConfig =
      ERROR_CONFIG[errorKey] || ERROR_CONFIG[ErrorKeys.GENERIC_ERROR];
    const { message, onBack, backLabel } = errorConfig;
    // Use item ID from booking data if available, otherwise navigate to items list
    const itemId = bookingData?.item;
    return (
      <ErrorCard
        message={message}
        onBack={itemId ? onBack(navigate, itemId) : () => navigate("/items")}
        backLabel={backLabel}
      />
    );
  }

  if (loading) {
    return <LoadingCard message="Loading item booking..." />;
  }

  return (
    <>
      <Card className="my-6 max-w-xl mx-auto p-4 shadow-lg rounded-lg">
        <h2 className="text-3xl mb-4">Edit Item Booking</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="item">Item</Label>
            <TextInput
              id="item"
              name="item"
              value={bookingData?.item_name || ""}
              disabled={true}
            />
          </div>
          <div>
            <Label htmlFor="event">Event</Label>
            <TextInput
              id="event"
              name="event"
              value={
                bookingData?.event_name
                  ? `${bookingData.event_name} (${formatDateTime(bookingData.event_start_datetime)} - ${formatDateTime(bookingData.event_end_datetime)})`
                  : ""
              }
              disabled={true}
            />
          </div>
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <TextInput
              id="quantity"
              name="quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange}
              disabled={submitting}
            />
            {formErrors.quantity && (
              <p className="text-red-500">{formErrors.quantity}</p>
            )}
          </div>
          <div className="flex justify-between pt-4">
            <Button
              color="red"
              onClick={() => setShowDeleteModal(true)}
              disabled={submitting}>
              Delete Booking
            </Button>
            <Button type="submit" color="green" disabled={submitting}>
              {submitting ? "Updating booking..." : "Update Booking"}
            </Button>
            <Button
              color="light"
              onClick={() => navigate(`/items/${bookingData?.item}`)}
              disabled={submitting}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>

      <DeleteItemBookingModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        itemName={bookingData?.item_name || ""}
        eventName={bookingData?.event_name || ""}
      />
    </>
  );
};

export default EditItemBooking;
