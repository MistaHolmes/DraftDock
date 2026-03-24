import React from "react";
import { useNavigate } from "react-router-dom";
import { Ship, Search, Plus, ArrowRight } from "lucide-react";
import { Notifications } from "../Notifications";
import { ProfileButton } from "./profilebutton";


interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "ghost";
  size?: "default" | "icon";
  onClick?: () => void;
}

interface InputProps {
  type: string;
  placeholder: string;
  value?: string;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = "default", size = "default", onClick }) => {
  const baseClass = "inline-flex items-center justify-center rounded-md font-medium transition-colors";
  const variantClasses = {
    default: "bg-black text-white hover:bg-black/70",
    ghost: "bg-transparent hover:bg-gray-100",
  };
  const sizeClasses = {
    default: "h-9 px-4 py-2",
    icon: "h-9 w-9",
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ""}`}
    >
      {children}
    </button>
  );
};

const Input: React.FC<InputProps> = ({ type, placeholder, className, value, onChange }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className={`flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors ${className || ""}`}
      value={value}
      onChange={onChange}
    />
  );
};

const Header: React.FC<HeaderProps> = ({ searchTerm, setSearchTerm }) => {
  const navigate = useNavigate(); 

  return (
    <header className="sticky top-0 z-10 border-b bg-gray-50 p-4 md:px-6 flex items-center justify-between">
      {/* Left: Logo */}
      <div className="flex items-center gap-2 max-w-md flex-shrink-0">
        <Button
          variant="ghost"
          onClick={() => navigate("/landing")}
          className="flex items-center gap-2 px-2 pl-1 text-[20px] font-semibold bg-transparent text-black hover:bg-transparent hover:text-black focus:text-black active:text-black font-serif tracking-tight"
        >
          <Ship className="h-6 w-6 text-black" />
          DraftDock
        </Button>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-lg mx-4 relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 pointer-events-none" />
        <Input
          type="search"
          placeholder="Search titles..."
          className="pl-9 w-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Right: Buttons & User */}
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        <div className="flex justify-end items-center mr-2">
          <Notifications />
        </div>
        <ProfileButton variant="expandIcon" Icon={() => <Plus className="h-3 w-3 md:h-4 md:w-4" />} iconPlacement="right"
        onClick={() => navigate("/create-blog")}>
          Create
        </ProfileButton>
        <ProfileButton variant="expandIcon" Icon={() => <ArrowRight className="h-4 w-4" />} iconPlacement="right"
        onClick={() => navigate("/profile")}>
          Profile
        </ProfileButton>
      </div>
    </header>
  );
};

export default Header;
