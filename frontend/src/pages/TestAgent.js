import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, Bot, User, Loader2, TestTube2 } from 'lucide-react';
import { agentsAPI, testingAPI } from '../services/api';
import toast from 'react-hot-toast';

const TestAgent = () => {
  const { id } = useParams();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState('conversation');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [lastPayload, setLastPayload] = useState(null);

  useEffect(() => {
    fetchAgent();
  }, [id]);

  const fetchAgent = async () => {
    try {
      const response = await agentsAPI.getById(id);
      const data = response.data;
      setAgent(data);

      if (data.agent_type === 'chatbot') {
        setMode('conversation');
      }
    } catch (error) {
      console.error('Error loading agent:', error);
      toast.error('Failed to load agent');
    } finally {
      setLoading(false);
    }
  };

  const canSimulateChannel = agent && agent.agent_type !== 'chatbot';

  const modeDescription = () => {
    if (mode === 'simulation') {
      return `Simulation mode builds a sample ${agent?.agent_type} incoming payload and tests your model response.`;
    }

    return 'Conversation mode lets you chat directly with your model in a test session.';
  };

  const handleSend = async () => {
    if (!message.trim() || !agent) return;

    const userText = message.trim();
    setMessage('');
    setSending(true);
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);

    try {
      const response = await testingAPI.testAgent(id, {
        message: userText,
        mode,
      });

      const data = response.data;
      setMessages((prev) => [...prev, { role: 'assistant', text: data.response }]);
      setLastPayload(data.simulated_payload || null);
    } catch (error) {
      console.error('Testing error:', error);
      toast.error(error.response?.data?.detail || 'Model test failed');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Test failed. Please check agent status/training and try again.',
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to={`/agents/${id}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TestTube2 className="w-7 h-7 text-primary-600" />
            Test Agent
          </h1>
          <p className="text-gray-500">
            Test {agent?.name} ({agent?.agent_type}) with conversation or channel simulation.
          </p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <button
            type="button"
            onClick={() => setMode('conversation')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'conversation'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Conversation Test
          </button>

          {canSimulateChannel && (
            <button
              type="button"
              onClick={() => setMode('simulation')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === 'simulation'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {agent?.agent_type} Simulation
            </button>
          )}
        </div>

        <p className="text-sm text-gray-600">{modeDescription()}</p>
      </div>

      <div className="card p-4 h-[420px] overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-gray-500">
            Start by sending a test message. The model response will appear here.
          </p>
        )}

        {messages.map((msg, index) => (
          <div
            key={`${msg.role}-${index}`}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
          >
            {msg.role !== 'user' && (
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-700" />
              </div>
            )}

            <div
              className={`max-w-[80%] p-3 rounded-lg text-sm ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : msg.isError
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {msg.text}
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="w-4 h-4 text-gray-700" />
              </div>
            )}
          </div>
        ))}
      </div>

      {lastPayload && mode === 'simulation' && (
        <div className="card p-4">
          <h2 className="font-semibold text-gray-900 mb-2">Generated Test Payload</h2>
          <pre className="bg-gray-900 text-gray-100 text-xs p-3 rounded-lg overflow-x-auto">
            {JSON.stringify(lastPayload, null, 2)}
          </pre>
        </div>
      )}

      <form onSubmit={onSubmit} className="card p-4 flex items-center gap-3">
        <input
          className="input-field"
          placeholder={`Send a ${mode} test message...`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={sending}
        />
        <button type="submit" className="btn-primary flex items-center gap-2" disabled={sending || !message.trim()}>
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Test
        </button>
      </form>
    </div>
  );
};

export default TestAgent;
