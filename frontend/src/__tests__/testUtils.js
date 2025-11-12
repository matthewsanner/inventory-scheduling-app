export const mockCategories = [
  { value: 1, label: "Costumes" },
  { value: 2, label: "Wigs" },
];

export const mockFormData = {
  name: "Fancy Dress",
  description: "Beautifully made gothic dress",
  image: "http://example.com/image1.jpg",
  category: 1,
  quantity: "5",
  color: "Red",
  location: "Shelf A",
};

export const mockItem = {
  id: 1,
  name: "Fancy Dress",
  description: "Beautifully made gothic dress",
  image: "http://example.com/image1.jpg",
  category: { id: 1, name: "Costumes" },
  quantity: 5,
  color: "Red",
  location: "Shelf A",
};

export const mockItems = {
  count: 2,
  results: [
    {
      id: 1,
      name: "Fancy Dress",
      description: "Beautifully made gothic dress",
      image: "http://example.com/image1.jpg",
      category: { id: 1, name: "Costumes" },
      quantity: 5,
      color: "Red",
      location: "Shelf A",
    },
    {
      id: 2,
      name: "80s Wig",
      description: "Frazzled old wig",
      image: "http://example.com/image2.jpg",
      category: { id: 2, name: "Wigs" },
      quantity: 2,
      color: "Blonde",
      location: "Shelf B",
    },
  ],
};

export const mockEvent = {
  id: 1,
  name: "Summer Festival",
  start_datetime: "2024-07-15T10:00:00Z",
  end_datetime: "2024-07-15T18:00:00Z",
  location: "Central Park",
  notes: "Annual summer music festival",
};

export const mockEvents = {
  count: 2,
  results: [
    {
      id: 1,
      name: "Summer Festival",
      start_datetime: "2024-07-15T10:00:00Z",
      end_datetime: "2024-07-15T18:00:00Z",
      location: "Central Park",
      notes: "Annual summer music festival",
    },
    {
      id: 2,
      name: "Winter Gala",
      start_datetime: "2024-12-20T19:00:00Z",
      end_datetime: "2024-12-20T23:00:00Z",
      location: "Grand Ballroom",
      notes: "Formal winter event",
    },
  ],
};

export const mockEventFormData = {
  name: "Summer Festival",
  start_datetime: "2024-07-15T10:00",
  end_datetime: "2024-07-15T18:00",
  location: "Central Park",
  notes: "Annual summer music festival",
};

export const mockCurrentFutureEvents = [
  {
    id: 1,
    name: "Summer Festival",
    start_datetime: "2024-07-15T10:00:00Z",
    end_datetime: "2024-07-15T18:00:00Z",
    location: "Central Park",
    notes: "Annual summer music festival",
  },
  {
    id: 2,
    name: "Winter Gala",
    start_datetime: "2024-12-20T19:00:00Z",
    end_datetime: "2024-12-20T23:00:00Z",
    location: "Grand Ballroom",
    notes: "Formal winter event",
  },
];

export const mockItemBookingFormData = {
  item: "1",
  event: "1",
  quantity: 2,
};

export const mockItemBooking = {
  id: 1,
  item: 1,
  event: 1,
  quantity: 2,
  item_name: "Fancy Dress",
  event_name: "Summer Festival",
  event_start_datetime: "2024-07-15T10:00:00Z",
  event_end_datetime: "2024-07-15T18:00:00Z",
};

export const mockItemBookings = [
  {
    id: 1,
    item: 1,
    event: 1,
    quantity: 2,
    item_name: "Fancy Dress",
    event_name: "Summer Festival",
    event_start_datetime: "2024-07-15T10:00:00Z",
    event_end_datetime: "2024-07-15T18:00:00Z",
  },
  {
    id: 2,
    item: 1,
    event: 2,
    quantity: 1,
    item_name: "Fancy Dress",
    event_name: "Winter Gala",
    event_start_datetime: "2024-12-20T19:00:00Z",
    event_end_datetime: "2024-12-20T23:00:00Z",
  },
];
