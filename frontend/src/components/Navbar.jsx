import { Link } from "react-router";

const Navbar = () => {
  return (
    <nav className="bg-blue-900 text-white p-4 flex justify-between">
      <h1 className="text-xl font-bold">Inventory App</h1>
      <div>
        <Link to="/" className="mr-4">
          Home
        </Link>
        <Link to="/items">Items</Link>
      </div>
    </nav>
  );
};

export default Navbar;
