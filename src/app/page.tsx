import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect root path '/' to the main dashboard
  redirect('/dashboard');
}
