export const mockCategories = [
  { value: "COS", label: "Costumes" },
  { value: "WIG", label: "Wigs" },
];

export const mockFormData = {
  name: "Fancy Dress",
  description: "Beautifully made gothic dress",
  image: "http://example.com/image1.jpg",
  category: "COS",
  quantity: "5",
  color: "Red",
  location: "Shelf A",
};

export const mockItem = {
  id: 1,
  name: "Fancy Dress",
  description: "Beautifully made gothic dress",
  image: "http://example.com/image1.jpg",
  category: "COS",
  category_long: "Costumes",
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
      category: "COS",
      category_long: "Costumes",
      quantity: 5,
      color: "Red",
      location: "Shelf A",
    },
    {
      id: 2,
      name: "80s Wig",
      description: "Frazzled old wig",
      image: "http://example.com/image2.jpg",
      category: "WIG",
      category_long: "Wigs",
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