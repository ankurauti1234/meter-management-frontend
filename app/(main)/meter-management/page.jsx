// app/meter-management/page.jsx
import { redirect } from 'next/navigation';

export default function MeterManagement() {
  // Redirect to default tab
  redirect('/meter-management/event-stream');
}