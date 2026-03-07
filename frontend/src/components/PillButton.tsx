import React from "react";

interface PillButtonProps {
  /** The label text displayed next to the icon */
  label: string;
  /** A React node rendered as the icon (e.g. an SVG element) */
  icon?: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Whether the button is currently selected / active */
  active?: boolean;
  /** Additional CSS class names */
  className?: string;
}

const PillButton: React.FC<PillButtonProps> = ({
  label,
  icon,
  onClick,
  active = false,
  className = "",
}) => {
  return (
    <button
      className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full border-[1.5px] bg-white text-gray-900 text-[15px] font-medium cursor-pointer select-none whitespace-nowrap transition-all duration-200 ease-in-out hover:bg-gray-100 hover:border-gray-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${active ? "bg-gray-100 border-gray-400" : "border-gray-300"} ${className}`}
      onClick={onClick}
      type="button"
    >
      {icon && (
        <span className="inline-flex items-center justify-center w-5 h-5 shrink-0 text-gray-500 [&>svg]:w-full [&>svg]:h-full">
          {icon}
        </span>
      )}
      <span className="leading-none">{label}</span>
    </button>
  );
};

export default PillButton;
