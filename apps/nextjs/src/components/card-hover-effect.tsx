"use client";

import React from "react";

import { HoverEffect } from "@saasfly/ui/card-hover-effect";

export const projects = [
  {
    title: "Automated Brackets",
    description:
      "Single and double elimination tournament engines that handle seeding, byes, and live match progressions.",
    link: "/tournaments",
  },
  {
    title: "QR Check-in & Passes",
    description:
      "Rapid camera scanning and digital wallet-ready attendee check-in passes for school and campus LANs.",
    link: "/events",
  },
  {
    title: "Multi-Tenant Workspaces",
    description:
      "Delegate organizer staff, referee roles, and manage permissions across esports clubs and student organizations.",
    link: "/dashboard",
  },
];
export function HoverEffects() {
  return <HoverEffect items={projects} />;
}
