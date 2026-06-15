interface KYCWizardStepsProps {
  currentStep: number;
  steps: string[];
}

export const KYCWizardSteps = ({ currentStep, steps }: KYCWizardStepsProps) => {
  return (
    <div className="flex items-center gap-0">
      {steps.map((label, index) => {
        const stepNum = index + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div key={index} className="flex items-center">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isActive
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  stepNum
                )}
              </span>
              <span
                className={`hidden text-sm font-medium sm:inline ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : isCompleted
                    ? "text-green-600 dark:text-green-400"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <div
                className={`mx-3 h-0.5 w-8 sm:w-12 ${
                  isCompleted ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

KYCWizardSteps.displayName = "KYCWizardSteps";

export default KYCWizardSteps;
