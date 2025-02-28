import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

interface Note {
  id: number;
  title: string;
  content: string;
  created_at: string;
  user_id: number;
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotes();
    }
  }, [isAuthenticated]);

  const fetchNotes = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/notes", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }

      const data = await response.json();
      if (data.success) {
        setNotes(data.notes);
      } else {
        throw new Error(data.error || "Failed to load notes");
      }
    } catch (error) {
      console.error("Error fetching notes:", error);
      setError(error instanceof Error ? error.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      showMessage("error", "Title and content are required");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/notes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ title, content }),
      });

      const data = await response.json();

      if (data.success) {
        setNotes((prevNotes) => [data.note, ...prevNotes]);
        setTitle("");
        setContent("");
        showMessage("success", "Note created successfully!");
      } else {
        throw new Error(data.error || "Failed to create note");
      }
    } catch (error) {
      console.error("Error creating note:", error);
      showMessage(
        "error",
        error instanceof Error ? error.message : "Failed to create note"
      );
    }
  };

  const handleSearch = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/notes/search?q=${encodeURIComponent(
          searchTerm
        )}`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (data.success) {
        setNotes(data.notes);
        if (data.notes.length === 0) {
          showMessage("error", "No notes found matching your search.");
        }
      } else {
        throw new Error(data.error || "Search failed");
      }
    } catch (error) {
      console.error("Error searching notes:", error);
      showMessage(
        "error",
        error instanceof Error ? error.message : "Search failed"
      );
    }
  };

  const handleDelete = async (noteId: number) => {
    if (!window.confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/api/notes/delete/${noteId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (data.success) {
        setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
        showMessage("success", "Note deleted successfully!");
      } else {
        throw new Error(data.error || "Failed to delete note");
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      showMessage(
        "error",
        error instanceof Error ? error.message : "Failed to delete note"
      );
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
          Please log in to access the notes system.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-none p-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">SecureNotes v0.1-beta</h1>
          <p className="text-gray-600">
            A totally secure note-taking application
          </p>
        </div>

        {message && (
          <div
            className={`mb-4 p-4 rounded-md text-center ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-gray-50 p-6 rounded-lg shadow-sm mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">Create New Note</span>
              <span className="bg-yellow-300 px-2 py-1 rounded text-xs font-bold">
                BETA
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title (supports custom formatting)"
              className="w-full p-2 border rounded-md"
              required
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your note content here. Pro tip: You can use special characters for formatting!"
              className="w-full p-2 border rounded-md min-h-[100px]"
              required
            />
            <div className="text-sm text-gray-500 italic">
              Need formatting help? Try using special characters!
            </div>
            <button
              type="submit"
              className="w-full bg-[#501214] text-white px-4 py-2 rounded-md hover:bg-[#3d0e0f] transition-colors"
            >
              Save Note
            </button>
          </form>
        </div>

        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notes..."
            className="flex-1 p-2 border rounded-md"
          />
          <button
            onClick={handleSearch}
            className="bg-[#501214] text-white px-4 py-2 rounded-md hover:bg-[#3d0e0f] transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Notes List - Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-600">
              Loading notes...
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-md">
              {error}
            </div>
          ) : notes.length > 0 ? (
            notes.map((note) => (
              <div
                key={note.id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
              >
                <h3 className="text-xl font-semibold mb-2">{note.title}</h3>
                <div className="text-gray-600 mb-4 whitespace-pre-wrap">
                  {note.content}
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>
                    ID: {note.id} | Created:{" "}
                    {new Date(note.created_at).toLocaleString()}
                  </span>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-600">
              No notes found. Create your first note above!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
