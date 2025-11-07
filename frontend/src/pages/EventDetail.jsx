import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { Card, Button } from "flowbite-react";
import LoadingCard from "../components/LoadingCard";
import ErrorCard from "../components/ErrorCard";
import { ErrorKeys, ERROR_CONFIG } from "../constants/errorMessages";
import { getEvent } from "../services/EventDetailService";

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState(null);

  useEffect(() => {
    getEvent(id)
      .then((response) => {
        setEvent(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching event:", error);
        setErrorKey(ErrorKeys.LOAD_EVENT_FAILED);
        setLoading(false);
      });
  }, [id]);

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
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

  if (loading) {
    return <LoadingCard message="Loading event..." />;
  }

  return (
    <Card className="my-8 max-w-2xl mx-auto p-6 shadow-lg">
      <h2 className="text-4xl font-bold mb-4 text-gray-800">{event.name}</h2>

      <div className="bg-gray-50 rounded-lg p-4 mb-6 border">
        <ul className="grid grid-cols-1 gap-4 text-gray-700 text-sm">
          <li>
            <strong className="block font-semibold">Start Date & Time:</strong>
            {formatDateTime(event.start_datetime)}
          </li>
          <li>
            <strong className="block font-semibold">End Date & Time:</strong>
            {formatDateTime(event.end_datetime)}
          </li>
          <li>
            <strong className="block font-semibold">Location:</strong>
            {event.location || <em>No location specified.</em>}
          </li>
        </ul>
      </div>

      {event.notes && (
        <p className="mb-4 text-gray-700 text-lg">
          <strong className="block font-semibold mb-2">Notes:</strong>
          {event.notes}
        </p>
      )}

      <div className="flex justify-between gap-4">
        <Button
          color="red"
          onClick={() => {
            // TODO: Implement delete functionality
            console.log("Delete event functionality to be implemented");
          }}>
          Delete Event
        </Button>
        <Button color="green" onClick={() => navigate(`/events/${id}/edit`)}>
          Edit Event
        </Button>
        <Button color="light" onClick={() => navigate("/events")}>
          ← Back to Events
        </Button>
      </div>
    </Card>
  );
};

export default EventDetail;
