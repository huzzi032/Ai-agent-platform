import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  FileText,
  Database
} from 'lucide-react';
import { agentsAPI, trainingAPI, documentsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Training = () => {
  const { id } = useParams();
  const [agent, setAgent] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [agentRes, docsRes] = await Promise.all([
        agentsAPI.getById(id),
        documentsAPI.getByAgent(id),
      ]);
      setAgent(agentRes.data);
      setDocuments(docsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load training data');
    } finally {
      setLoading(false);
    }
  };

  const handleTrain = async () => {
    if (documents.length === 0) {
      toast.error('Please upload documents before training');
      return;
    }

    setTraining(true);
    
    try {
      await trainingAPI.train(id);
      toast.success('Training completed successfully!');
      fetchData();
    } catch (error) {
      console.error('Error training agent:', error);
      toast.error(error.response?.data?.detail || 'Training failed');
    } finally {
      setTraining(false);
    }
  };

  const getStatusIcon = () => {
    switch (agent?.training_status) {
      case 'completed':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'processing':
        return <Loader2 className="w-16 h-16 text-amber-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-16 h-16 text-red-500" />;
      default:
        return <Database className="w-16 h-16 text-gray-400" />;
    }
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to={`/agents/${id}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training</h1>
          <p className="text-gray-500">Train your agent on uploaded documents</p>
        </div>
      </div>

      {/* Status Card */}
      <div className="card p-8 text-center">
        <div className="flex justify-center mb-4">
          {getStatusIcon()}
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {agent?.is_trained ? 'Agent is Trained' : 'Agent Not Trained'}
        </h2>
        
        <p className="text-gray-500 mb-6">
          {agent?.training_status === 'completed' 
            ? `Last trained on ${new Date(agent.last_trained_at).toLocaleDateString()}`
            : agent?.training_status === 'processing'
            ? 'Training in progress...'
            : agent?.training_status === 'failed'
            ? 'Training failed. Please try again.'
            : 'Upload documents and train your agent to enable RAG capabilities.'
          }
        </p>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleTrain}
            disabled={training || documents.length === 0}
            className="btn-primary flex items-center gap-2"
          >
            {training ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Training...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                {agent?.is_trained ? 'Retrain Agent' : 'Start Training'}
              </>
            )}
          </button>
          
          <Link
            to={`/agents/${id}/documents`}
            className="btn-secondary flex items-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Manage Documents
          </Link>
        </div>
      </div>

      {/* Documents Summary */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Training Documents</h2>
        
        {documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="w-5 h-5 text-gray-400" />
                <span className="flex-1 text-gray-700">{doc.original_filename}</span>
                <span className="text-sm text-gray-500 capitalize">{doc.file_type}</span>
                {doc.processing_status === 'completed' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No documents uploaded yet</p>
            <Link
              to={`/agents/${id}/documents`}
              className="btn-primary inline-flex items-center gap-2"
            >
              <FileText className="w-5 h-5" />
              Upload Documents
            </Link>
          </div>
        )}
      </div>

      {/* How it Works */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">How Training Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold text-primary-600">1</span>
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Upload Documents</h3>
            <p className="text-sm text-gray-500">Add PDFs, text files, URLs, or paste text directly</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold text-primary-600">2</span>
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Process & Index</h3>
            <p className="text-sm text-gray-500">We extract text and create searchable embeddings</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-xl font-bold text-primary-600">3</span>
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Ready to Use</h3>
            <p className="text-sm text-gray-500">Your agent can now answer questions based on your documents</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Training;
