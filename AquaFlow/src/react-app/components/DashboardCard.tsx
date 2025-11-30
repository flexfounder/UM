import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  onClick?: () => void;
  disabled?: boolean;
}

export default function DashboardCard({
  title,
  description,
  icon: Icon,
  color,
  onClick,
  disabled = false,
}: DashboardCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group relative bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-100"
    >
      <div className="flex flex-col h-full">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-md group-hover:shadow-lg transition-shadow`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
    </button>
  );
}
