export const ANALYTICS_ANCHOR_DATE = "2026-09-14T00:00:00.000Z";
export const ANALYTICS_DATASET_VERSION = "ticket-ops-slice-1";

export type TicketSystem =
  | "VDI"
  | "Groupware"
  | "Provisioning"
  | "Collaboration"
  | "Device Lifecycle"
  | "Printing";

export type TicketCategory =
  | "Authentication"
  | "Access"
  | "Provisioning"
  | "Application Support"
  | "Device Support"
  | "Print Service";

export type SupportTicket = {
  ticket_id: string;
  created_at: string;
  system: TicketSystem;
  category: TicketCategory;
  department: string;
  password_reset_related: boolean;
  is_repeat_contact: boolean;
  ai_assisted: boolean;
  provisioning_delay: boolean;
  synthetic: true;
};

type Bucket = {
  system: TicketSystem;
  category: TicketCategory;
  count: number;
  passwordReset?: number;
  repeats?: number;
  aiAssisted?: number;
  provisioningDelay?: number;
};

const departments = [
  "Engineering",
  "Manufacturing",
  "Quality",
  "Finance",
  "HR",
  "Procurement",
  "IT",
];
const currentBuckets: Bucket[] = [
  {
    system: "VDI",
    category: "Authentication",
    count: 87,
    passwordReset: 39,
    repeats: 21,
    aiAssisted: 47,
  },
  {
    system: "Groupware",
    category: "Access",
    count: 58,
    repeats: 12,
    aiAssisted: 28,
  },
  {
    system: "Provisioning",
    category: "Provisioning",
    count: 43,
    repeats: 7,
    aiAssisted: 18,
    provisioningDelay: 24,
  },
  {
    system: "Collaboration",
    category: "Application Support",
    count: 38,
    repeats: 5,
    aiAssisted: 17,
  },
  {
    system: "Device Lifecycle",
    category: "Device Support",
    count: 34,
    repeats: 4,
    aiAssisted: 13,
  },
  {
    system: "Printing",
    category: "Print Service",
    count: 24,
    repeats: 2,
    aiAssisted: 8,
  },
];
const previousBuckets: Bucket[] = [
  {
    system: "VDI",
    category: "Authentication",
    count: 68,
    passwordReset: 26,
    repeats: 16,
    aiAssisted: 0,
  },
  {
    system: "Groupware",
    category: "Access",
    count: 66,
    repeats: 12,
    aiAssisted: 0,
  },
  {
    system: "Provisioning",
    category: "Provisioning",
    count: 37,
    repeats: 6,
    aiAssisted: 0,
    provisioningDelay: 22,
  },
  {
    system: "Collaboration",
    category: "Application Support",
    count: 32,
    repeats: 4,
    aiAssisted: 0,
  },
  {
    system: "Device Lifecycle",
    category: "Device Support",
    count: 27,
    repeats: 3,
    aiAssisted: 0,
  },
  {
    system: "Printing",
    category: "Print Service",
    count: 20,
    repeats: 2,
    aiAssisted: 0,
  },
];

function dateInWindow(start: string, index: number) {
  const date = new Date(start);
  date.setUTCDate(date.getUTCDate() + (index % 30));
  date.setUTCHours(8 + (index % 9), (index * 13) % 60, 0, 0);
  return date.toISOString();
}

function buildWindow(prefix: string, start: string, buckets: Bucket[]) {
  let ticketNumber = 1;
  return buckets.flatMap((bucket) =>
    Array.from({ length: bucket.count }, (_, index): SupportTicket => ({
      ticket_id: `${prefix}-${String(ticketNumber++).padStart(3, "0")}`,
      created_at: dateInWindow(start, index),
      system: bucket.system,
      category: bucket.category,
      department: departments[(ticketNumber + index) % departments.length],
      password_reset_related: index < (bucket.passwordReset ?? 0),
      is_repeat_contact: index < (bucket.repeats ?? 0),
      ai_assisted: index < (bucket.aiAssisted ?? 0),
      provisioning_delay: index < (bucket.provisioningDelay ?? 0),
      synthetic: true,
    })),
  );
}

// Canonical local source for seed scripts and offline tests. Runtime analytics
// reads the equivalent synthetic rows from Supabase through database.ts.
export const syntheticSupportTickets: SupportTicket[] = [
  ...buildWindow("SYN-CUR", "2026-08-15T00:00:00.000Z", currentBuckets),
  ...buildWindow("SYN-PRV", "2026-07-16T00:00:00.000Z", previousBuckets),
];

export const ANALYTICS_WINDOWS = {
  current: {
    label: "Aug 15 – Sep 13, 2026",
    start: "2026-08-15T00:00:00.000Z",
    end: ANALYTICS_ANCHOR_DATE,
  },
  previous: {
    label: "Jul 16 – Aug 14, 2026",
    start: "2026-07-16T00:00:00.000Z",
    end: "2026-08-15T00:00:00.000Z",
  },
} as const;

function inWindow(
  ticket: SupportTicket,
  window: { start: string; end: string },
) {
  return ticket.created_at >= window.start && ticket.created_at < window.end;
}

function count(
  tickets: SupportTicket[],
  predicate: (ticket: SupportTicket) => boolean,
) {
  return tickets.filter(predicate).length;
}

function percentage(numerator: number, denominator: number) {
  return denominator === 0
    ? null
    : Math.round((numerator / denominator) * 1000) / 10;
}

function change(current: number, previous: number) {
  return previous === 0
    ? null
    : Math.round(((current - previous) / previous) * 1000) / 10;
}

function dailyCohortVolume(tickets: SupportTicket[]) {
  const currentDays = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(ANALYTICS_WINDOWS.current.start);
    date.setUTCDate(date.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });

  return currentDays.map((date) => {
    const dailyTickets = tickets.filter((ticket) => ticket.created_at.startsWith(date));
    return {
      date,
      label: date.slice(5).replace("-", "/"),
      vdiAuthentication: count(
        dailyTickets,
        (ticket) => ticket.system === "VDI" && ticket.category === "Authentication",
      ),
      groupwareAccess: count(
        dailyTickets,
        (ticket) => ticket.system === "Groupware" && ticket.category === "Access",
      ),
    };
  });
}

export function calculateTicketAnalytics(tickets: SupportTicket[]) {
  const current = tickets.filter((ticket) =>
    inWindow(ticket, ANALYTICS_WINDOWS.current),
  );
  const previous = tickets.filter((ticket) =>
    inWindow(ticket, ANALYTICS_WINDOWS.previous),
  );
  const vdi = current.filter(
    (ticket) => ticket.system === "VDI" && ticket.category === "Authentication",
  );
  const previousVdi = previous.filter(
    (ticket) => ticket.system === "VDI" && ticket.category === "Authentication",
  );
  const currentProvisioningDelays = count(
    current,
    (ticket) => ticket.provisioning_delay,
  );
  const previousProvisioningDelays = count(
    previous,
    (ticket) => ticket.provisioning_delay,
  );
  const currentGroupwareAccess = count(
    current,
    (ticket) => ticket.system === "Groupware" && ticket.category === "Access",
  );
  const previousGroupwareAccess = count(
    previous,
    (ticket) => ticket.system === "Groupware" && ticket.category === "Access",
  );
  const grouped = Object.entries(
    current.reduce<Record<string, number>>((totals, ticket) => {
      const key = `${ticket.system} / ${ticket.category}`;
      totals[key] = (totals[key] ?? 0) + 1;
      return totals;
    }, {}),
  )
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value);

  return {
    synthetic: true as const,
    datasetVersion: ANALYTICS_DATASET_VERSION,
    measurement: {
      current: ANALYTICS_WINDOWS.current,
      previous: ANALYTICS_WINDOWS.previous,
      anchor: ANALYTICS_ANCHOR_DATE,
    },
    supportRequests: current.length,
    previousSupportRequests: previous.length,
    aiAssisted: {
      count: count(current, (ticket) => ticket.ai_assisted),
      rate: percentage(
        count(current, (ticket) => ticket.ai_assisted),
        current.length,
      ),
    },
    repeatContact: {
      count: count(current, (ticket) => ticket.is_repeat_contact),
      rate: percentage(
        count(current, (ticket) => ticket.is_repeat_contact),
        current.length,
      ),
    },
    vdiAuthentication: {
      current: vdi.length,
      previous: previousVdi.length,
      change: change(vdi.length, previousVdi.length),
    },
    passwordResetRelated: {
      current: count(vdi, (ticket) => ticket.password_reset_related),
      previous: count(previousVdi, (ticket) => ticket.password_reset_related),
    },
    vdiRepeatContactRate: percentage(
      count(vdi, (ticket) => ticket.is_repeat_contact),
      vdi.length,
    ),
    provisioningDelay: {
      current: currentProvisioningDelays,
      previous: previousProvisioningDelays,
      change: change(currentProvisioningDelays, previousProvisioningDelays),
    },
    groupwareAccess: {
      current: currentGroupwareAccess,
      previous: previousGroupwareAccess,
      change: change(currentGroupwareAccess, previousGroupwareAccess),
    },
    dailySupportVolume: dailyCohortVolume(current),
    categoryVolume: grouped,
    operationalImprovement: {
      title: "Password reset → VDI reconnect procedure",
      observation:
        "Password-reset-related VDI authentication requests account for a material share of the VDI authentication cohort.",
      recommendation: [
        "Update password-reset communication",
        "Improve the VDI FAQ",
        "Add reconnect instructions",
        "Monitor the same cohort for 30 days",
      ],
      target: {
        metric: "Repeat VDI authentication inquiries",
        relativeReduction: 30,
        direction: "reduce" as const,
      },
      targetStatus: "proposed_not_measured" as const,
    },
  };
}
