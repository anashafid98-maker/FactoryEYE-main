import React from "react";
import image from "./assets/Image1.png";
import { Moon, Sun } from "lucide-react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, setIsDarkMode }) => {
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <header className={`w-full px-6 py-3 ${isDarkMode ? 'bg-gray-800' : 'bg-gradient-to-r from-green-700 to-blue-600'} text-white flex justify-between items-center shadow z-50`}>
      {/* Logo */}
      <div className="flex items-center gap-4">
        <img src={image} alt="logo" className="h-10" />
      </div>

      {/* Bouton dark mode */}
      <button
        onClick={toggleDarkMode}
        className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700 text-yellow-300' : 'bg-white text-gray-800'}`}
      >
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </header>
  );
};

export default Header;