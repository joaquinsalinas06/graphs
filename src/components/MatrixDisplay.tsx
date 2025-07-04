import React from 'react';

interface MatrixDisplayProps {
  matrix: number[][];
  nodes: string[];
  algorithmName: string;
}

export const MatrixDisplay: React.FC<MatrixDisplayProps> = ({ matrix, nodes, algorithmName }) => {
  const INF = 999999;

  const getAlgorithmDisplayName = (name: string) => {
    switch (name) {
      case 'floyd-warshall':
        return 'Floyd-Warshall';
      case 'johnson':
        return 'Johnson';
      case 'slow-apsp':
        return 'SLOW-APSP';
      case 'faster-apsp':
        return 'FASTER-APSP';
      default:
        return name;
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200 animate-fade-in">
      <h5 className="text-lg font-semibold text-gray-800 mb-4 text-center">
        {getAlgorithmDisplayName(algorithmName)} - Minimum Distance Matrix
      </h5>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-lg shadow-sm overflow-hidden">
          <thead>
            <tr className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <th className="border border-gray-300 p-3 text-sm font-semibold"></th>
              {nodes.map((node) => (
                <th
                  key={node}
                  className="border border-gray-300 p-3 text-sm font-semibold"
                >
                  {node}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr
                key={i}
                className="hover:bg-gray-50 transition-colors"
              >
                <th className="border border-gray-300 p-3 text-sm font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                  {nodes[i]}
                </th>
                {row.map((val, j) => (
                  <td
                    key={j}
                    className={`border border-gray-300 p-3 text-sm text-center font-mono ${
                      val === INF 
                        ? 'bg-red-50 text-red-600' 
                        : val === 0 
                        ? 'bg-green-50 text-green-600 font-bold' 
                        : 'text-gray-700'
                    }`}
                  >
                    {val === INF ? '∞' : val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 flex justify-center space-x-4 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
          <span className="text-gray-600">Same node (0)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
          <span className="text-gray-600">No path (∞)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
          <span className="text-gray-600">Distance</span>
        </div>
      </div>
    </div>
  );
};