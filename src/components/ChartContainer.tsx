import React from 'react';
import { ChartContainerProps } from '../lib/types';

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">{title}</h2>
      <div className="h-[300px]">
        {children}
      </div>
    </div>
  );
};

export default ChartContainer;