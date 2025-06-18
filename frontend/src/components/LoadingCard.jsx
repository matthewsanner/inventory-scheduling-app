import { Card, Spinner } from "flowbite-react";

const LoadingCard = ({ message = "Loading..." }) => (
  <Card className="my-6 max-w-xl mx-auto p-4 shadow-lg rounded-lg">
    <div className="text-center my-8">
      <Spinner size="xl" />
      <p className="text-md font-medium text-gray-600">{message}</p>
    </div>
  </Card>
);

export default LoadingCard;
