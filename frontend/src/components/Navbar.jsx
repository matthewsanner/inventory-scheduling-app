import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "flowbite-react";
import { HiUser, HiMenu, HiX } from "react-icons/hi";

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
    navigate("/");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-blue-900 text-white p-3 md:p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-lg md:text-xl font-bold">InventoryFlow</h1>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/" className="hover:underline">
            Home
          </Link>
          <Link to="/items" className="hover:underline">
            Items
          </Link>
          <Link to="/events" className="hover:underline">
            Events
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
            <div className="flex items-center gap-2">
              <Link to="/register">
                <Button size="sm" color="light" className="text-blue-900">
                  Sign Up
                </Button>
              </Link>
              <Link to="/login">
                <Button size="sm" color="light" className="text-blue-900">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 rounded-lg hover:bg-blue-800 transition-colors"
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}>
          {isMenuOpen ? (
            <HiX className="text-2xl" />
          ) : (
            <HiMenu className="text-2xl" />
          )}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 pb-2 border-t border-blue-800 pt-4">
          <div className="flex flex-col gap-3">
            <Link
              to="/"
              onClick={closeMenu}
              className="px-2 py-2 hover:bg-blue-800 rounded transition-colors">
              Home
            </Link>
            <Link
              to="/items"
              onClick={closeMenu}
              className="px-2 py-2 hover:bg-blue-800 rounded transition-colors">
              Items
            </Link>
            <Link
              to="/events"
              onClick={closeMenu}
              className="px-2 py-2 hover:bg-blue-800 rounded transition-colors">
              Events
            </Link>
            {isAuthenticated ? (
              <div className="flex flex-col gap-3 pt-2 border-t border-blue-800">
                {user && (
                  <div className="flex items-center gap-2 px-2 py-2">
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
                  className="text-blue-900 w-full">
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2 border-t border-blue-800">
                <Link to="/register" onClick={closeMenu}>
                  <Button
                    size="sm"
                    color="light"
                    className="text-blue-900 w-full">
                    Sign Up
                  </Button>
                </Link>
                <Link to="/login" onClick={closeMenu}>
                  <Button
                    size="sm"
                    color="light"
                    className="text-blue-900 w-full">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
