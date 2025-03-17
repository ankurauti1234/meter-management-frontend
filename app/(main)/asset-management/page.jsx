// app/asset-management/page.jsx
import { redirect } from 'next/navigation';

export default function AssetManagement() {
  // Redirect to default tab
  redirect('/asset-management/inventory');
}