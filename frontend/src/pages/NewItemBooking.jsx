import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { Card, Button, Label, TextInput, Select } from "flowbite-react";
import LoadingCard from "../components/LoadingCard";
import ErrorCard from "../components/ErrorCard";
import { ErrorKeys, ERROR_CONFIG } from "../constants/errorMessages";
import {
  getCurrentFutureEvents,
  createItemBooking,
} from "../services/NewItemBookingService";
import { validateQuantity } from "../utils/validation";
import { formatDateTime } from "../utils/dateFormatting";
import { handleBackendError } from "../utils/errorHandling";

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
    const quantityError = validateQuantity(formData.quantity);
    if (quantityError) errors.quantity = quantityError;

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
      const { formErrors: backendFormErrors, errorKey: backendErrorKey } =
        handleBackendError(error, ErrorKeys.CREATE_ITEM_BOOKING_FAILED, {
          non_field_errors: "event",
        });

      if (Object.keys(backendFormErrors).length > 0) {
        setFormErrors(backendFormErrors);
      }
      if (backendErrorKey) {
        setErrorKey(backendErrorKey);
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

  return (
    <Card className="my-4 sm:my-6 max-w-xl mx-auto p-3 sm:p-4 shadow-lg rounded-lg">
      <h2 className="text-2xl sm:text-3xl mb-4">Book Item</h2>
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
                {event.name} ({formatDateTime(event.start_datetime)} -{" "}
                {formatDateTime(event.end_datetime)})
              </option>
            ))}
          </Select>
          {formErrors.event && (
            <p className="text-red-500" role="alert">
              {formErrors.event}
            </p>
          )}
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
            <p className="text-red-500" role="alert">
              {formErrors.quantity}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0 pt-4">
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? "Booking item..." : "Add Item Booking"}
          </Button>
          <Button color="light" onClick={() => navigate(`/items/${id}`)} className="w-full sm:w-auto">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default NewItemBooking;
