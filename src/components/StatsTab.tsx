import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Users, MessageSquare, UserCircle, Bot } from 'lucide-react';
import { db } from '../lib/database';
import { StatsData, ConversationsByMonth, MostActiveConversation } from '../lib/types';
import { groupConversationsByMonth, sortMonthYearKeys } from '../lib/utils';
import StatCard from './StatCard';
import ChartSection from './ChartSection';

const StatsTab: React.FC = () => {
  const [statsData, setStatsData] = useState<StatsData>({
    totalConversations: 0,
    totalMessages: 0,
    humanMessages: 0,
    assistantMessages: 0
  });
  
  const [conversationsByMonth, setConversationsByMonth] = useState<ConversationsByMonth>({});
  const [mostActiveConversations, setMostActiveConversations] = useState<MostActiveConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Get all conversations for stats calculations
  const conversations = useLiveQuery(() => db.conversations.toArray());
  
  // Calculate stats when conversations change
  useEffect(() => {
    if (!conversations) return;
    
    const fetchStats = async () => {
      setIsLoading(true);
      
      try {
        // Get counts
        const totalConversations = await db.conversations.count();
        const totalMessages = await db.messages.count();
        const humanMessages = await db.messages.where('role').equals('human').count();
        const assistantMessages = await db.messages.where('role').equals('assistant').count();
        
        setStatsData({
          totalConversations,
          totalMessages,
          humanMessages,
          assistantMessages
        });
        
        // Group conversations by month
        setConversationsByMonth(groupConversationsByMonth(conversations));
        
        // Get most active conversations
        const conversationCounts = await db.messages
          .orderBy('conversationId')
          .toArray()
          .then(messages => {
            const counts: Record<number, number> = {};
            messages.forEach(message => {
              counts[message.conversationId] = (counts[message.conversationId] || 0) + 1;
            });
            return counts;
          });
        
        // Map conversation IDs to titles
        const mostActive = await Promise.all(
          Object.entries(conversationCounts).map(async ([id, count]) => {
            const conversation = await db.conversations.get(Number(id));
            return {
              id: Number(id),
              title: conversation?.title || 'Unknown',
              messageCount: count
            };
          })
        );
        
        // Sort by message count and get top 10
        setMostActiveConversations(
          mostActive
            .sort((a, b) => b.messageCount - a.messageCount)
            .slice(0, 10)
        );
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error calculating stats:', error);
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, [conversations]);
  
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Usage Statistics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            label="Total Conversations" 
            value={statsData.totalConversations} 
            icon={<Users className="w-6 h-6 text-indigo-400" />}
          />
          <StatCard 
            label="Total Messages" 
            value={statsData.totalMessages} 
            icon={<MessageSquare className="w-6 h-6 text-indigo-400" />}
          />
          <StatCard 
            label="Your Messages" 
            value={statsData.humanMessages} 
            icon={<UserCircle className="w-6 h-6 text-indigo-400" />}
          />
          <StatCard 
            label="Claude's Messages" 
            value={statsData.assistantMessages} 
            icon={<Bot className="w-6 h-6 text-indigo-400" />}
          />
        </div>
      </div>
      
      <ChartSection 
        conversationsByMonth={conversationsByMonth}
        mostActiveConversations={mostActiveConversations}
        isLoading={isLoading}
      />
    </div>
  );
};

export default StatsTab;