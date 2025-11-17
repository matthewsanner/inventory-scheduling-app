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
  Select,
  Label,
} from "flowbite-react";
import ErrorCard from "../components/ErrorCard";
import LoadingCard from "../components/LoadingCard";
import { ErrorKeys, ERROR_CONFIG } from "../constants/errorMessages";
import {
  getItems,
  getCategories,
  createCategory,
} from "../services/ItemsService";

const Items = () => {
  const [items, setItems] = useState([]);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [errorKey, setErrorKey] = useState(null);
  const [categoriesError, setCategoriesError] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    color: "",
    location: "",
  });

  const navigate = useNavigate();
  const pageSize = 10;

  const fetchCategories = async () => {
    const { data, errorKey } = await getCategories();
    if (data) {
      setCategories(data);
    } else {
      setCategoriesError(true);
      console.error("Error fetching categories:", errorKey);
    }
  };

  const fetchItems = useCallback(
    async (page) => {
      setLoading(true);
      setErrorKey(null);
      const {
        data,
        pageCount: count,
        errorKey: err,
      } = await getItems(page, filters, pageSize);
      if (data) {
        setItems(data);
        setPageCount(count);
      } else {
        setErrorKey(err);
      }
      setLoading(false);
    },
    [filters]
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchItems(currentPage);
  }, [currentPage, filters, fetchItems]);

  const handlePageChange = (page) => setCurrentPage(page);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      search: "",
      category: "",
      color: "",
      location: "",
    });
    setCurrentPage(1);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setCategoryError("");

    if (!newCategoryName.trim()) {
      setCategoryError("Category name is required");
      return;
    }

    setCreatingCategory(true);
    const { data, error } = await createCategory(newCategoryName.trim());

    if (data) {
      // Add the new category to the list
      setCategories((prev) => {
        const updated = [...prev, data];
        // Sort by label to maintain alphabetical order
        return updated.sort((a, b) => a.label.localeCompare(b.label));
      });
      setNewCategoryName("");
      setCategoryError("");
    } else {
      // Extract error message from response
      let errorMessage = "Failed to create category. Please try again.";
      if (error?.response?.data) {
        const backendErrors = error.response.data;
        if (backendErrors.name) {
          errorMessage = Array.isArray(backendErrors.name)
            ? backendErrors.name[0]
            : backendErrors.name;
        } else if (backendErrors.non_field_errors) {
          errorMessage = Array.isArray(backendErrors.non_field_errors)
            ? backendErrors.non_field_errors[0]
            : backendErrors.non_field_errors;
        }
      }
      setCategoryError(errorMessage);
    }
    setCreatingCategory(false);
  };

  const currentErrorConfig =
    ERROR_CONFIG[errorKey] || ERROR_CONFIG[ErrorKeys.GENERIC_ERROR];

  return (
    <Card className="my-6 w-full max-w-[95%] md:max-w-[90%] lg:max-w-[85%] mx-auto p-2 md:p-4 shadow-lg rounded-lg">
      <div className="flex justify-between">
        <h2 className="text-3xl mb-4">Items</h2>
        <div className="flex justify-end mb-4">
          <Button onClick={() => navigate("/items/new")}>Add New Item</Button>
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
              placeholder="Search items..."
              value={filters.search}
              onChange={handleFilterChange}
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              name="category"
              data-testid="category-select"
              value={filters.category}
              onChange={handleFilterChange}
              disabled={categoriesError}>
              <option value="">
                {categoriesError ? "Categories unavailable" : "All Categories"}
              </option>
              {!categoriesError &&
                categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="new-category">Create New Category</Label>
            <form onSubmit={handleCreateCategory} className="flex gap-2">
              <TextInput
                id="new-category"
                name="newCategoryName"
                placeholder="Category name..."
                value={newCategoryName}
                onChange={(e) => {
                  setNewCategoryName(e.target.value);
                  setCategoryError("");
                }}
                disabled={creatingCategory || categoriesError}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={creatingCategory || categoriesError}
                size="sm">
                {creatingCategory ? "Adding..." : "Add"}
              </Button>
            </form>
            {categoryError && (
              <p
                className="text-red-500 text-sm mt-1"
                data-testid="category-error"
                role="alert">
                {categoryError}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="color">Color</Label>
            <TextInput
              id="color"
              name="color"
              placeholder="Filter by color..."
              value={filters.color}
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
        <LoadingCard message="Loading items..." />
      ) : items.length === 0 ? (
        <p>No items available</p>
      ) : (
        <>
          <div className="overflow-x-auto w-full">
            <div className="max-w-[1200px] mx-auto">
              <Table hoverable className="border border-gray-300">
                <TableHead>
                  <TableRow className="bg-gray-100">
                    <TableHeadCell>Name</TableHeadCell>
                    <TableHeadCell>Category</TableHeadCell>
                    <TableHeadCell>Quantity</TableHeadCell>
                    <TableHeadCell>Color</TableHeadCell>
                    <TableHeadCell>Location</TableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody data-testid="items-table">
                  {items.map((item) => (
                    <TableRow
                      key={item.id}
                      data-testid={`item-row-${item.id}`}
                      onClick={() => navigate(`/items/${item.id}`)}
                      className="hover:bg-gray-100 transition cursor-pointer">
                      <TableCell
                        className="font-medium truncate"
                        title={item.name}>
                        {item.name}
                      </TableCell>
                      <TableCell
                        className="truncate"
                        title={item.category?.name || ""}>
                        {item.category?.name || ""}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="truncate" title={item.color}>
                        {item.color}
                      </TableCell>
                      <TableCell className="truncate" title={item.location}>
                        {item.location}
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

export default Items;
