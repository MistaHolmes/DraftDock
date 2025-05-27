import React from "react";
import { useNavigate } from "react-router-dom";
import { Ship, Plus, Bell } from "lucide-react";
import { SignedIn, UserButton } from "@clerk/clerk-react";

interface ButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "ghost";
  size?: "default" | "icon";
  onClick?: () => void;
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

const Header2 = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-10 border-b bg-gray-50 p-4 md:px-6 flex items-center justify-between">
      {/* Left: Logo */}
      <div className="flex items-center gap-2 max-w-md flex-shrink-0">
        <Button
          variant="ghost"
          onClick={() => navigate("/landing")}
          className="flex items-center gap-2 px-2 pl-1 text-lg font-bold bg-transparent text-black hover:bg-transparent hover:text-black focus:text-black active:text-black"
        >
          <Ship className="h-6 w-6 text-gray-800" />
          DraftDock
        </Button>
      </div>

      {/* Right: Buttons & User */}
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        <Button
          className="gap-2 text-xs md:text-sm"
          onClick={() => navigate("/create-blog")}
        >
          <span className="hidden sm:inline">Create</span>
          <Plus className="h-3 w-3 md:h-4 md:w-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
};

export default Header2;
