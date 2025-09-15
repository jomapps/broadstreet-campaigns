"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";

type Props = {
  broadstreet_id?: number;
  mongo_id?: string;
  // Explicit naming support
  broadstreet_network_id?: number;
  broadstreet_advertiser_id?: number;
  broadstreet_campaign_id?: number;
  broadstreet_zone_id?: number;
  broadstreet_advertisement_id?: number;
  local_network_id?: string;
  local_advertiser_id?: string;
  local_campaign_id?: string;
  local_zone_id?: string;
  local_advertisement_id?: string;
  className?: string;
};

export function EntityIdBadge(props: Props) {
  const {
    broadstreet_id,
    mongo_id,
    className,
    broadstreet_network_id,
    broadstreet_advertiser_id,
    broadstreet_campaign_id,
    broadstreet_zone_id,
    broadstreet_advertisement_id,
    local_network_id,
    local_advertiser_id,
    local_campaign_id,
    local_zone_id,
    local_advertisement_id,
  } = props;

  const bs = broadstreet_id ?? broadstreet_network_id ?? broadstreet_advertiser_id ?? broadstreet_campaign_id ?? broadstreet_zone_id ?? broadstreet_advertisement_id;
  const local = mongo_id ?? local_network_id ?? local_advertiser_id ?? local_campaign_id ?? local_zone_id ?? local_advertisement_id;

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


