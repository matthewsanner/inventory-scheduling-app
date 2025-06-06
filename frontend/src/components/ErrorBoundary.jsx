import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";
import ErrorCard from "./ErrorCard";
import { useNavigate } from "react-router";

function ErrorFallback({ error, resetErrorBoundary }) {
  const navigate = useNavigate();

  return (
    <ErrorCard
      message={`Something went wrong: ${error.message}`}
      backLabel="← Back to Home"
      onBack={() => navigate("/")}
    />
  );
}

function ErrorBoundary({ children }) {
  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => {
        // optional: clear app state here if needed
      }}>
      {children}
    </ReactErrorBoundary>
  );
}

export default ErrorBoundary;
