'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlugsConnected } from '@phosphor-icons/react';
import { fetchMeters } from '@/utils/ssh-apis';

export default function RemoteConnection() {
  const [meters, setMeters] = useState([]);
  const [filteredMeters, setFilteredMeters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMetersData();
  }, []);

  const fetchMetersData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMeters();
      if (data.success) {
        const filtered = data.meters.filter((meter) => meter.port !== '1');
        setMeters(filtered);
        setFilteredMeters(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch meters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (term === '') {
      setFilteredMeters(meters);
    } else {
      const filtered = meters.filter((meter) =>
        meter.meterId.toLowerCase().includes(term)
      );
      setFilteredMeters(filtered);
    }
  };

  return (
    <div className="mx-auto container py-6">
      <Card className="w-full rounded-lg">
        <CardHeader className="px-6 py-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <PlugsConnected className="text-primary" size={20} weight="duotone" />
              Available Meters
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              {filteredMeters.length} meters detected
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Search by Meter ID..."
              value={searchTerm}
              onChange={handleSearch}
              className="bg-background/50 max-w-lg"
            />
          </div>
        </CardHeader>
        <CardContent className="p-2 overflow-hidden rounded-b-lg">
          <div className="[&>div]:max-h-96">
            <Table className="[&_td]:border-border [&_th]:border-border border-separate border-spacing-0 [&_th]:border-b [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b">
              <TableHeader className="bg-background/90 sticky top-0 z-10 backdrop-blur-xs">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Meter ID</TableHead>
                  <TableHead>Port</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                      <div className="animate-pulse">Loading meters...</div>
                    </TableCell>
                  </TableRow>
                ) : filteredMeters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                      {searchTerm ? 'No meters match your search' : 'No meters available'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMeters.map((meter) => (
                    <TableRow key={meter.meterId} className="hover:bg-muted/10">
                      <TableCell className="font-semibold">{meter.meterId}</TableCell>
                      <TableCell>{meter.port}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/remote-connection/${meter.meterId}?port=${meter.port}`}>
                          <Button size="sm" variant="outline">
                            Connect
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t bg-muted/10 p-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredMeters.length} meters
            </div>
            <Button
              onClick={fetchMetersData}
              size="sm"
              variant="outline"
              className="border-muted hover:bg-muted"
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}