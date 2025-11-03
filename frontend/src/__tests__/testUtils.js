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
