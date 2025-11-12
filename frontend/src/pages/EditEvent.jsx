import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Card,
  Button,
  Label,
  TextInput,
  Textarea,
} from "flowbite-react";
import LoadingCard from "../components/LoadingCard";
import ErrorCard from "../components/ErrorCard";
import { ErrorKeys, ERROR_CONFIG } from "../constants/errorMessages";
import { fetchEventById, updateEvent } from "../services/EditEventService";

const EditEvent = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    name: "",
    start_datetime: "",
    end_datetime: "",
    location: "",
    notes: "",
  });

  const [errorKey, setErrorKey] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Convert ISO datetime string to datetime-local format
  const isoToDatetimeLocal = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    // Format: YYYY-MM-DDTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetchEventById(id);
        const eventData = response.data;
        setFormData({
          name: eventData.name || "",
          start_datetime: isoToDatetimeLocal(eventData.start_datetime),
          end_datetime: isoToDatetimeLocal(eventData.end_datetime),
          location: eventData.location || "",
          notes: eventData.notes || "",
        });
      } catch (error) {
        console.error("Error fetching event:", error);
        setErrorKey(ErrorKeys.LOAD_EVENT_FAILED);
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
    if (!formData.name.trim()) errors.name = "Name is required.";
    if (!formData.start_datetime) {
      errors.start_datetime = "Start date and time is required.";
    }
    if (!formData.end_datetime) {
      errors.end_datetime = "End date and time is required.";
    }

    // Validate that end_datetime is after start_datetime
    if (formData.start_datetime && formData.end_datetime) {
      const startDate = new Date(formData.start_datetime);
      const endDate = new Date(formData.end_datetime);
      if (endDate <= startDate) {
        errors.end_datetime = "End date and time must be after start date and time.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      // Convert datetime-local format to ISO string for API
      const submitData = {
        ...formData,
        start_datetime: new Date(formData.start_datetime).toISOString(),
        end_datetime: new Date(formData.end_datetime).toISOString(),
      };
      await updateEvent(id, submitData);
      navigate("/events");
    } catch (error) {
      console.error("Error updating event:", error);
      setErrorKey(ErrorKeys.UPDATE_EVENT_FAILED);
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
    return <LoadingCard message="Loading event..." />;
  }

  return (
    <Card className="my-6 max-w-xl mx-auto p-4 shadow-lg rounded-lg">
      <h2 className="text-3xl mb-4">Edit Event</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <TextInput
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={submitting}
          />
          {formErrors.name && (
            <p className="text-red-500" role="alert">
              {formErrors.name}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="start_datetime">Start Date & Time</Label>
          <TextInput
            id="start_datetime"
            name="start_datetime"
            type="datetime-local"
            value={formData.start_datetime}
            onChange={handleChange}
            disabled={submitting}
          />
          {formErrors.start_datetime && (
            <p className="text-red-500" role="alert">
              {formErrors.start_datetime}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="end_datetime">End Date & Time</Label>
          <TextInput
            id="end_datetime"
            name="end_datetime"
            type="datetime-local"
            value={formData.end_datetime}
            onChange={handleChange}
            disabled={submitting}
          />
          {formErrors.end_datetime && (
            <p className="text-red-500" role="alert">
              {formErrors.end_datetime}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <TextInput
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            disabled={submitting}
          />
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            disabled={submitting}
          />
        </div>
        <div className="flex justify-between pt-4">
          <Button type="submit" color="green" disabled={submitting}>
            {submitting ? "Updating event..." : "Update Event"}
          </Button>
          <Button
            color="light"
            onClick={() => navigate("/events")}
            className="cursor-pointer">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default EditEvent;

