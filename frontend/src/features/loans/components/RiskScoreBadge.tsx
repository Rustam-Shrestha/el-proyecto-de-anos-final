import { memo } from "react";
import type { RiskLevel } from "@shared/types/common";

type RiskScoreBadgeProps = {
  score: number | null;
  level: RiskLevel | null;
};

const getRiskConfig = (score: number | null, level: RiskLevel | null) => {
  // If explicit risk tier level is provided, it is the single source of truth
  if (level) {
    const normalized = String(level).toUpperCase();
    if (normalized === "LOW") {
      return {
        label: "Low Risk",
        bg: "bg-green-100 text-green-800",
        dot: "bg-green-500",
      };
    }
    if (normalized === "MEDIUM") {
      return {
        label: "Medium Risk",
        bg: "bg-yellow-100 text-yellow-800",
        dot: "bg-yellow-500",
      };
    }
    if (normalized === "HIGH" || normalized === "VERY_HIGH") {
      return {
        label: "High Risk",
        bg: "bg-danger-100 text-red-800",
        dot: "bg-danger-500",
      };
    }
  }

  // If level is not provided, evaluate numeric score
  if (score === null || score === undefined) {
    return {
      label: "Pending Analysis",
      bg: "bg-gray-100 text-gray-700",
      dot: "bg-gray-400",
    };
  }

  // Credit score scale (300 to 850)
  if (score > 100) {
    if (score >= 670) {
      return {
        label: "Low Risk",
        bg: "bg-green-100 text-green-800",
        dot: "bg-green-500",
      };
    }
    if (score >= 580) {
      return {
        label: "Medium Risk",
        bg: "bg-yellow-100 text-yellow-800",
        dot: "bg-yellow-500",
      };
    }
    return {
      label: "High Risk",
      bg: "bg-danger-100 text-red-800",
      dot: "bg-danger-500",
    };
  }

  // Legacy risk percentage score scale (0 to 100)
  if (score > 70) {
    return {
      label: "High Risk",
      bg: "bg-danger-100 text-red-800",
      dot: "bg-danger-500",
    };
  }
  if (score >= 40) {
    return {
      label: "Medium Risk",
      bg: "bg-yellow-100 text-yellow-800",
      dot: "bg-yellow-500",
    };
  }
  return {
    label: "Low Risk",
    bg: "bg-green-100 text-green-800",
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
      {score !== null && score !== undefined ? (
        <span className="text-xs font-medium text-gray-500">
          {score > 100 ? `${score}/850` : score}
        </span>
      ) : null}
    </div>
  );
};

RiskScoreBadge.displayName = "RiskScoreBadge";

export default memo(RiskScoreBadge);
