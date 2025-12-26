import { Card, Spinner } from "flowbite-react";

const LoadingCard = ({ message = "Loading..." }) => (
  <Card className="my-4 sm:my-6 max-w-xl mx-auto p-4 sm:p-6 shadow-lg rounded-lg">
    <div className="text-center my-6 sm:my-8">
      <Spinner size="xl" />
      <p className="text-sm sm:text-md font-medium text-gray-600 mt-4">{message}</p>
    </div>
  </Card>
);

export default LoadingCard;
