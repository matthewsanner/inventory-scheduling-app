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
import DeleteEventModal from "../components/DeleteEventModal";
import { ErrorKeys, ERROR_CONFIG } from "../constants/errorMessages";
import { getEvent, deleteEvent } from "../services/EventDetailService";
import { getItemBookingsByEvent } from "../services/ItemBookingService";

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [errorKey, setErrorKey] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

    getItemBookingsByEvent(id)
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

  const handleDelete = () => {
    deleteEvent(id)
      .then(() => {
        navigate("/events");
      })
      .catch((error) => {
        console.error("Error deleting event:", error);
        setErrorKey(ErrorKeys.DELETE_EVENT_FAILED);
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
        onBack={onBack(navigate)}
        backLabel={backLabel}
      />
    );
  }

  if (loading) {
    return <LoadingCard message="Loading event..." />;
  }

  return (
    <>
      <Card className="my-8 max-w-2xl mx-auto p-6 shadow-lg">
        <h2 className="text-4xl font-bold mb-4 text-gray-800">{event.name}</h2>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 border">
          <ul className="grid grid-cols-1 gap-4 text-gray-700 text-sm">
            <li>
              <strong className="block font-semibold">
                Start Date & Time:
              </strong>
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
          <Button color="red" onClick={() => setShowDeleteModal(true)}>
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

      <DeleteEventModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        eventName={event.name}
      />

      <Card className="my-8 max-w-2xl mx-auto p-6 shadow-lg">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">Item Bookings</h3>
        {bookingsLoading ? (
          <LoadingCard message="Loading bookings..." />
        ) : bookings.length === 0 ? (
          <p className="text-gray-600 italic">No bookings for this event.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table hoverable>
              <TableHead>
                <TableRow>
                  <TableHeadCell>Item Name</TableHeadCell>
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
                      {booking.item_name}
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

export default EventDetail;
