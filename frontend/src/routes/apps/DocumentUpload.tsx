import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

interface File {
  id: number;
  filename: string;
  uploaded_at: string;
}

const ALLOWED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "gif"];

export default function DocumentUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchFiles();
    }
  }, [isAuthenticated]);

  const fetchFiles = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/files", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch files");
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error("Error fetching files:", error);
      showMessage("error", "Failed to load files");
    }
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const fileInput = event.currentTarget.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    if (!fileInput?.files?.length) {
      showMessage("error", "Please select a file to upload");
      return;
    }

    const file = fileInput.files[0];
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "";

    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      showMessage("error", "File type not allowed");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/files/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        showMessage("success", "File uploaded successfully!");
        fetchFiles();
      } else {

        if (data.message == "Malicious file detected!"){
          showMessage("error", data.error || "Upload failed! Malicious file detected!");
        }
        else{
          showMessage("error", data.error || "Upload failed");
        }

        
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      showMessage("error", "Failed to upload file");
    }
  };

  const handleDelete = async (fileId: number) => {
    if (!window.confirm("Are you sure you want to delete this file?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/files/delete/${fileId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (data.success) {
        showMessage("success", "File deleted successfully");
        fetchFiles();
      } else {
        showMessage("error", data.error || "Delete failed");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      showMessage("error", "Failed to delete file");
    }
  };

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">
          Please log in to access the document upload system.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Secure File Repository</h1>

      {/* Message Display */}
      {message && (
        <div
          className={`mb-4 p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Upload Form */}
      <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-8">
        <div className="bg-green-50 border border-green-200 p-4 rounded-md mb-4">
          <strong className="text-green-700">Secure File Storage:</strong>
          <span className="text-green-600">
            {" "}
            This application only accepts image and PDF files for security
            purposes.
          </span>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <input
              type="file"
              name="file"
              accept=".pdf,.png,.jpg,.jpeg,.gif"
              className="w-full p-2 border rounded-md"
              required
            />
            <div className="mt-2 text-sm text-gray-600">
              <strong>Allowed file types:</strong> .pdf, .png, .jpg, .jpeg, .gif
            </div>
          </div>
          <button
            type="submit"
            className="bg-[#501214] text-white px-4 py-2 rounded-md hover:bg-[#3d0e0f] transition-colors"
          >
            Upload File
          </button>
        </form>
      </div>

      {/* File List */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Your Uploaded Files</h2>
        {files.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {files.map((file) => (
              <li
                key={file.id}
                className="py-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{file.filename}</p>
                  <p className="text-sm text-gray-600">
                    Uploaded: {file.uploaded_at}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      window.open(
                        `http://localhost:5000/api/files/download/${file.id}`,
                        "_blank"
                      )
                    }
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center text-gray-600 italic py-4">
            You haven't uploaded any files yet.
          </p>
        )}
      </div>
    </div>
  );
}
