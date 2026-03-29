import { ChecklistItem } from "../types/flight";

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  // Legal
  {
    id: "registration",
    label: "Operator registration is valid",
    checked: false,
    category: "legal",
  },
  {
    id: "insurance",
    label: "Insurance is active (min. 1M EUR)",
    checked: false,
    category: "legal",
  },
  {
    id: "competency",
    label: "Pilot competency certificate is valid",
    checked: false,
    category: "legal",
  },
  {
    id: "operator_id",
    label: "Operator ID is displayed on drone",
    checked: false,
    category: "legal",
  },

  // Equipment
  {
    id: "battery",
    label: "Battery is fully charged",
    checked: false,
    category: "equipment",
  },
  {
    id: "propellers",
    label: "Propellers are in good condition",
    checked: false,
    category: "equipment",
  },
  {
    id: "firmware",
    label: "Firmware is up to date",
    checked: false,
    category: "equipment",
  },
  {
    id: "sd_card",
    label: "SD card has available space",
    checked: false,
    category: "equipment",
  },

  // Environment
  {
    id: "airspace",
    label: "Airspace is clear (checked SkyCheck zones)",
    checked: false,
    category: "environment",
  },
  {
    id: "weather",
    label: "Weather conditions are suitable",
    checked: false,
    category: "environment",
  },
  {
    id: "wind",
    label: "Wind speed is within limits",
    checked: false,
    category: "environment",
  },
  {
    id: "visibility",
    label: "Visibility is good (VLOS possible)",
    checked: false,
    category: "environment",
  },

  // Safety
  {
    id: "vlos",
    label: "Will maintain Visual Line of Sight",
    checked: false,
    category: "safety",
  },
  {
    id: "max_altitude",
    label: "Will stay below max altitude (120m / 50m near airports)",
    checked: false,
    category: "safety",
  },
  {
    id: "people",
    label: "No uninvolved people in flight area",
    checked: false,
    category: "safety",
  },
  {
    id: "emergency",
    label: "Emergency procedures reviewed",
    checked: false,
    category: "safety",
  },
];

export const CATEGORY_LABELS: Record<string, string> = {
  legal: "Legal Requirements",
  equipment: "Equipment Check",
  environment: "Environment",
  safety: "Safety",
};
