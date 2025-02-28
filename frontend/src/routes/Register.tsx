import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router";

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [captchaUrl, setCaptchaUrl] = useState("");

  useEffect(() => {
    refreshCaptcha();
  }, []);

  const refreshCaptcha = () => {
    // Add timestamp to prevent caching
    setCaptchaUrl(`http://localhost:5000/api/captcha/generate?t=${Date.now()}`);
  };

  const handleSubmit = async (evt: FormEvent) => {
    evt.preventDefault();
    setError(null);
    const formData = new FormData(evt.currentTarget as HTMLFormElement);

    // Check if passwords match
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm_password") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    formData.append(
      "captcha",
      (formData.get("captcha") as string).toUpperCase()
    );

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to login after successful registration
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError(data.message || "Registration failed");
        refreshCaptcha();
        (evt.currentTarget as HTMLFormElement).querySelector<HTMLInputElement>(
          'input[name="captcha"]'
        )!.value = "";
      }
    } catch {
      setError("An error occurred while trying to register");
      refreshCaptcha();
      (evt.currentTarget as HTMLFormElement).querySelector<HTMLInputElement>(
        'input[name="captcha"]'
      )!.value = "";
    }
  };

  return (
    <div className="w-full flex justify-center pt-8">
      <div className="w-176 h-auto rounded-lg shadow-md border-2 flex flex-col items-center p-4">
        <p className="font-bold text-4xl mb-4">Register</p>
        <p className="text-gray-600 mb-4">
          Sign up to participate in BokoHacks and test your security skills.
        </p>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form
          onSubmit={handleSubmit}
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
          <input
            type="password"
            className="w-full h-12 rounded-md border-2 px-2"
            placeholder="Confirm Password"
            name="confirm_password"
            required
          />
          <div className="w-full flex flex-col gap-2">
            <div className="relative w-full p-2 border-2 rounded-md bg-white">
              <img
                src={captchaUrl}
                alt="CAPTCHA"
                className="mx-auto h-16 object-contain"
                onClick={refreshCaptcha}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-2xl text-[#501214] hover:text-[#3d0e0f]"
                onClick={refreshCaptcha}
                title="Refresh CAPTCHA"
              >
                ↻
              </button>
            </div>
            <input
              type="text"
              className="w-full h-12 rounded-md border-2 px-2"
              placeholder="Enter CAPTCHA"
              name="captcha"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-[#501214] text-white py-2 rounded-md hover:bg-[#3d0e0f] transition-colors"
          >
            Register
          </button>
        </form>
        <p className="mt-4 text-gray-600">
          Already have an account?{" "}
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              navigate("/login");
            }}
            className="text-[#501214] hover:underline"
          >
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}
