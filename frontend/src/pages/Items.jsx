import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
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
} from "flowbite-react";

const Items = () => {
  const [items, setItems] = useState([]);
  const [pageCount, setPageCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const pageSize = 10; // update when page size increases for production

  const fetchItems = (page) => {
    axios
      .get(`${import.meta.env.VITE_API_URL}items/?page=${page}`)
      .then((response) => {
        setItems(response.data.results);
        setPageCount(Math.ceil(response.data.count / pageSize));
      })
      .catch((error) => console.error("Error fetching items:", error));
  };

  useEffect(() => {
    fetchItems(currentPage);
  }, [currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <Card className="my-6 max-w-fit mx-auto p-4 shadow-lg rounded-lg">
      <div className="flex justify-between">
        <h2 className="text-3xl mb-4">Items</h2>
        <div className="flex justify-end mb-4">
          <Button href="/items/new">Add New Item</Button>
        </div>
      </div>

      {items.length === 0 ? (
        <p>No items available</p>
      ) : (
        <>
          <div className="overflow-x-auto max-w-fit mx-auto shadow-md">
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
                  <TableHeadCell>Actions</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="hover:bg-gray-100 transition">
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.category_long}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.color}</TableCell>
                    <TableCell>{item.location}</TableCell>
                    <TableCell>
                      <Checkbox checked={item.checked_out} disabled />
                    </TableCell>
                    <TableCell>
                      <Checkbox checked={item.in_repair} disabled />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="xs"
                          color="blue"
                          className="cursor-pointer"
                          onClick={() => navigate(`/items/${item.id}`)}>
                          View
                        </Button>
                        <Button
                          size="xs"
                          color="green"
                          className="cursor-pointer"
                          onClick={() => navigate(`/items/${item.id}/edit`)}>
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
