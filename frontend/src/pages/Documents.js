import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  Image, 
  Trash2, 
  CheckCircle,
  Loader2,
  X
} from 'lucide-react';
import { documentsAPI, agentsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Documents = () => {
  const { id } = useParams();
  const [agent, setAgent] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMethod, setUploadMethod] = useState('file');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');

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
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await documentsAPI.upload(id, formData);
      toast.success('Document uploaded successfully');
      fetchData();
      setShowUploadModal(false);
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlUpload = async () => {
    if (!urlInput.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('url', urlInput);

    try {
      await documentsAPI.upload(id, formData);
      toast.success('URL content added successfully');
      setUrlInput('');
      fetchData();
      setShowUploadModal(false);
    } catch (error) {
      console.error('Error adding URL:', error);
      toast.error('Failed to add URL content');
    } finally {
      setUploading(false);
    }
  };

  const handleTextUpload = async () => {
    if (!textInput.trim()) {
      toast.error('Please enter some text');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('text', textInput);

    try {
      await documentsAPI.upload(id, formData);
      toast.success('Text added successfully');
      setTextInput('');
      fetchData();
      setShowUploadModal(false);
    } catch (error) {
      console.error('Error adding text:', error);
      toast.error('Failed to add text');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentsAPI.delete(docId);
      toast.success('Document deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />;
      case 'image':
        return <Image className="w-8 h-8 text-blue-500" />;
      case 'url':
        return <Link className="w-8 h-8 text-green-500" />;
      case 'text':
        return <FileText className="w-8 h-8 text-gray-500" />;
      default:
        return <FileText className="w-8 h-8 text-gray-500" />;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to={`/agents/${id}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-500">Manage training documents for {agent?.name}</p>
          </div>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Upload className="w-5 h-5" />
          Upload Document
        </button>
      </div>

      {/* Documents List */}
      {documents.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {getFileIcon(doc.file_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{doc.original_filename}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="capitalize">{doc.file_type}</span>
                    <span>•</span>
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                    {doc.file_size > 0 && (
                      <>
                        <span>•</span>
                        <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {doc.processing_status === 'completed' ? (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      Ready
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-amber-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing
                    </span>
                  )}
                  
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-500 mb-4">Upload documents to train your agent</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Upload Document
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Upload Document</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Method Tabs */}
            <div className="flex gap-2 mb-6">
              {['file', 'url', 'text'].map((method) => (
                <button
                  key={method}
                  onClick={() => setUploadMethod(method)}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium capitalize transition-colors
                    ${uploadMethod === method 
                      ? 'bg-primary-100 text-primary-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {method}
                </button>
              ))}
            </div>

            {/* File Upload */}
            {uploadMethod === 'file' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Drag and drop your file here</p>
                  <p className="text-sm text-gray-400 mb-4">or</p>
                  <label className="btn-primary cursor-pointer inline-block">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.txt,.md,.doc,.docx,image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                    {uploading ? 'Uploading...' : 'Browse Files'}
                  </label>
                </div>
                <p className="text-sm text-gray-500">
                  Supported formats: PDF, TXT, MD, DOC, DOCX, Images
                </p>
              </div>
            )}

            {/* URL Upload */}
            {uploadMethod === 'url' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="input-field"
                    placeholder="https://example.com/page"
                  />
                </div>
                <button
                  onClick={handleUrlUpload}
                  disabled={uploading}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Link className="w-5 h-5" />
                      Add URL Content
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Text Upload */}
            {uploadMethod === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paste Text
                  </label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="input-field"
                    rows={6}
                    placeholder="Paste your text here..."
                  />
                </div>
                <button
                  onClick={handleTextUpload}
                  disabled={uploading}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      Add Text
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
