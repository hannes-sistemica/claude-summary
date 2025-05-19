import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Loader2 } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { sortMonthYearKeys } from '../lib/utils';
import ChartContainer from './ChartContainer';
import { ConversationsByMonth, MostActiveConversation } from '../lib/types';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ChartSectionProps {
  conversationsByMonth: ConversationsByMonth;
  mostActiveConversations: MostActiveConversation[];
  isLoading: boolean;
}

const ChartSection: React.FC<ChartSectionProps> = ({
  conversationsByMonth,
  mostActiveConversations,
  isLoading
}) => {
  // Sort months chronologically
  const sortedMonths = sortMonthYearKeys(Object.keys(conversationsByMonth));
  
  const conversationsByMonthData = {
    labels: sortedMonths,
    datasets: [
      {
        label: 'Conversations',
        data: sortedMonths.map(month => conversationsByMonth[month]),
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  const mostActiveConversationsData = {
    labels: mostActiveConversations.map(conv => 
      conv.title.length > 30 ? conv.title.substring(0, 30) + '...' : conv.title
    ),
    datasets: [
      {
        label: 'Messages',
        data: mostActiveConversations.map(conv => conv.messageCount),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  const horizontalBarOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };
  
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartContainer title="Conversations By Month">
        {sortedMonths.length > 0 ? (
          <Bar data={conversationsByMonthData} options={barOptions} height={300} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No data available</p>
          </div>
        )}
      </ChartContainer>
      
      <ChartContainer title="Most Active Conversations">
        {mostActiveConversations.length > 0 ? (
          <Bar data={mostActiveConversationsData} options={horizontalBarOptions} height={300} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No data available</p>
          </div>
        )}
      </ChartContainer>
    </div>
  );
};

export default ChartSection;