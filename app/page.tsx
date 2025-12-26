import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to RFQ Requests page by default
  redirect('/rfq-requests');
}
