import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
        Home
      </h1>
      
      <button
        onClick={toggleTheme}
        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
      >
        {theme === 'light' ? (
          <Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        ) : (
          <Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        )}
      </button>
    </header>
  );
};

export default Header;