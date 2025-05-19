import React from 'react';
import { StatCardProps } from '../lib/types';

const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        {icon && <div>{icon}</div>}
      </div>
    </div>
  );
};

export default StatCard;