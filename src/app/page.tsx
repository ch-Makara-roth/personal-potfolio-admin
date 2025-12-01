import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect root path '/' to the main dashboard
  // The middleware will handle the auth check
  redirect('/dashboard');
}
