import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  FileText, 
  Play, 
  Settings,
  Code,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { agentsAPI } from '../services/api';
import toast from 'react-hot-toast';

const AgentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchAgent();
  }, [id]);

  const fetchAgent = async () => {
    try {
      const response = await agentsAPI.getById(id);
      setAgent(response.data);
    } catch (error) {
      console.error('Error fetching agent:', error);
      toast.error('Failed to load agent');
      navigate('/agents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await agentsAPI.delete(id);
      toast.success('Agent deleted successfully');
      navigate('/agents');
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
    }
  };

  const getAgentIcon = () => {
    switch (agent?.agent_type) {
      case 'whatsapp':
        return '📱';
      case 'telegram':
        return '✈️';
      case 'instagram':
        return '📸';
      case 'gmail':
        return '📧';
      case 'chatbot':
        return '🤖';
      default:
        return '🤖';
    }
  };

  const getStatusBadge = () => {
    switch (agent?.status) {
      case 'active':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Active
          </span>
        );
      case 'training':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            Training
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            Error
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
            <AlertCircle className="w-4 h-4" />
            Inactive
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Agent not found</p>
        <Link to="/agents" className="btn-primary mt-4 inline-block">
          Back to Agents
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/agents')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{getAgentIcon()}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{agent.name}</h1>
              <p className="text-gray-500 capitalize">{agent.agent_type} Agent</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Link
          to={`/agents/${id}/documents`}
          className="card p-4 hover:shadow-md transition-all text-center group"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <p className="font-medium text-gray-900">Documents</p>
          <p className="text-sm text-gray-500">Upload training data</p>
        </Link>

        <Link
          to={`/agents/${id}/training`}
          className="card p-4 hover:shadow-md transition-all text-center group"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-200 transition-colors">
            <Play className="w-6 h-6 text-purple-600" />
          </div>
          <p className="font-medium text-gray-900">Training</p>
          <p className="text-sm text-gray-500">Train your agent</p>
        </Link>

        <Link
          to={`/agents/${id}/integration`}
          className="card p-4 hover:shadow-md transition-all text-center group"
        >
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors">
            <Code className="w-6 h-6 text-green-600" />
          </div>
          <p className="font-medium text-gray-900">Integration</p>
          <p className="text-sm text-gray-500">Get embed code</p>
        </Link>

        <Link
          to={`/agents/${id}/test`}
          className="card p-4 hover:shadow-md transition-all text-center group"
        >
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-indigo-200 transition-colors">
            <Play className="w-6 h-6 text-indigo-600" />
          </div>
          <p className="font-medium text-gray-900">Test</p>
          <p className="text-sm text-gray-500">Try responses</p>
        </Link>

        <Link
          to={`/conversations?agent=${id}`}
          className="card p-4 hover:shadow-md transition-all text-center group"
        >
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-amber-200 transition-colors">
            <MessageSquare className="w-6 h-6 text-amber-600" />
          </div>
          <p className="font-medium text-gray-900">Conversations</p>
          <p className="text-sm text-gray-500">View chats</p>
        </Link>
      </div>

      {/* Agent Info */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Agent Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Description</p>
            <p className="text-gray-900">{agent.description || 'No description'}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Created</p>
            <p className="text-gray-900">
              {new Date(agent.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Training Status</p>
            <p className="text-gray-900 capitalize flex items-center gap-2">
              {agent.is_trained ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Trained
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                  Not trained
                </>
              )}
            </p>
          </div>

          {agent.last_trained_at && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Last Trained</p>
              <p className="text-gray-900">
                {new Date(agent.last_trained_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {agent.config?.system_prompt && (
          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-2">System Prompt</p>
            <div className="bg-gray-50 rounded-lg p-4 text-gray-700 text-sm">
              {agent.config.system_prompt}
            </div>
          </div>
        )}
      </div>

      {/* Webhook Info */}
      {agent.webhook_url && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Webhook URL</h2>
          <div className="bg-gray-900 rounded-lg p-4">
            <code className="text-green-400 text-sm break-all">{agent.webhook_url}</code>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Use this URL to configure webhooks in your {agent.agent_type} platform
          </p>
        </div>
      )}

      {/* Danger Zone */}
      <div className="card p-6 border-red-200">
        <h2 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h2>
        
        {!deleteConfirm ? (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Delete Agent
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Are you sure? This action cannot be undone. All data associated with this agent will be permanently deleted.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, delete
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDetail;
