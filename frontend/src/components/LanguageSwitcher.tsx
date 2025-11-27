import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageIcon } from '@heroicons/react/24/outline';

const LanguageSwitcher: React.FC = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center space-x-2 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors duration-200 shadow-sm"
      title={language === 'zh' ? 'Switch to English' : '切换到中文'}
    >
      <LanguageIcon className="w-5 h-5 text-gray-600" />
      <span className="text-sm font-medium text-gray-700">
        {language === 'zh' ? 'EN' : '中文'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
