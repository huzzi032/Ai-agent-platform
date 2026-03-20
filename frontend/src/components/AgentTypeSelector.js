import React from 'react';
import { 
  MessageCircle, 
  Send, 
  Instagram, 
  Mail, 
  Bot,
  Check
} from 'lucide-react';

const agentTypes = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Connect with customers on WhatsApp',
    icon: MessageCircle,
    color: 'from-green-400 to-green-600',
    features: ['Send/receive messages', 'Media support', 'Auto-replies'],
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Build a Telegram bot',
    icon: Send,
    color: 'from-sky-400 to-sky-600',
    features: ['Bot commands', 'Inline keyboards', 'Group support'],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Automate Instagram DMs',
    icon: Instagram,
    color: 'from-pink-500 via-red-500 to-yellow-500',
    features: ['DM automation', 'Comment replies', 'Story mentions'],
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Smart email assistant',
    icon: Mail,
    color: 'from-red-500 to-red-700',
    features: ['Auto-reply', 'Email drafting', 'Smart filtering'],
  },
  {
    id: 'chatbot',
    name: 'Chatbot',
    description: 'Embed on your website',
    icon: Bot,
    color: 'from-primary-500 to-primary-700',
    features: ['Widget embed', 'Custom styling', 'Real-time chat'],
  },
];

const AgentTypeSelector = ({ selected, onSelect }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agentTypes.map((type) => {
        const Icon = type.icon;
        const isSelected = selected === type.id;

        return (
          <button
            key={type.id}
            onClick={() => onSelect(type.id)}
            className={`relative p-6 rounded-xl border-2 text-left transition-all duration-200
              ${isSelected 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
              }`}
          >
            {/* Selected indicator */}
            {isSelected && (
              <div className="absolute top-4 right-4 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}

            {/* Icon */}
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center mb-4`}>
              <Icon className="w-7 h-7 text-white" />
            </div>

            {/* Content */}
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{type.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{type.description}</p>

            {/* Features */}
            <ul className="space-y-1">
              {type.features.map((feature, index) => (
                <li key={index} className="text-xs text-gray-500 flex items-center gap-1">
                  <span className="w-1 h-1 bg-gray-400 rounded-full" />
                  {feature}
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
};

export default AgentTypeSelector;
