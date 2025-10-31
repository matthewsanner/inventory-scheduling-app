import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Card,
  Checkbox,
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
import { getItems, getCategories } from "../services/ItemsService";

const Items = () => {
  const [items, setItems] = useState([]);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [errorKey, setErrorKey] = useState(null);
  const [categoriesError, setCategoriesError] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    color: "",
    location: "",
    checked_out: "",
    in_repair: "",
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
      checked_out: "",
      in_repair: "",
    });
    setCurrentPage(1);
  };

  const currentErrorConfig =
    ERROR_CONFIG[errorKey] || ERROR_CONFIG[ErrorKeys.GENERIC_ERROR];

  return (
    <Card className="my-6 w-full max-w-[95%] md:max-w-[90%] lg:max-w-[85%] mx-auto p-2 md:p-4 shadow-lg rounded-lg">
      <div className="flex justify-between">
        <h2 className="text-3xl mb-4">Items</h2>
        <div className="flex justify-end mb-4">
          <Button href="/items/new">Add New Item</Button>
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
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="checked_out"
                name="checked_out"
                checked={filters.checked_out}
                onChange={handleFilterChange}
              />
              <Label htmlFor="checked_out">Checked Out</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="in_repair"
                name="in_repair"
                checked={filters.in_repair}
                onChange={handleFilterChange}
              />
              <Label htmlFor="in_repair">In Repair</Label>
            </div>
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
                    <TableHeadCell>Checked Out</TableHeadCell>
                    <TableHeadCell>In Repair</TableHeadCell>
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
                        title={item.category_long}>
                        {item.category_long}
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
                      <TableCell>
                        <div className="flex justify-center">
                          <Checkbox checked={item.checked_out} disabled />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <Checkbox checked={item.in_repair} disabled />
                        </div>
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
