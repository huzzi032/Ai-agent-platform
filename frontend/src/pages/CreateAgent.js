import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Check } from 'lucide-react';
import { agentsAPI } from '../services/api';
import AgentTypeSelector from '../components/AgentTypeSelector';
import toast from 'react-hot-toast';

const CreateAgent = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    agent_type: '',
    description: '',
    config: {
      system_prompt: 'You are a helpful AI assistant.',
      welcome_message: 'Hello! How can I help you today?',
      widget_color: '#4F46E5',
      widget_position: 'bottom-right',
      temperature: 0.7,
      max_context_length: 10,
    },
  });

  const handleTypeSelect = (type) => {
    setFormData({ ...formData, agent_type: type });
    setStep(2);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('config.')) {
      const configKey = name.replace('config.', '');
      setFormData({
        ...formData,
        config: { ...formData.config, [configKey]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.agent_type) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      const response = await agentsAPI.create({
        name: formData.name,
        agent_type: formData.agent_type,
        description: formData.description,
        config: formData.config,
      });
      
      toast.success('Agent created successfully!');
      navigate(`/agents/${response.data.id}`);
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error(error.response?.data?.detail || 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/agents')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Agent</h1>
          <p className="text-gray-500">Set up your AI agent in a few simple steps</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${step >= 1 ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
            1
          </div>
          <span className="font-medium">Select Type</span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-200" />
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${step >= 2 ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
            2
          </div>
          <span className="font-medium">Configure</span>
        </div>
      </div>

      {/* Step 1: Select Type */}
      {step === 1 && (
        <div className="animate-fade-in">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Choose Agent Type</h2>
          <p className="text-gray-500 mb-6">Select the platform where you want to deploy your AI agent</p>
          <AgentTypeSelector
            selected={formData.agent_type}
            onSelect={handleTypeSelect}
          />
        </div>
      )}

      {/* Step 2: Configure */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="animate-fade-in space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Agent Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agent Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., Customer Support Bot"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input-field"
                  rows={3}
                  placeholder="What does this agent do?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  System Prompt
                </label>
                <textarea
                  name="config.system_prompt"
                  value={formData.config.system_prompt}
                  onChange={handleChange}
                  className="input-field"
                  rows={4}
                  placeholder="Instructions for how the AI should behave"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This defines how your agent will respond to messages
                </p>
              </div>

              {formData.agent_type === 'chatbot' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Welcome Message
                    </label>
                    <input
                      type="text"
                      name="config.welcome_message"
                      value={formData.config.welcome_message}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Hello! How can I help you today?"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Widget Color
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          name="config.widget_color"
                          value={formData.config.widget_color}
                          onChange={handleChange}
                          className="w-10 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.config.widget_color}
                          onChange={handleChange}
                          name="config.widget_color"
                          className="input-field flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Position
                      </label>
                      <select
                        name="config.widget_position"
                        value={formData.config.widget_position}
                        onChange={handleChange}
                        className="input-field"
                      >
                        <option value="bottom-right">Bottom Right</option>
                        <option value="bottom-left">Bottom Left</option>
                        <option value="top-right">Top Right</option>
                        <option value="top-left">Top Left</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperature ({formData.config.temperature})
                  </label>
                  <input
                    type="range"
                    name="config.temperature"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.config.temperature}
                    onChange={handleChange}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">Higher = more creative responses</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Context Length
                  </label>
                  <input
                    type="number"
                    name="config.max_context_length"
                    value={formData.config.max_context_length}
                    onChange={handleChange}
                    className="input-field"
                    min="1"
                    max="50"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Create Agent
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreateAgent;
