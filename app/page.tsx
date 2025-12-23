import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to profile page by default
  redirect('/profile');
}
