import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Card,
  Button,
  Label,
  TextInput,
  Textarea,
} from "flowbite-react";
import ErrorCard from "../components/ErrorCard";
import { ErrorKeys, ERROR_CONFIG } from "../constants/errorMessages";
import { createEvent } from "../services/NewEventService";

const NewEvent = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    start_datetime: "",
    end_datetime: "",
    location: "",
    notes: "",
  });

  const [errorKey, setErrorKey] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

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
      await createEvent(submitData);
      navigate("/events");
    } catch (error) {
      console.error("Error creating event:", error);
      setErrorKey(ErrorKeys.CREATE_EVENT_FAILED);
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
        onBack={onBack(navigate)}
        backLabel={backLabel}
      />
    );
  }

  return (
    <Card className="my-4 sm:my-6 max-w-xl mx-auto p-3 sm:p-4 shadow-lg rounded-lg">
      <h2 className="text-2xl sm:text-3xl mb-4">Add New Event</h2>
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
        <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0 pt-4">
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? "Adding event..." : "Add Event"}
          </Button>
          <Button color="light" onClick={() => navigate("/events")} className="w-full sm:w-auto">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default NewEvent;

