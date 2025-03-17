"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useState } from "react";

// Dummy data for the table
const dummyRemotes = [
  { remoteId: "R001", status: "Active", hhid: "1001" },
  { remoteId: "R002", status: "Inactive", hhid: "1002" },
  { remoteId: "R003", status: "Active", hhid: null },
  { remoteId: "R004", status: "Inactive", hhid: "1004" },
  { remoteId: "R005", status: "Active", hhid: "1005" },
  { remoteId: "R006", status: "Inactive", hhid: null },
  { remoteId: "R007", status: "Active", hhid: "1007" },
  { remoteId: "R008", status: "Inactive", hhid: "1008" },
  { remoteId: "R009", status: "Active", hhid: "1009" },
  { remoteId: "R010", status: "Inactive", hhid: null },
];

export default function RemoteStream() {
  const [remotes, setRemotes] = useState(dummyRemotes);
  const [page, setPage] = useState(1);
  const limit = 5; // Items per page
  const totalRemotes = dummyRemotes.length;
  const totalPages = Math.ceil(totalRemotes / limit);

  // Pagination logic
  const paginatedRemotes = remotes.slice((page - 1) * limit, page * limit);

  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="mx-auto container">
      <Card className="w-full rounded-lg">
        <CardHeader className="px-6 py-4">
          <CardTitle className="flex items-center gap-2 text-xl font-bold">
            Remote Stream
          </CardTitle>
          <CardDescription className="text-sm mt-1">
            {paginatedRemotes.length} remotes shown of {totalRemotes} total
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2">
          <div className="[&>div]:max-h-96">
            <Table className="[&_td]:border-border [&_th]:border-border border-separate border-spacing-0 [&_th]:border-b [&_tr]:border-none [&_tr:not(:last-child)_td]:border-b">
              <TableHeader className="bg-background/90 sticky top-0 z-10 backdrop-blur-xs">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Remote ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Household ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRemotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                      No remotes available
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRemotes.map((remote) => (
                    <TableRow key={remote.remoteId}>
                      <TableCell className="font-medium">{remote.remoteId}</TableCell>
                      <TableCell>{remote.status}</TableCell>
                      <TableCell>{remote.hhid || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t bg-muted/10 p-4">
            <div className="text-sm text-muted-foreground">
              Showing {paginatedRemotes.length} of {totalRemotes} remotes
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                variant="outline"
                size="sm"
                className="h-8 border-muted hover:bg-muted"
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                variant="outline"
                size="sm"
                className="h-8 border-muted hover:bg-muted"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}