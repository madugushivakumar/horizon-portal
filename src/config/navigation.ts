/**
 * Horizon Portal — Central Role-Aware Navigation Configuration
 * src/config/navigation.ts
 *
 * Defines menu items, categories, permitted roles, and route authorization rules
 * for all 4 application roles: Admin, HR, Manager, Employee.
 */

export type Role = "Admin" | "HR" | "Manager" | "Employee";

export interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: string; // Identifier for SVG icon rendering
  roles: Role[]; // Permitted roles
  badge?: string;
  description?: string;
}

export interface NavSection {
  heading?: string;
  items: NavItem[];
}

/**
 * Canonical navigation item registry.
 * Each item specifies which roles are authorized to see and access it.
 */
export const NAVIGATION_REGISTRY: NavItem[] = [
  // ── Core / Common ──────────────────────────────────────────────
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/dashboard",
    icon: "dashboard",
    roles: ["Admin", "HR", "Manager", "Employee"],
    description: "Overview metrics, notifications, and quick actions",
  },
  {
    id: "employees",
    title: "Directory",
    href: "/employees",
    icon: "users",
    roles: ["Admin", "HR", "Manager", "Employee"],
    description: "Workforce member directory and organizational structure",
  },
  {
    id: "people",
    title: "People Directory",
    href: "/people",
    icon: "users",
    roles: ["Admin", "HR", "Manager", "Employee"],
    description: "Workforce member directory and profile viewer",
  },

  // ── Employee Specific ──────────────────────────────────────────
  {
    id: "leave-my",
    title: "My Leave",
    href: "/leave",
    icon: "calendar",
    roles: ["Employee"],
    description: "Personal leave balances and time-off requests",
  },
  {
    id: "payslips-my",
    title: "My Payslips",
    href: "/payslips",
    icon: "document",
    roles: ["Employee"],
    description: "Historical compensation statements and tax summaries",
  },

  // ── Manager Specific ───────────────────────────────────────────
  {
    id: "approvals",
    title: "Team Approvals",
    href: "/approvals",
    icon: "clipboard-check",
    roles: ["Manager", "Admin"],
    badge: "Pending",
    description: "Approve team leave, expenses, and schedule modifications",
  },
  {
    id: "team-overview",
    title: "Team Performance",
    href: "/team",
    icon: "chart-bar",
    roles: ["Manager", "Admin"],
    description: "Direct reports performance reviews and headcount",
  },

  // ── HR Specific ────────────────────────────────────────────────
  {
    id: "leave-mgmt",
    title: "Leave Operations",
    href: "/leave-management",
    icon: "calendar-days",
    roles: ["HR", "Admin"],
    description: "Company-wide leave balances, quotas, and holiday calendar",
  },
  {
    id: "payroll-ops",
    title: "Payroll Operations",
    href: "/payroll",
    icon: "currency-dollar",
    roles: ["HR", "Admin"],
    description: "Payroll run executions, payslip generation, and deductions",
  },
  {
    id: "recruitment",
    title: "Recruitment & Onboarding",
    href: "/recruitment",
    icon: "user-plus",
    roles: ["HR", "Admin"],
    description: "Applicant pipelines, hiring workflows, and offers",
  },
  {
    id: "admin-employees",
    title: "Employee Console",
    href: "/admin/employees",
    icon: "users",
    roles: ["HR", "Admin"],
    description: "Workforce administration, employee profiles, and lifecycle operations",
  },

  // ── Admin Specific ─────────────────────────────────────────────
  {
    id: "admin-users",
    title: "User Management",
    href: "/admin/users",
    icon: "shield-check",
    roles: ["Admin"],
    description: "Manage portal users, credentials, and role assignments",
  },
  {
    id: "admin-settings",
    title: "System Settings",
    href: "/admin/settings",
    icon: "cog",
    roles: ["Admin"],
    description: "Global configurations, security policies, and integrations",
  },
  {
    id: "admin-audit",
    title: "Audit Logs",
    href: "/admin/audit",
    icon: "archive-box",
    roles: ["Admin"],
    description: "Security events, access logs, and compliance records",
  },
];

/**
 * Returns grouped navigation sections structured specifically for the given user role.
 */
export function getNavigationForRole(userRole: string | undefined): NavSection[] {
  const role = (userRole || "Employee") as Role;

  // Filter registry to items allowed for this role
  const allowed = NAVIGATION_REGISTRY.filter((item) => item.roles.includes(role));

  const sections: NavSection[] = [];

  // 1. General Section (Dashboard & Directory)
  const coreItems = allowed.filter((item) => ["dashboard", "employees"].includes(item.id));
  if (coreItems.length > 0) {
    sections.push({
      heading: "Overview",
      items: coreItems,
    });
  }

  // 2. Role-specific section
  if (role === "Employee") {
    const employeeItems = allowed.filter((item) => ["leave-my", "payslips-my"].includes(item.id));
    if (employeeItems.length > 0) {
      sections.push({
        heading: "Self Service",
        items: employeeItems,
      });
    }
  } else if (role === "Manager") {
    const managerItems = allowed.filter((item) => ["approvals", "team-overview"].includes(item.id));
    if (managerItems.length > 0) {
      sections.push({
        heading: "Management",
        items: managerItems,
      });
    }
  } else if (role === "HR") {
    const hrItems = allowed.filter((item) =>
      ["leave-mgmt", "payroll-ops", "recruitment", "admin-employees"].includes(item.id)
    );
    if (hrItems.length > 0) {
      sections.push({
        heading: "People Operations",
        items: hrItems,
      });
    }
  } else if (role === "Admin") {
    const managementItems = allowed.filter((item) =>
      ["approvals", "team-overview", "leave-mgmt", "payroll-ops", "recruitment", "admin-employees"].includes(item.id)
    );
    if (managementItems.length > 0) {
      sections.push({
        heading: "Workforce & Operations",
        items: managementItems,
      });
    }

    const adminItems = allowed.filter((item) =>
      ["admin-users", "admin-settings", "admin-audit"].includes(item.id)
    );
    if (adminItems.length > 0) {
      sections.push({
        heading: "Administration",
        items: adminItems,
      });
    }
  }

  return sections;
}

/**
 * Checks whether a given path is authorized for a specific role.
 * Used for server-side authorization enforcement.
 */
export function isRouteAllowedForRole(pathname: string, userRole: string | undefined): boolean {
  const role = (userRole || "Employee") as Role;

  // Exact or prefix matching
  const matchingItem = NAVIGATION_REGISTRY.find(
    (item) => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"))
  );

  // If route is in registry, enforce role check
  if (matchingItem) {
    return matchingItem.roles.includes(role);
  }

  // Admin routes protection rule
  if (pathname.startsWith("/admin")) {
    return role === "Admin";
  }

  // Default allowed for other unmapped portal subroutes
  return true;
}
