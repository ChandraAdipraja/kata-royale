import { Link } from "react-router-dom";
import { Button } from "./Button.jsx";

export const EmptyState = ({ title, description, actionLabel, actionTo }) => (
  <section className="panel mx-auto max-w-xl rounded-lg p-8 text-center">
    <h1 className="text-2xl font-black">{title}</h1>
    <p className="mt-3 text-ink/65">{description}</p>
    {actionLabel && actionTo && (
      <Link to={actionTo}>
        <Button className="mt-5">{actionLabel}</Button>
      </Link>
    )}
  </section>
);
