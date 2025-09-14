"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";

type Props = {
  broadstreet_id?: number;
  mongo_id?: string;
  className?: string;
};

export function EntityIdBadge({ broadstreet_id, mongo_id, className }: Props) {
  if (!broadstreet_id && !mongo_id) return null;

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      {typeof broadstreet_id === "number" && (
        <Badge variant="secondary" aria-label="Broadstreet ID">
          BS #{broadstreet_id}
        </Badge>
      )}
      {typeof mongo_id === "string" && mongo_id && (
        <Badge variant="outline" aria-label="Mongo ID">
          DB {mongo_id.length > 8 ? `…${mongo_id.slice(-8)}` : mongo_id}
        </Badge>
      )}
    </div>
  );
}

export default EntityIdBadge;


