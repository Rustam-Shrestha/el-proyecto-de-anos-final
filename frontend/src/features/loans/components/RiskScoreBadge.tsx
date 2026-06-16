import { memo } from "react";
import type { RiskLevel } from "@shared/types/common";

type RiskScoreBadgeProps = {
  score: number | null;
  level: RiskLevel | null;
};

const getRiskConfig = (score: number | null, level: RiskLevel | null) => {
  if (score === null && !level) {
    return {
      label: "Pending Analysis",
      bg: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      dot: "bg-gray-400",
    };
  }

  if (level === "VERY_HIGH" || (score !== null && score > 70)) {
    return {
      label: "High Risk",
      bg: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
      dot: "bg-red-500",
    };
  }

  if (level === "HIGH" || (score !== null && score > 70)) {
    return {
      label: "High Risk",
      bg: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
      dot: "bg-red-500",
    };
  }

  if (level === "MEDIUM" || (score !== null && score >= 40 && score <= 70)) {
    return {
      label: "Medium Risk",
      bg: "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/15 dark:text-yellow-300",
      dot: "bg-yellow-500",
    };
  }

  return {
    label: "Low Risk",
    bg: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
    dot: "bg-green-500",
  };
};

const RiskScoreBadge = ({ score, level }: RiskScoreBadgeProps) => {
  const config = getRiskConfig(score, level);

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.bg}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
      {score !== null ? (
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {score}
        </span>
      ) : null}
    </div>
  );
};

RiskScoreBadge.displayName = "RiskScoreBadge";

export default memo(RiskScoreBadge);
