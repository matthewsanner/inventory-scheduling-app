import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import Items from "./pages/Items";
import ItemDetail from "./pages/ItemDetail";
import NewItem from "./pages/NewItem";
import EditItem from "./pages/EditItem";
import NewItemBooking from "./pages/NewItemBooking";
import EditItemBooking from "./pages/EditItemBooking";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import NewEvent from "./pages/NewEvent";
import EditEvent from "./pages/EditEvent";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
// import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <div className="p-4">
          {/* <ErrorBoundary> */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/items" element={<Items />} />
            <Route path="/items/:id" element={<ItemDetail />} />
            <Route path="/items/new" element={<NewItem />} />
            <Route path="/items/:id/edit" element={<EditItem />} />
            <Route path="/items/:id/book" element={<NewItemBooking />} />
            <Route
              path="/itembookings/:id/edit"
              element={<EditItemBooking />}
            />
            <Route path="/events" element={<Events />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/events/new" element={<NewEvent />} />
            <Route path="/events/:id/edit" element={<EditEvent />} />
          </Routes>
          {/* </ErrorBoundary> */}
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
