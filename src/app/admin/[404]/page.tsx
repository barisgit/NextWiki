import { notFound } from "next/navigation";

// This is a page that is used to trigger a 404 error, because we have a catch-all route for all pages in
// app/[...path]/page.tsx, and we want to trigger a 404 error for all admin pages.
export default function NotFoundTrigger() {
  notFound();
}
