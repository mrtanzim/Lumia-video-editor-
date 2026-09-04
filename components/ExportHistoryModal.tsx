
import React from 'react';
import { X, Download, Trash2, RefreshCw, FileVideo, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ExportRecord } from '../types';

interface ExportHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ExportRecord[];
  onClearHistory: () => void;
}

export const ExportHistoryModal: React.FC<ExportHistoryModalProps> = ({ isOpen, onClose, history, onClearHistory }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#121212] w-full max-w-4xl h-[70vh] rounded-2xl border border-gray-800 shadow-2xl flex flex-col overflow-hidden">
        
        <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-[#1a1a1a]">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Clock className="text-indigo-500" /> Export History
                </h2>
                <p className="text-xs text-gray-500 mt-1">Manage your recent renders and downloads</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-0">
            {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                    <FileVideo size={64} className="mb-4 text-gray-700" />
                    <p>No export history found.</p>
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#1a1a1a] text-xs font-bold text-gray-400 uppercase tracking-wider sticky top-0">
                        <tr>
                            <th className="p-4 border-b border-gray-800">File</th>
                            <th className="p-4 border-b border-gray-800">Format</th>
                            <th className="p-4 border-b border-gray-800">Date</th>
                            <th className="p-4 border-b border-gray-800">Status</th>
                            <th className="p-4 border-b border-gray-800 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {history.map((record) => (
                            <tr key={record.id} className="border-b border-gray-800/50 hover:bg-white/5 transition">
                                <td className="p-4 font-medium text-gray-200 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-800 rounded overflow-hidden flex items-center justify-center">
                                        <FileVideo size={20} className="text-gray-500" />
                                    </div>
                                    <div>
                                        <div>{record.filename}</div>
                                        <div className="text-xs text-gray-500">{record.size} • {record.duration}</div>
                                    </div>
                                </td>
                                <td className="p-4 text-gray-400 uppercase font-mono text-xs">{record.resolution} {record.format}</td>
                                <td className="p-4 text-gray-400 text-xs">{new Date(record.date).toLocaleDateString()}</td>
                                <td className="p-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                                        ${record.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                                          record.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                                          'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                        {record.status === 'success' && <CheckCircle size={12} />}
                                        {record.status === 'failed' && <XCircle size={12} />}
                                        {record.status === 'in-progress' && <RefreshCw size={12} className="animate-spin" />}
                                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition" title="Download Again">
                                            <Download size={16} />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition" title="Delete from History">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>

        <div className="p-4 border-t border-gray-800 bg-[#1a1a1a] flex justify-between items-center">
            <span className="text-xs text-gray-500">{history.length} records found</span>
            <button 
                onClick={onClearHistory}
                className="px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-900/20 rounded border border-transparent hover:border-red-900/50 transition"
            >
                Clear History
            </button>
        </div>
      </div>
    </div>
  );
};
