import { Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "flowbite-react";
import { HiUser } from "react-icons/hi";

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className="bg-blue-900 text-white p-4 flex justify-between items-center">
      <h1 className="text-xl font-bold">InventoryFlow</h1>
      <div className="flex items-center gap-4">
        <Link to="/" className="hover:underline">
          Home
        </Link>
        <Link to="/items" className="hover:underline">
          Items
        </Link>
        {isAuthenticated ? (
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-2">
                <HiUser className="text-lg" />
                <span className="text-sm">
                  {user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user.username}
                </span>
              </div>
            )}
            <Button
              onClick={handleLogout}
              size="sm"
              color="light"
              className="text-blue-900">
              Sign Out
            </Button>
          </div>
        ) : (
          <Link to="/login">
            <Button size="sm" color="light" className="text-blue-900">
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
