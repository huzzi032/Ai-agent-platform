import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Code, 
  Copy, 
  Check,
  Download,
  ExternalLink,
  MessageSquare,
  Mail,
  Send,
  Instagram,
  Bot,
  Loader2
} from 'lucide-react';
import { agentsAPI, integrationAPI } from '../services/api';
import toast from 'react-hot-toast';

const getPublicApiBaseUrl = () => {
  const configured = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  return configured.replace(/\/api\/?$/, '');
};

const normalizeWidgetPosition = (value) => {
  const validPositions = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];
  return validPositions.includes(value) ? value : 'bottom-right';
};

const Integration = () => {
  const { id } = useParams();
  const [agent, setAgent] = useState(null);
  const [integration, setIntegration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloadingPlugin, setDownloadingPlugin] = useState(false);
  const [wpConfig, setWpConfig] = useState({
    api_url: getPublicApiBaseUrl(),
    primary_color: '#4F46E5',
    welcome_message: 'Hello! How can I help you today?',
    bot_name: 'AI Assistant',
    launcher_label: 'Chat',
    widget_position: 'bottom-right',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [agentRes, integrationRes] = await Promise.all([
        agentsAPI.getById(id),
        integrationAPI.getIntegration(id, 'snippet'),
      ]);
      setAgent(agentRes.data);
      setIntegration(integrationRes.data);

      const config = agentRes?.data?.config || {};
      setWpConfig({
        api_url: getPublicApiBaseUrl(),
        primary_color: config.widget_color || '#4F46E5',
        welcome_message: config.welcome_message || 'Hello! How can I help you today?',
        bot_name: agentRes?.data?.name || 'AI Assistant',
        launcher_label: 'Chat',
        widget_position: normalizeWidgetPosition(config.widget_position),
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load integration data');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWordPressInputChange = (event) => {
    const { name, value } = event.target;
    setWpConfig((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDownloadWordPressPlugin = async () => {
    try {
      setDownloadingPlugin(true);
      const response = await integrationAPI.downloadWordPressPlugin(id, wpConfig);

      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `ai-chatbot-agent-${id}-wordpress.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);

      toast.success('WordPress plugin ZIP downloaded');
    } catch (error) {
      console.error('Failed to download WordPress plugin ZIP:', error);
      toast.error('Failed to download WordPress plugin ZIP');
    } finally {
      setDownloadingPlugin(false);
    }
  };

  const getAgentIcon = () => {
    switch (agent?.agent_type) {
      case 'whatsapp':
        return <MessageSquare className="w-6 h-6" />;
      case 'telegram':
        return <Send className="w-6 h-6" />;
      case 'instagram':
        return <Instagram className="w-6 h-6" />;
      case 'gmail':
        return <Mail className="w-6 h-6" />;
      case 'chatbot':
        return <Bot className="w-6 h-6" />;
      default:
        return <Bot className="w-6 h-6" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to={`/agents/${id}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex items-center gap-3">
          {getAgentIcon()}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Integration</h1>
            <p className="text-gray-500">Connect {agent?.name} to your platform</p>
          </div>
        </div>
      </div>

      {/* Setup Steps */}
      {integration?.setup_steps && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Setup Instructions</h2>
          <div className="space-y-3">
            {integration.setup_steps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-medium text-primary-600">{index + 1}</span>
                </div>
                <p className="text-gray-700">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Code Snippet */}
      {integration?.code_snippet && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Code Snippet</h2>
            <button
              onClick={() => copyToClipboard(integration.code_snippet)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-100">
              <code>{integration.code_snippet}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Integration Methods (Chatbot only) */}
      {integration?.integration_methods && (
        <div className="space-y-6">
          {integration.integration_methods.map((method, index) => (
            <div key={index} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{method.name}</h2>
                  <p className="text-gray-500">{method.description}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(method.code)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              
              {method.placement && (
                <p className="text-sm text-gray-500 mb-3">
                  <span className="font-medium">Placement:</span> {method.placement}
                </p>
              )}
              
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100">
                  <code>{method.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* WordPress Plugin ZIP Download */}
      {agent?.agent_type === 'chatbot' && (
        <div className="card p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">WordPress Plugin ZIP</h2>
            <p className="text-sm text-gray-500 mt-1">
              Customize your chatbot appearance, download a plugin ZIP, and upload it in WordPress via Plugins {'>'} Add New {'>'} Upload Plugin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bot Name
              </label>
              <input
                type="text"
                name="bot_name"
                value={wpConfig.bot_name}
                onChange={handleWordPressInputChange}
                className="input-field"
                maxLength={60}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Launcher Label
              </label>
              <input
                type="text"
                name="launcher_label"
                value={wpConfig.launcher_label}
                onChange={handleWordPressInputChange}
                className="input-field"
                maxLength={24}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API URL
              </label>
              <input
                type="text"
                name="api_url"
                value={wpConfig.api_url}
                onChange={handleWordPressInputChange}
                className="input-field w-full"
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="primary_color"
                  value={wpConfig.primary_color}
                  onChange={handleWordPressInputChange}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  name="primary_color"
                  value={wpConfig.primary_color}
                  onChange={handleWordPressInputChange}
                  className="input-field flex-1"
                  maxLength={7}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <select
                name="widget_position"
                value={wpConfig.widget_position}
                onChange={handleWordPressInputChange}
                className="input-field"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="top-right">Top Right</option>
                <option value="top-left">Top Left</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Welcome Message
            </label>
            <textarea
              name="welcome_message"
              value={wpConfig.welcome_message}
              onChange={handleWordPressInputChange}
              className="input-field"
              rows={3}
              maxLength={220}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              The generated ZIP contains PHP, JavaScript, and CSS files preconfigured for this agent.
            </p>
            <button
              onClick={handleDownloadWordPressPlugin}
              disabled={downloadingPlugin}
              className="btn-primary flex items-center gap-2 disabled:opacity-70"
            >
              {downloadingPlugin ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Preparing ZIP...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download ZIP
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* API Endpoint */}
      {integration?.api_endpoint && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">API Endpoint</h2>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <code className="text-sm text-gray-700 flex-1">{integration.api_endpoint}</code>
            <button
              onClick={() => copyToClipboard(integration.api_endpoint)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Webhook URL */}
      {integration?.webhook_url && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Webhook URL</h2>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <code className="text-sm text-gray-700 flex-1">{integration.webhook_url}</code>
            <button
              onClick={() => copyToClipboard(integration.webhook_url)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Copy className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Configure this webhook URL in your {agent?.agent_type} platform settings
          </p>
        </div>
      )}

      {/* Requirements */}
      {integration?.requirements && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h2>
          <ul className="space-y-2">
            {integration.requirements.map((req, index) => (
              <li key={index} className="flex items-center gap-2 text-gray-700">
                <Check className="w-4 h-4 text-green-500" />
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Documentation Link */}
      {integration?.documentation && (
        <div className="card p-6">
          <a
            href={integration.documentation}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
          >
            <ExternalLink className="w-5 h-5" />
            View Full Documentation
          </a>
        </div>
      )}
    </div>
  );
};

export default Integration;
