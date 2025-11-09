import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Card,
  Button,
  Label,
  TextInput,
  Select,
} from "flowbite-react";
import LoadingCard from "../components/LoadingCard";
import ErrorCard from "../components/ErrorCard";
import { ErrorKeys, ERROR_CONFIG } from "../constants/errorMessages";
import { getCurrentFutureEvents, createItemBooking } from "../services/NewItemBookingService";

const NewItemBooking = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    item: id,
    event: "",
    quantity: 1,
  });

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState(null);
  const [eventsError, setEventsError] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await getCurrentFutureEvents();
        setEvents(response.data);
      } catch (error) {
        console.error("Error fetching events:", error);
        setEventsError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

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
    if (!formData.event) errors.event = "Event is required.";
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
        ...formData,
        quantity: parseInt(formData.quantity, 10),
      };
      await createItemBooking(submitData);
      navigate(`/items/${id}`);
    } catch (error) {
      console.error("Error creating item booking:", error);
      // Handle backend validation errors
      if (error.response?.data) {
        const backendErrors = error.response.data;
        // Check for quantity validation error from backend
        if (backendErrors.quantity) {
          setFormErrors({ quantity: Array.isArray(backendErrors.quantity) ? backendErrors.quantity[0] : backendErrors.quantity });
        } else if (backendErrors.non_field_errors) {
          // Handle other validation errors
          setFormErrors({ event: Array.isArray(backendErrors.non_field_errors) ? backendErrors.non_field_errors[0] : backendErrors.non_field_errors });
        } else {
          setErrorKey(ErrorKeys.CREATE_ITEM_BOOKING_FAILED);
        }
      } else {
        setErrorKey(ErrorKeys.CREATE_ITEM_BOOKING_FAILED);
      }
    } finally {
      setSubmitting(false);
    }
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
    return <LoadingCard message="Loading events..." />;
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="my-6 max-w-xl mx-auto p-4 shadow-lg rounded-lg">
      <h2 className="text-3xl mb-4">Book Item</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="event">Event</Label>
          <Select
            id="event"
            name="event"
            value={formData.event}
            onChange={handleChange}
            disabled={submitting || eventsError}>
            <option value="">
              {eventsError ? "Events unavailable" : "Select an event"}
            </option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name} ({formatDateTime(event.start_datetime)} - {formatDateTime(event.end_datetime)})
              </option>
            ))}
          </Select>
          {formErrors.event && <p className="text-red-500">{formErrors.event}</p>}
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
          <Button type="submit" disabled={submitting}>
            {submitting ? "Booking item..." : "Add Item Booking"}
          </Button>
          <Button color="light" onClick={() => navigate(`/items/${id}`)}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default NewItemBooking;

