import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Pagination,
  Button,
  TextInput,
  Label,
} from "flowbite-react";
import ErrorCard from "../components/ErrorCard";
import LoadingCard from "../components/LoadingCard";
import { ErrorKeys, ERROR_CONFIG } from "../constants/errorMessages";
import { getEvents } from "../services/EventsService";

const Events = () => {
  const [events, setEvents] = useState([]);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [errorKey, setErrorKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    start_datetime_after: "",
    start_datetime_before: "",
  });

  const navigate = useNavigate();
  const pageSize = 10;

  const fetchEvents = useCallback(
    async (page) => {
      setLoading(true);
      setErrorKey(null);
      const {
        data,
        pageCount: count,
        errorKey: err,
      } = await getEvents(page, filters, pageSize);
      if (data) {
        setEvents(data);
        setPageCount(count);
      } else {
        setErrorKey(err);
      }
      setLoading(false);
    },
    [filters]
  );

  useEffect(() => {
    fetchEvents(currentPage);
  }, [currentPage, filters, fetchEvents]);

  const handlePageChange = (page) => setCurrentPage(page);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      location: "",
      start_datetime_after: "",
      start_datetime_before: "",
    });
    setCurrentPage(1);
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "";
    const date = new Date(dateTimeString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const currentErrorConfig =
    ERROR_CONFIG[errorKey] || ERROR_CONFIG[ErrorKeys.GENERIC_ERROR];

  return (
    <Card className="my-6 w-full max-w-[95%] md:max-w-[90%] lg:max-w-[85%] mx-auto p-2 md:p-4 shadow-lg rounded-lg">
      <div className="flex justify-between">
        <h2 className="text-3xl mb-4">Events</h2>
        <div className="flex justify-end mb-4">
          <Button href="/events/new">Add New Event</Button>
        </div>
      </div>

      {/* Search and Filter Form */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="search">Search</Label>
            <TextInput
              id="search"
              name="search"
              placeholder="Search events..."
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <TextInput
              id="location"
              name="location"
              placeholder="Filter by location..."
              value={filters.location}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <Label htmlFor="start_datetime_after">Event Date After</Label>
            <TextInput
              id="start_datetime_after"
              name="start_datetime_after"
              type="date"
              value={filters.start_datetime_after}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <Label htmlFor="start_datetime_before">Event Date Before</Label>
            <TextInput
              id="start_datetime_before"
              name="start_datetime_before"
              type="date"
              value={filters.start_datetime_before}
              onChange={handleFilterChange}
            />
          </div>
          <div className="flex items-end justify-end">
            <Button color="gray" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {errorKey ? (
        <ErrorCard
          message={currentErrorConfig.message}
          onBack={currentErrorConfig.onBack(navigate)}
          backLabel={currentErrorConfig.backLabel}
        />
      ) : loading ? (
        <LoadingCard message="Loading events..." />
      ) : events.length === 0 ? (
        <p>No events available</p>
      ) : (
        <>
          <div className="overflow-x-auto w-full">
            <div className="max-w-[1200px] mx-auto">
              <Table hoverable className="border border-gray-300">
                <TableHead>
                  <TableRow className="bg-gray-100">
                    <TableHeadCell>Name</TableHeadCell>
                    <TableHeadCell>Start Date</TableHeadCell>
                    <TableHeadCell>End Date</TableHeadCell>
                    <TableHeadCell>Location</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody data-testid="events-table">
                  {events.map((event) => (
                    <TableRow
                      key={event.id}
                      data-testid={`event-row-${event.id}`}
                      onClick={() => navigate(`/events/${event.id}`)}
                      className="hover:bg-gray-100 transition cursor-pointer">
                      <TableCell
                        className="font-medium truncate"
                        title={event.name}>
                        {event.name}
                      </TableCell>
                      <TableCell className="truncate">
                        {formatDateTime(event.start_datetime)}
                      </TableCell>
                      <TableCell className="truncate">
                        {formatDateTime(event.end_datetime)}
                      </TableCell>
                      <TableCell className="truncate" title={event.location}>
                        {event.location || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-end mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={pageCount}
              onPageChange={handlePageChange}
              showIcons
            />
          </div>
        </>
      )}
    </Card>
  );
};

export default Events;
