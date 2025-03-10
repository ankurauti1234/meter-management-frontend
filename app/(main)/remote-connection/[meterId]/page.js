'use client';

import Terminal from '@/components/Terminal';
import { useRouter, useSearchParams } from 'next/navigation';

export default function TerminalPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const port = searchParams.get('port');

  const handleClose = () => {
    router.push('/remote-connection');
  };

  return (
    <div className="mx-auto container py-6">
     <Terminal 
      meterId={params.meterId} 
      port={port} 
      onClose={handleClose}
    />
   </div>
  );
}