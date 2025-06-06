import { Card, Button } from "flowbite-react";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { useNavigate } from "react-router";
import { ERROR_CONFIG, ErrorKeys } from "../constants/errorMessages"; // adjust path as needed

const ErrorCard = ({ message, onBack, backLabel }) => {
  const navigate = useNavigate();

  // Use generic error config as fallback defaults
  const generic = ERROR_CONFIG[ErrorKeys.GENERIC_ERROR];

  // Resolve props with fallback to generic config
  const resolvedMessage = message ?? generic.message;
  const resolvedBackLabel = backLabel ?? generic.backLabel;
  const resolvedOnBack = onBack ?? generic.onBack(navigate);

  return (
    <Card className="my-6 max-w-xl mx-auto p-6 shadow-lg rounded-lg border border-red-300 bg-red-50">
      <div className="text-center">
        <HiOutlineExclamationCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
        <h2 className="text-2xl font-bold text-red-700 mb-2">Error</h2>
        <p className="text-md text-red-600 mb-6">{resolvedMessage}</p>
        <Button
          color="light"
          onClick={resolvedOnBack}
          className="mx-auto block">
          {resolvedBackLabel}
        </Button>
      </div>
    </Card>
  );
};

export default ErrorCard;
