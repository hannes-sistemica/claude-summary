import React, { useState } from 'react';
import { Settings, Plus, X, Check, AlertCircle } from 'lucide-react';
import { EndpointConfig } from '../lib/types';
import { loadSettings, saveSettings } from '../lib/settings';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({ isOpen, onClose }) => {
  const [endpoints, setEndpoints] = useState<EndpointConfig[]>(loadSettings);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customEndpoint, setCustomEndpoint] = useState<Partial<EndpointConfig>>({
    type: 'custom',
    customHeaders: {},
    customBody: {}
  });
  
  const handleEndpointChange = (endpoint: EndpointConfig, field: keyof EndpointConfig, value: string) => {
    const updated = endpoints.map(ep => {
      if (ep.id === endpoint.id) {
        return { ...ep, [field]: value };
      }
      return ep;
    });
    setEndpoints(updated);
    saveSettings(updated);
  };
  
  const handleActivate = (endpoint: EndpointConfig) => {
    const updated = endpoints.map(ep => ({
      ...ep,
      isActive: ep.id === endpoint.id
    }));
    setEndpoints(updated);
    saveSettings(updated);
  };
  
  const handleAddCustom = () => {
    if (!customEndpoint.name || !customEndpoint.url) return;
    
    const newEndpoint: EndpointConfig = {
      id: `custom-${Date.now()}`,
      name: customEndpoint.name,
      type: 'custom',
      url: customEndpoint.url,
      apiKey: customEndpoint.apiKey,
      isActive: false,
      customHeaders: customEndpoint.customHeaders,
      customBody: customEndpoint.customBody
    };
    
    const updated = [...endpoints, newEndpoint];
    setEndpoints(updated);
    saveSettings(updated);
    setShowCustomForm(false);
    setCustomEndpoint({
      type: 'custom',
      customHeaders: {},
      customBody: {}
    });
  };
  
  const handleRemoveEndpoint = (id: string) => {
    const updated = endpoints.filter(ep => ep.id !== id);
    setEndpoints(updated);
    saveSettings(updated);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose}></div>
      
      <div className="relative min-h-screen md:flex md:items-center md:justify-center">
        <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 my-8">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center">
              <Settings className="w-5 h-5 text-gray-500 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Summarization Settings</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {endpoints.map(endpoint => (
                <div 
                  key={endpoint.id}
                  className="bg-gray-50 rounded-lg p-4 relative"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-4">
                      <div className="flex items-center mb-2">
                        <h3 className="text-sm font-medium text-gray-900">{endpoint.name}</h3>
                        {endpoint.type === 'custom' && (
                          <button
                            onClick={() => handleRemoveEndpoint(endpoint.id)}
                            className="ml-2 text-red-500 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      <input
                        type="text"
                        value={endpoint.url}
                        readOnly={endpoint.type !== 'custom'}
                        onChange={(e) => handleEndpointChange(endpoint, 'url', e.target.value)}
                        className="block w-full mt-1 text-sm border-gray-300 rounded-md bg-white"
                      />
                      
                      <input
                        type="password"
                        value={endpoint.apiKey || ''}
                        onChange={(e) => handleEndpointChange(endpoint, 'apiKey', e.target.value)}
                        placeholder="API Key"
                        className="block w-full mt-2 text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <button
                      onClick={() => handleActivate(endpoint)}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        endpoint.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {endpoint.isActive ? (
                        <span className="flex items-center">
                          <Check className="w-4 h-4 mr-1" />
                          Active
                        </span>
                      ) : (
                        'Activate'
                      )}
                    </button>
                  </div>
                  
                  {!endpoint.apiKey && (
                    <div className="mt-2 flex items-center text-sm text-amber-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      API key required
                    </div>
                  )}
                </div>
              ))}
              
              {!showCustomForm && (
                <button
                  onClick={() => setShowCustomForm(true)}
                  className="flex items-center text-sm text-indigo-600 hover:text-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Custom Endpoint
                </button>
              )}
              
              {showCustomForm && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Add Custom Endpoint</h3>
                  
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={customEndpoint.name || ''}
                      onChange={(e) => setCustomEndpoint({ ...customEndpoint, name: e.target.value })}
                      placeholder="Endpoint Name"
                      className="block w-full text-sm border-gray-300 rounded-md"
                    />
                    
                    <input
                      type="text"
                      value={customEndpoint.url || ''}
                      onChange={(e) => setCustomEndpoint({ ...customEndpoint, url: e.target.value })}
                      placeholder="Endpoint URL"
                      className="block w-full text-sm border-gray-300 rounded-md"
                    />
                    
                    <input
                      type="password"
                      value={customEndpoint.apiKey || ''}
                      onChange={(e) => setCustomEndpoint({ ...customEndpoint, apiKey: e.target.value })}
                      placeholder="API Key"
                      className="block w-full text-sm border-gray-300 rounded-md"
                    />
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => setShowCustomForm(false)}
                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddCustom}
                        className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                      >
                        Add Endpoint
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsMenu;