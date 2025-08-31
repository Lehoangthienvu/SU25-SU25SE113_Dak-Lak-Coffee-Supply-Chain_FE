// ===== menuConfig.ts =====

import {
  FiPieChart,
  FiUsers,
  FiFileText,
  FiSettings,
  FiBarChart2,
  FiMessageCircle,
  FiBookOpen,
  FiClipboard,
  FiFeather,
} from "react-icons/fi";
import { JSX } from "react";
import { useTranslation } from 'react-i18next';

const iconMap = {
  dashboard: <FiPieChart />,
  users: <FiUsers />,
  contracts: <FiFileText />,
  reports: <FiBarChart2 />,
  settings: <FiSettings />,
  feedback: <FiMessageCircle />,
  articles: <FiBookOpen />,
  consultation: <FiFeather />,
  crops: <FiClipboard />,
};

export type MenuItem =
  | {
    type: "link";
    title: string;
    href: string;
    icon: JSX.Element;
  }
  | {
    type: "group";
    title: string;
    icon: JSX.Element;
    children: MenuItem[];
  };

export const useMenuConfig = () => {
  const { t } = useTranslation();

  const navigationItems: Record<string, MenuItem[]> = {
    farmer: [
      {
        type: "link",
        title: t('sidebar.navigation.farmer.dashboard'),
        href: "/dashboard/farmer",
        icon: iconMap.dashboard,
      },
      {
        type: "group",
        title: t('sidebar.navigation.farmer.cropSeasons'),
        icon: iconMap.crops,
        children: [
          {
            type: "link",
            title: t('sidebar.navigation.farmer.cropSeasons'),
            href: "/dashboard/farmer/crop-seasons",
            icon: iconMap.crops,
          },
          {
            type: "link",
            title: t('sidebar.navigation.farmer.cropStages'),
            href: "/dashboard/farmer/crop-stages",
            icon: iconMap.crops,
          },
          {
            type: "link",
            title: t('sidebar.navigation.farmer.cropProgress'),
            href: "/dashboard/farmer/crop-progress",
            icon: iconMap.crops,
          },
        ],
      },
      {
        type: "link",
        title: t('sidebar.navigation.farmer.consultation'),
        href: "/dashboard/farmer/request-feedback",
        icon: iconMap.feedback,
      },
      {
        type: "link",
        title: t('sidebar.navigation.farmer.warehouseRequest'),
        href: "/dashboard/farmer/warehouse-request",
        icon: iconMap.crops,
      },
    ],

    admin: [
      {
        type: "link",
        title: t('sidebar.dashboard'),
        href: "/dashboard/admin",
        icon: iconMap.dashboard,
      },
      {
        type: "link",
        title: t('sidebar.users'),
        href: "/dashboard/admin/users",
        icon: iconMap.users,
      },
      {
        type: "link",
        title: t('sidebar.contracts'),
        href: "/dashboard/admin/contracts",
        icon: iconMap.contracts,
      },
      {
        type: "link",
        title: t('sidebar.reports'),
        href: "/dashboard/admin/reports",
        icon: iconMap.reports,
      },
      {
        type: "link",
        title: t('sidebar.settings'),
        href: "/dashboard/admin/settings",
        icon: iconMap.settings,
      },
    ],

    expert: [
      {
        type: "link",
        title: t('sidebar.dashboard'),
        href: "/dashboard/expert",
        icon: iconMap.dashboard,
      },
      {
        type: "link",
        title: t('sidebar.consultation'),
        href: "/dashboard/expert/consultations",
        icon: iconMap.consultation,
      },
      {
        type: "link",
        title: t('sidebar.articles'),
        href: "/dashboard/expert/articles",
        icon: iconMap.articles,
      },
    ],

    staff: [
      {
        type: "link",
        title: t('sidebar.inboundRequests'),
        href: "/dashboard/staff/inbounds",
        icon: iconMap.crops,
      },
      {
        type: "link",
        title: t('sidebar.inboundReceipts'),
        href: "/dashboard/staff/receipts",
        icon: iconMap.contracts,
      },
      {
        type: "link",
        title: t('sidebar.inventories'),
        href: "/dashboard/staff/inventories",
        icon: iconMap.dashboard,
      },
      {
        type: "link",
        title: t('sidebar.batches'),
        href: "/dashboard/staff/batches",
        icon: iconMap.articles,
      },
      {
        type: "link",
        title: t('sidebar.warehouses'),
        href: "/dashboard/staff/warehouses",
        icon: iconMap.settings,
      },
    ],

    manager: [
      {
        type: "link",
        title: t('sidebar.dashboard'),
        href: "/dashboard/manager",
        icon: iconMap.dashboard,
      },
      {
        type: "link",
        title: t('sidebar.contracts'),
        href: "/dashboard/manager/contracts",
        icon: iconMap.contracts,
      },
      {
        type: "link",
        title: t('sidebar.procurementPlans'),
        href: "/dashboard/manager/procurement-plans",
        icon: iconMap.crops,
      },
      {
        type: "link",
        title: t('sidebar.commitments'),
        href: "/dashboard/manager/farming-commitments",
        icon: iconMap.contracts,
      },
      {
        type: "link",
        title: t('sidebar.farmer'),
        href: "/dashboard/manager/farmers",
        icon: iconMap.users,
      },
      {
        type: "link",
        title: t('sidebar.batches'),
        href: "/dashboard/manager/processing/batches",
        icon: iconMap.articles,
      },
      {
        type: "link",
        title: t('sidebar.reports'),
        href: "/dashboard/manager/reports",
        icon: iconMap.reports,
      },
    ],
  };

  return navigationItems;
};
