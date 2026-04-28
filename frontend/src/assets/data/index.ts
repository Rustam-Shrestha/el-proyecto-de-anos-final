// @ts-nocheck
import { checkPermission } from "../../helper";

const navItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    hasDropdown: true,
    isDisable: false,
    dropdownItems: [
      { label: "User Management", path: "/dashboard/user-management" },
      { label: "Templates", path: "/dashboard/templates" },
      { label: "Utilities", path: "/dashboard/utilities" },
    ],
  },
  { label: "TODO", path: "/todo", hasDropdown: false, isDisable: false },
  { label: "CRM", path: "/crm", hasDropdown: false, isDisable: false },
  {
    label: "Client",
    path: "/clients",
    hasDropdown: true,
    isDisable: false,
    dropdownItems: [
      { label: "Client Service Info", path: "/clients/service-info" },
      { label: "Training", path: "/clients/training" },
    ],
  },
  {
    label: "Employee",
    path: "/Employee",
    hasDropdown: true,
    isDisable: false,
    dropdownItems: [
      { label: "Employee", path: "/employee" },
      { label: "Training", path: "/employee/training" },
    ],
  },
  {
    label: "Inventory",
    path: "/inventory",
    hasDropdown: false,
    isDisable: false,
  },
  { label: "Account", path: "/account", hasDropdown: false, isDisable: false },
  {
    label: "O/C Check",
    path: "/oc-check",
    hasDropdown: false,
    isDisable: false,
  },
];

// utils/navItems.js

const getNavItems = (permissions, isSuperUser) => {
  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      hasDropdown: true,
      hasDesktopDropdown: true, // Show dropdown on desktop
      isDisable: !checkPermission(
        permissions,
        ["Templates", "Utilities", "User_Management"],
        null,
        "get",
        isSuperUser
      ),

      dropdownItems: [
        {
          label: "User Management",
          path: "/dashboard/user-management",
          // isDisable: !checkPermission(
          //   permissions,
          //   "Utilities",
          //   "User_Management",
          //   "get"
          // ),
        },
        {
          label: "Templates",
          path: "/dashboard/templates",
          // isDisable: !checkPermission(
          //   permissions,
          //   "Utilities",
          //   "Templates",
          //   "get"
          // ),
        },
        {
          label: "Utilities",
          path: "/dashboard/utilities",
          // isDisable: !checkPermission(
          //   permissions,
          //   "User_Management",
          //   "Utilities",
          //   "get"
          // ),
        },
      ],
      // Hide dropdown if all items are disabled
    },
    {
      label: "To-Do",
      path: "/todo",
      hasDropdown: true,
      hasDesktopDropdown: false, 
      isDisable: !checkPermission(
        permissions,
        "TODO",
        null,
        "get",
        isSuperUser
      ),
      dropdownItems: [
        { label: "Task", path: "/todo/tasks" },
        { label: "Meeting", path: "/todo/meeting" },
        { label: "Issue", path: "/todo/issue" },
        { label: "Notes", path: "/todo/notes" },
        { label: "Target", path: "/todo/target" },
        { label: "Planner", path: "/todo/planner" },
        { label: "Common Log", path: "/todo/common-log" },
      ],
    },
    {
      label: "CRM",
      path: "/crm",
      hasDropdown: true,
      hasDesktopDropdown: false, // No dropdown on desktop, only mobile
      isDisable: !checkPermission(permissions, "CRM", null, "get", isSuperUser),
      dropdownItems: [
        { label: "Leads", path: "/crm/leads" },
        { label: "Prospect", path: "/crm/propsect" },
        { label: "Comm Log", path: "/crm/common-log" },
        { label: "Appointment", path: "/crm/appointment" },
        { label: "Bid Planner", path: "/crm/bid-planner" },
        { label: "Tender", path: "/crm/tender" },
        { label: "Mobilization", path: "/crm/mobilization" },
        { label: "Company Structure", path: "/crm/company-structure" },
      ],
    },
    {
      label: "Clients",
      path: "/clients",
      hasDropdown: true,
      hasDesktopDropdown: false, // No dropdown on desktop, only mobile
      isDisable: !checkPermission(
        permissions,
        "Client",
        null,
        "get",
        isSuperUser
      ),
      dropdownItems: [
        { label: "Active", path: "/clients/active-client" },
        { label: "New", path: "/clients/new" },
        { label: "Deactive", path: "/clients/deactive" },
        { label: "Periodic", path: "/clients/periodic" },
        { label: "Abs/Cov", path: "/clients/abs-cov" },
        { label: "Vacancy", path: "/clients/vacancy" },
        { label: "Variation", path: "/clients/variation" },
        { label: "Mobilization", path: "/clients/mobilization" },
        { label: "Inventory", path: "/clients/inventory" },
        { label: "Common Log", path: "/clients/common-log" },
        { label: "Feedback", path: "/clients/feedback" },
      ],
    },
    {
      label: "Employee",
      path: "/employee",
      hasDropdown: true,
      hasDesktopDropdown: true, // Show dropdown on desktop
      isDisable: !checkPermission(
        permissions,
        "Employee",
        null,
        "get",
        isSuperUser
      ),
      dropdownItems: [
        { label: "Active", path: "/employee/active" },
        { label: "New", path: "/employee/new" },
        { label: "Deactive", path: "/employee/deactive" },
        { label: "Training", path: "/employee/training" },
      ],
    },
    {
      label: "Inventory",
      path: "/inventory",
      hasDropdown: true,
      hasDesktopDropdown: false, // No dropdown on desktop, only mobile
      isDisable: !checkPermission(
        permissions,
        "Inventory",
        null,
        "get",
        isSuperUser
      ),
      dropdownItems: [
        { label: "Category", path: "/inventory/category" },
        { label: "Vendors", path: "/inventory/vendors" },
        { label: "Items", path: "/inventory/items" },
        { label: "Clients", path: "/inventory/clients" },
        { label: "Clients Groups", path: "/inventory/clients-groups" },
        { label: "COSHH", path: "/inventory/coshh" },
      ],
    },
    {
      label: "Account",
      path: "/account",
      hasDropdown: false,
      isDisable: !checkPermission(
        permissions,
        "Account",
        null,
        "get",
        isSuperUser
      ),
    },
    {
      label: "O/C Check",
      path: "/oc-check",
      hasDropdown: true,
      hasDesktopDropdown: false, // No dropdown on desktop, only mobile
      isDisable: !checkPermission(permissions, "O/C", null, "get", isSuperUser),
      dropdownItems: [
        { label: "Global", path: "/oc-check/global" },
        { label: "Employee", path: "/oc-check/employee" },
        { label: "Position", path: "/oc-check/position" },
      ],
    },
  ];

  return navItems.filter(
    (item) =>
      !item.isDisable && (!item.hasDropdown || item.dropdownItems.length > 0)
  );
};

export { getNavItems, navItems };
