import { Button } from "./Button";

type Props = { message: string; onRetry?: () => void };

export default function ErrorState({ message, onRetry }: Props) {
  return (
    <div className="rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] px-6 py-6 text-center">
      <p className="text-sm font-medium text-[#991B1B]">{message}</p>
      {onRetry ? <Button variant="danger" size="sm" className="mt-3" onClick={onRetry}>Retry</Button> : null}
    </div>
  );
}
