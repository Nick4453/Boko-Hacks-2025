import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import CodeScanner from "./apps/CodeScanner";
import DocumentCard from "./apps/DocumentUpload";
import NewsCard from "./apps/News";
import NotesCard from "./apps/Notes";

const CARDS: CardData[] = [
  {
    title: "Company News",
    description: "Stay updated with the latest business and industry news.",
    component: NewsCard,
  },
  {
    title: "Notes App",
    description:
      "A simple note-taking platform for jotting down tasks, ideas, and reminders.",
    component: NotesCard,
  },
  {
    title: "Document Upload",
    description:
      "Upload and store your PDF files for easy sharing with teammates.",
    component: DocumentCard,
  },
  {
    title: "Code Scanner",
    description:
      "Scan your code for potential security vulnerabilities and ethical hacking issues.",
    component: CodeScanner,
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <div className="container mx-auto p-4">
        <section className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to BokoHacks 2025</h1>
          <p className="text-lg mb-8">
            An Application Security Challenge Platform for Texas State
            University's 2025 BokoHacks
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CARDS.map((card, idx) => (
              <AppCard data={card} key={idx} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex flex-col">
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <section className="text-center">
            <h1 className="text-4xl font-bold text-[#501214] mb-4">
              Welcome to BokoHacks
            </h1>
            <h2 className="text-3xl font-bold mb-4">Join the Challenge</h2>
            <p className="text-xl text-gray-600 mb-8">
              Test your cybersecurity and ethical hacking skills.
            </p>
            <div className="space-x-4">
              <button
                onClick={() => navigate("/login")}
                className="bg-[#501214] text-white px-6 py-2 rounded-md hover:bg-[#3d0e0f] transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className="bg-[#501214] text-white px-6 py-2 rounded-md hover:bg-[#3d0e0f] transition-colors"
              >
                Register
              </button>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 BokoHacks | All Rights Reserved</p>
        </div>
      </footer>
    </div>
  );
}

type CardData = {
  title: string;
  description: string;
  image?: string;
  component: () => React.ReactElement;
};

function AppCard({ data }: { data: CardData }) {
  return (
    <Dialog>
      <DialogTrigger>
        <div className="app-card p-4 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">{data.title}</h3>
          <p className="text-gray-700 mb-4">{data.description}</p>
        </div>
      </DialogTrigger>
      <DialogContent className="w-200 h-230">
        <data.component />
      </DialogContent>
    </Dialog>
  );
}
