import React from 'react';
import { ProgressBarProps } from '../lib/types';

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, message, detailedMessage }) => {
  return (
    <div className="w-full">
      <h3 className="text-lg font-medium text-gray-800 mb-2">{message}</h3>
      
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden mb-2">
        <div 
          className="h-full bg-indigo-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <p className="text-sm text-gray-500">{detailedMessage}</p>
    </div>
  );
};

export default ProgressBar;