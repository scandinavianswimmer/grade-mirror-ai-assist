import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">We couldn't find that page.</p>
        <Link to="/" className="font-medium text-primary underline underline-offset-4 hover:text-primary/80">
          Return to the Mr Selby overview
        </Link>
      </div>
    </main>
  );
};

export default NotFound;
