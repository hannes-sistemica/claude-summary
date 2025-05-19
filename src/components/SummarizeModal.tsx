import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { SummarizeModalProps } from '../lib/types';
import { MODELS } from '../lib/settings';
import { getActiveEndpoint } from '../lib/settings';

const SummarizeModal: React.FC<SummarizeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultPrompt,
  stats,
  isLoading
}) => {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [selectedModel, setSelectedModel] = useState('');
  const activeEndpoint = getActiveEndpoint();
  const availableModels = MODELS.filter(
    model => model.provider === activeEndpoint?.type
  );

  React.useEffect(() => {
    if (availableModels.length > 0) {
      const initialModel = availableModels[0].id;
      console.log('[SummarizeModal] Setting initial model:', initialModel);
      setSelectedModel(initialModel);
    }
  }, [availableModels]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    console.log('[SummarizeModal] Submit clicked');
    console.log('[SummarizeModal] Selected model:', selectedModel);
    console.log('[SummarizeModal] Active endpoint:', activeEndpoint);
    console.log('[SummarizeModal] Available models:', availableModels);
    console.log('[SummarizeModal] Prompt:', prompt);

    if (!selectedModel) {
      console.error('[SummarizeModal] No model selected');
      throw new Error('No model selected');
    }
    onSubmit(prompt, selectedModel);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Summarize Conversations</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {stats && (
          <div className="px-6 pt-4">
            <div className="bg-indigo-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-indigo-900 mb-2">Selected Content</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-semibold text-indigo-700">
                    {stats.conversations}
                  </div>
                  <div className="text-sm text-indigo-600">
                    {stats.conversations === 1 ? 'Conversation' : 'Conversations'}
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-indigo-700">
                    {stats.messages}
                  </div>
                  <div className="text-sm text-indigo-600">Messages</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-indigo-700">
                    {stats.words}
                  </div>
                  <div className="text-sm text-indigo-600">Words</div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => {
                console.log('[SummarizeModal] Model changed to:', e.target.value);
                setSelectedModel(e.target.value);
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-white"
            >
              {availableModels.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name} - {model.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customize the prompt for summarization:
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full h-48 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || availableModels.length === 0}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Summarize
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummarizeModal;