import { Link } from "react-router-dom";
import PublicFooter from "@/components/public/PublicFooter";

const NotFound = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">We couldn't find that page.</p>
          <Link to="/" className="inline-flex min-h-11 items-center rounded-md font-medium text-primary underline underline-offset-4 hover:text-primary/80">
            Return to the Mr Selby overview
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};

export default NotFound;
