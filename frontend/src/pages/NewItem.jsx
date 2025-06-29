import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Card,
  Button,
  Label,
  TextInput,
  Textarea,
  Select,
  Checkbox,
} from "flowbite-react";
import ErrorCard from "../components/ErrorCard";
import { ErrorKeys, ERROR_CONFIG } from "../constants/errorMessages";
import { getCategories, createItem } from "../services/NewItemService";

const NewItem = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    category: "",
    quantity: 1,
    color: "",
    location: "",
    checked_out: false,
    in_repair: false,
  });

  const [categories, setCategories] = useState([]);
  const [errorKey, setErrorKey] = useState(null);
  const [categoriesError, setCategoriesError] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    getCategories()
      .then((response) => {
        setCategories(response.data);
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
        setCategoriesError(true);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const errors = {};
    if (!formData.name.trim()) errors.name = "Name is required.";
    if (!formData.quantity || formData.quantity < 1)
      errors.quantity = "Quantity must be at least 1.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    createItem(formData)
      .then(() => {
        navigate("/items");
      })
      .catch((error) => {
        console.error("Error creating item:", error);
        setErrorKey(ErrorKeys.CREATE_ITEM_FAILED);
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

  return (
    <Card className="my-6 max-w-xl mx-auto p-4 shadow-lg rounded-lg">
      <h2 className="text-3xl mb-4">Add New Item</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <TextInput
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
          {formErrors.name && <p className="text-red-500">{formErrors.name}</p>}
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="image">Image URL</Label>
          <TextInput
            type="url"
            id="image"
            name="image"
            value={formData.image}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}>
            <option value="">
              {categoriesError ? "Categories unavailable" : "Select a category"}
            </option>
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <TextInput
            id="quantity"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
          />
          {formErrors.quantity && (
            <p className="text-red-500">{formErrors.quantity}</p>
          )}
        </div>
        <div>
          <Label htmlFor="color">Color</Label>
          <TextInput
            id="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <TextInput
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="checked_out"
            name="checked_out"
            checked={formData.checked_out}
            onChange={handleCheckboxChange}
          />
          <Label htmlFor="checked_out">Checked Out</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="in_repair"
            name="in_repair"
            checked={formData.in_repair}
            onChange={handleCheckboxChange}
          />
          <Label htmlFor="in_repair">In Repair</Label>
        </div>
        <div className="flex justify-between pt-4">
          <Button type="submit">Add Item</Button>
          <Button color="light" onClick={() => navigate("/items")}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default NewItem;
