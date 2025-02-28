import { FormEvent, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  async function submitForm(evt: FormEvent) {
    evt.preventDefault();
    setError(null);
    const formData = new FormData(evt.currentTarget as HTMLFormElement);

    try {
      const response = await login(formData);

      // Check if we need to redirect to Duo
      if (response.duo_url) {
        // Redirect to Duo authentication
        window.location.href = response.duo_url;
      } else {
        // Normal login success, redirect to home
        navigate("/");
      }
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred while trying to log in"
      );
    }
  }

  return (
    <div className="w-full flex justify-center pt-8">
      <div className="w-176 h-86 rounded-lg shadow-md border-2 flex flex-col items-center p-4">
        <p className="font-bold text-4xl mb-4">Login</p>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form
          onSubmit={submitForm}
          className="flex flex-col gap-5 max-w-136 w-136"
        >
          <input
            type="text"
            className="w-full h-12 rounded-md border-2 px-2"
            placeholder="Username"
            name="username"
            required
          />
          <input
            type="password"
            className="w-full h-12 rounded-md border-2 px-2"
            placeholder="Password"
            name="password"
            required
          />
          <button
            type="submit"
            className="bg-[#501214] text-white py-2 rounded-md hover:bg-[#3d0e0f] transition-colors"
          >
            Login
          </button>
        </form>
        <p className="mt-4 text-gray-600">
          Don't have an account?{" "}
          <a
            href="/register"
            onClick={(e) => {
              e.preventDefault();
              navigate("/register");
            }}
            className="text-[#501214] hover:underline"
          >
            Register here
          </a>
        </p>
      </div>
    </div>
  );
}
