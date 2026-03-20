import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageCircle, 
  Send, 
  Instagram, 
  Mail, 
  Bot,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

const AgentCard = ({ agent, showActions = true }) => {
  const getAgentIcon = () => {
    switch (agent.agent_type) {
      case 'whatsapp':
        return <MessageCircle className="w-8 h-8" />;
      case 'telegram':
        return <Send className="w-8 h-8" />;
      case 'instagram':
        return <Instagram className="w-8 h-8" />;
      case 'gmail':
        return <Mail className="w-8 h-8" />;
      case 'chatbot':
        return <Bot className="w-8 h-8" />;
      default:
        return <Bot className="w-8 h-8" />;
    }
  };

  const getAgentGradient = () => {
    switch (agent.agent_type) {
      case 'whatsapp':
        return 'from-green-400 to-green-600';
      case 'telegram':
        return 'from-sky-400 to-sky-600';
      case 'instagram':
        return 'from-pink-500 via-red-500 to-yellow-500';
      case 'gmail':
        return 'from-red-500 to-red-700';
      case 'chatbot':
        return 'from-primary-500 to-primary-700';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const getStatusBadge = () => {
    switch (agent.status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            Active
          </span>
        );
      case 'training':
        return (
          <span className="flex items-center gap-1 text-sm text-amber-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Training
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 text-sm text-red-600">
            <AlertCircle className="w-4 h-4" />
            Error
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <AlertCircle className="w-4 h-4" />
            Inactive
          </span>
        );
    }
  };

  return (
    <div className="card overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Header with gradient */}
      <div className={`h-32 bg-gradient-to-br ${getAgentGradient()} relative`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div className="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center text-gray-700">
            {getAgentIcon()}
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1">
            {getStatusBadge()}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
            <p className="text-sm text-gray-500 capitalize">{agent.agent_type} Agent</p>
          </div>
        </div>

        {agent.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {agent.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <CheckCircle className={`w-4 h-4 ${agent.is_trained ? 'text-green-500' : 'text-gray-300'}`} />
            {agent.is_trained ? 'Trained' : 'Not trained'}
          </span>
          <span>•</span>
          <span>Created {new Date(agent.created_at).toLocaleDateString()}</span>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2">
            <Link
              to={`/agents/${agent.id}`}
              className="flex-1 btn-primary text-center text-sm py-2"
            >
              Manage
            </Link>
            <Link
              to={`/agents/${agent.id}/integration`}
              className="btn-secondary text-sm py-2"
            >
              Integrate
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentCard;
