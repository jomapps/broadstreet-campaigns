"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";

type Props = {
  broadstreet_id?: number;
  mongo_id?: string;
  className?: string;
};

export function EntityIdBadge(props: Props) {
  const {
    broadstreet_id,
    mongo_id,
    className,
  } = props;

  const bs = broadstreet_id;
  const local = mongo_id;

  if (!bs && !local) return null;

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      {typeof bs === "number" && (
        <Badge variant="secondary" aria-label="Broadstreet ID">
          BS #{bs}
        </Badge>
      )}
      {typeof local === "string" && local && (
        <Badge variant="outline" aria-label="Mongo ID">
          DB {local.length > 8 ? `…${local.slice(-8)}` : local}
        </Badge>
      )}
    </div>
  );
}

export default EntityIdBadge;


