import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Card,
  Button,
  Label,
  TextInput,
  Textarea,
  Select,
} from "flowbite-react";
import ErrorCard from "../components/ErrorCard";
import { ErrorKeys, ERROR_CONFIG } from "../constants/errorMessages";
import { getCategories, createItem } from "../services/NewItemService";
import { validateQuantity } from "../utils/validation";
import { validateImageUrl } from "../utils/sanitization";

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
  });

  const [categories, setCategories] = useState([]);
  const [errorKey, setErrorKey] = useState(null);
  const [categoriesError, setCategoriesError] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        setCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setCategoriesError(true);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setErrorKey(null);

    const errors = {};
    if (!formData.name.trim()) errors.name = "Name is required.";
    const quantityError = validateQuantity(formData.quantity);
    if (quantityError) errors.quantity = quantityError;
    
    // Validate image URL if provided
    if (formData.image && formData.image.trim()) {
      const imageValidation = validateImageUrl(formData.image);
      if (!imageValidation.isValid) {
        errors.image = "Image URL must use http:// or https:// protocol, or be a relative path starting with /.";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const submitData = {
        ...formData,
        category: formData.category ? Number(formData.category) : null,
      };
      await createItem(submitData);
      navigate("/items");
    } catch (error) {
      console.error("Error creating item:", error);
      setErrorKey(ErrorKeys.CREATE_ITEM_FAILED);
    } finally {
      setSubmitting(false);
    }
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
    <Card className="my-4 sm:my-6 max-w-xl mx-auto p-3 sm:p-4 shadow-lg rounded-lg">
      <h2 className="text-2xl sm:text-3xl mb-4">Add New Item</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <TextInput
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={submitting}
          />
          {formErrors.name && (
            <p className="text-red-500" role="alert">
              {formErrors.name}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            disabled={submitting}
          />
        </div>
        <div>
          <Label htmlFor="image">Image URL</Label>
          <TextInput
            // type="url"
            id="image"
            name="image"
            value={formData.image}
            onChange={handleChange}
            disabled={submitting}
          />
          {formErrors.image && (
            <p className="text-red-500" role="alert">
              {formErrors.image}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            disabled={submitting}>
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
            disabled={submitting}
          />
          {formErrors.quantity && (
            <p className="text-red-500" role="alert">
              {formErrors.quantity}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="color">Color</Label>
          <TextInput
            id="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
            disabled={submitting}
          />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <TextInput
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            disabled={submitting}
          />
        </div>
        <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0 pt-4">
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? "Adding item..." : "Add Item"}
          </Button>
          <Button color="light" onClick={() => navigate("/items")} className="w-full sm:w-auto">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default NewItem;
