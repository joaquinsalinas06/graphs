import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 animate-fade-in z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
}

export const InputModal: React.FC<InputModalProps> = ({
  isOpen,
  onClose,
  title,
  label,
  placeholder,
  defaultValue = '',
  onConfirm,
}) => {
  const [value, setValue] = React.useState(defaultValue);

  React.useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue, isOpen]);

  const handleConfirm = () => {
    onConfirm(value);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
};

interface NodeEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeData: {
    name: string;
    color: string;
    connections: Array<{ node: string; weight: number; bidirectional: boolean }>;
  } | null;
  onSave: (name: string, color: string) => void;
  onDelete: () => void;
  onDeleteEdge?: (from: string, to: string) => void;
}

export const NodeEditModal: React.FC<NodeEditModalProps> = ({
  isOpen,
  onClose,
  nodeData,
  onSave,
  onDelete,
  onDeleteEdge,
}) => {
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState('#e5e7eb');

  React.useEffect(() => {
    if (nodeData) {
      setName(nodeData.name);
      setColor(nodeData.color);
    }
  }, [nodeData, isOpen]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), color);
      onClose();
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this node?')) {
      onDelete();
      onClose();
    }
  };

  const colorOptions = [
    '#e5e7eb', '#ef4444', '#f97316', '#eab308', '#22c55e', 
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Node">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Node Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter node name"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Node Color
          </label>
          <div className="grid grid-cols-5 gap-2">
            {colorOptions.map((colorOption) => (
              <button
                key={colorOption}
                onClick={() => setColor(colorOption)}
                className={`w-10 h-10 rounded-lg border-2 transition-all ${
                  color === colorOption ? 'border-gray-800 scale-110' : 'border-gray-300 hover:border-gray-500'
                }`}
                style={{ backgroundColor: colorOption }}
              />
            ))}
          </div>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="mt-2 w-full h-10 rounded-lg border border-gray-300"
          />
        </div>

        {nodeData && nodeData.connections.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Connections
            </label>
            <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
              {nodeData.connections.map((conn, index) => (
                <div key={index} className="flex items-center justify-between text-sm text-gray-600 mb-1 p-1 hover:bg-gray-100 rounded">
                  <span>
                    {nodeData.name} {conn.bidirectional ? '↔' : '→'} {conn.node} (weight: {conn.weight})
                  </span>
                  {onDeleteEdge && (
                    <button
                      onClick={() => onDeleteEdge(nodeData.name, conn.node)}
                      className="text-red-500 hover:text-red-700 ml-2 px-1"
                      title="Delete edge"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-between">
          <Button variant="destructive" onClick={handleDelete}>
            Delete Node
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};