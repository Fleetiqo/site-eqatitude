import { notFound } from "next/navigation";

/** Any unknown URL renders the site's 404 page inside the site layout. */
export default function CatchAll() {
  notFound();
}
