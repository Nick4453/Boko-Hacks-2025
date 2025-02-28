import { Link, NavLink, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

export const PAGES: { name: string; href: string }[] = [
  { name: "Home", href: "/" },
  { name: "Admin Portal", href: "/admin" },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="h-24 bg-[#501214] w-full flex p-5 items-center justify-between text-white">
        <div className="flex items-center gap-8">
          <p className="font-bold text-2xl">BokoHacks</p>
          <nav className="flex gap-4">
            {PAGES.map((page) => (
              <NavLink
                key={page.href}
                to={page.href}
                className={({ isActive }) =>
                  `hover:text-gray-200 text-white transition-colors ${
                    isActive ? "font-bold" : ""
                  }`
                }
              >
                {page.name}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span>Welcome, {user?.username}!</span>
              <button
                onClick={handleLogout}
                className="text-black bg-white rounded-md px-3 py-2 hover:bg-gray-100 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="text-black bg-white rounded-md px-3 py-2 hover:bg-gray-100 transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
      <div className="h-full w-full overflow-scroll">
        <Outlet />
      </div>
      <div className="h-12 w-full bg-[#501214] text-white">footer</div>
    </div>
  );
}
