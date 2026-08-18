import { Inbox } from "lucide-react";

function EmptyState({ title, description }) {
  return (
    <div className="empty-state">
      <Inbox size={26} />
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  );
}

export default EmptyState;
