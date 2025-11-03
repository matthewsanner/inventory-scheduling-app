import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import Items from "./pages/Items";
import ItemDetail from "./pages/ItemDetail";
import NewItem from "./pages/NewItem";
import EditItem from "./pages/EditItem";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div className="p-4">
          <ErrorBoundary>
            <Routes>
              <Route
                path="/"
                element={<h1 className="text-2xl font-bold">Home</h1>}
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/items" element={<Items />} />
              <Route path="/items/:id" element={<ItemDetail />} />
              <Route path="/items/new" element={<NewItem />} />
              <Route path="/items/:id/edit" element={<EditItem />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
