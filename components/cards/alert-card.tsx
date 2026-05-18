import { WifiOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Badge } from "@/components/ui/badge";

interface AlertCardProps {
  device_id: string;
  hhid?: string | null;
  lastEventAt?: string | null;
}

export function AlertCard({ device_id, hhid, lastEventAt }: AlertCardProps) {
  const inactiveDuration = lastEventAt
    ? formatDistanceToNow(new Date(lastEventAt), { addSuffix: false })
    : "Never connected";

  return (
    <Item variant="outline">
      <ItemMedia variant="icon">
        <WifiOff className="text-destructive" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="flex items-center gap-2">
          <code className="text-sm font-mono">{device_id}</code>
          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
            Inactive
          </Badge>
        </ItemTitle>
        <ItemDescription>
          {hhid ? `HHID: ${hhid} · ` : ""}
          Inactive for {inactiveDuration}
        </ItemDescription>
      </ItemContent>
    </Item>
  );
}
