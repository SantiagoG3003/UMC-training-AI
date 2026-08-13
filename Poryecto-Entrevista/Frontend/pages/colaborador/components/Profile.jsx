import { ChevronDown } from "lucide-react";

function Profile({ profile }) {
  const initials = profile?.initials || "--";
  return (
    <div className="evaluation-profile">
      <span>{initials}</span>
      <div>
        <b>{profile?.name || "Colaborador"}</b>
        <small>{profile?.position || "Colaborador"}</small>
      </div>
      <ChevronDown size={16} />
    </div>
  );
}

export default Profile;
