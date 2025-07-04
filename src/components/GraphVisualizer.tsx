'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, StepForward, RotateCcw, Trash2, Zap, ArrowUpDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { GraphCanvas } from '@/components/GraphCanvas';
import { MatrixDisplay } from '@/components/MatrixDisplay';
import { InputModal, NodeEditModal } from '@/components/ui/Modal';
import { useGraph } from '@/hooks/useGraph';
import { useDijkstra } from '@/hooks/useDijkstra';
import { useFloydWarshall } from '@/hooks/useFloydWarshall';
import { useJohnson } from '@/hooks/useJohnson';
import { useSlowAPSP } from '@/hooks/useSlowAPSP';
import { useFasterAPSP } from '@/hooks/useFasterAPSP';

export default function GraphVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedStartNode, setSelectedStartNode] = useState<string>('');
  const [edgesInput, setEdgesInput] = useState('');
  const [isDirectedMode, setIsDirectedMode] = useState(true);
  const [currentMatrix, setCurrentMatrix] = useState<{ matrix: number[][]; nodes: string[] } | null>(null);
  const [statusMessage, setStatusMessage] = useState('Click on the canvas to create nodes');
  const [currentAlgorithm, setCurrentAlgorithm] = useState<string>('');

  // Modal states
  const [edgeWeightModal, setEdgeWeightModal] = useState<{
    isOpen: boolean;
    from: string;
    to: string;
    defaultWeight: string;
  }>({ isOpen: false, from: '', to: '', defaultWeight: '1' });

  const [nodeEditModal, setNodeEditModal] = useState<{
    isOpen: boolean;
    nodeData: { name: string; color: string; connections: Array<{ node: string; weight: number; bidirectional: boolean }> } | null;
  }>({ isOpen: false, nodeData: null });

  const [edgeEditModal, setEdgeEditModal] = useState<{
    isOpen: boolean;
    edge: { from: string; to: string; weight: number } | null;
  }>({ isOpen: false, edge: null });

  const {
    nodes,
    edges,
    addNode,
    addEdge,
    updateNode,
    updateEdge,
    moveNode,
    deleteNode,
    deleteEdge,
    getNodeConnections,
    switchGraphMode,
    clearGraph,
    parseEdges,
    generateEdgesText,
    mode,
    setMode,
    tempEdgeStart,
    setTempEdgeStart,
  } = useGraph();

  const {
    distances,
    visited,
    unvisited,
    currentNode,
    algorithmSteps,
    currentStepIndex,
    isRunning,
    runDijkstra,
    nextStep,
    reset: resetDijkstra,
  } = useDijkstra(nodes, edges);

  const {
    matrix: floydMatrix,
    algorithmSteps: floydSteps,
    currentStepIndex: floydStepIndex,
    isRunning: floydIsRunning,
    runFloydWarshall,
    nextStep: floydNextStep,
    reset: resetFloyd,
  } = useFloydWarshall(nodes, edges);

  const {
    matrix: johnsonMatrix,
    runJohnson,
    reset: resetJohnson,
  } = useJohnson(nodes, edges);

  const {
    matrix: slowAPSPMatrix,
    runSlowAPSP,
    reset: resetSlowAPSP,
  } = useSlowAPSP(nodes, edges);

  const {
    matrix: fasterAPSPMatrix,
    runFasterAPSP,
    reset: resetFasterAPSP,
  } = useFasterAPSP(nodes, edges);

  // Auto-update edges input when edges change
  useEffect(() => {
    if (edges.length > 0) {
      setEdgesInput(generateEdgesText());
    }
  }, [edges, generateEdgesText]);

  // Reset selected start node if it no longer exists
  useEffect(() => {
    if (selectedStartNode && !nodes.has(selectedStartNode)) {
      setSelectedStartNode('');
    }
  }, [selectedStartNode, nodes]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        setMode(prev => prev === 'drag' ? 'create' : 'drag');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [setMode]);

  const resetAll = useCallback(() => {
    resetDijkstra();
    resetFloyd();
    resetJohnson();
    resetSlowAPSP();
    resetFasterAPSP();
    setCurrentAlgorithm('');
    setCurrentMatrix(null);
    setStatusMessage('System reset. Ready for new algorithm.');
  }, [resetDijkstra, resetFloyd, resetJohnson, resetSlowAPSP, resetFasterAPSP]);

  const handleParseEdges = useCallback(() => {
    parseEdges(edgesInput);
    setStatusMessage(`${edges.length} connections applied`);
  }, [parseEdges, edgesInput, edges.length]);

  const handleClearGraph = useCallback(() => {
    clearGraph();
    resetAll();
    setStatusMessage('Graph cleared');
  }, [clearGraph, resetAll]);

  const handleAddEdge = useCallback((from: string, to: string) => {
    setEdgeWeightModal({
      isOpen: true,
      from,
      to,
      defaultWeight: '1',
    });
  }, []);

  const handleConfirmEdgeWeight = useCallback((weight: string) => {
    if (edgeWeightModal.from && edgeWeightModal.to && !isNaN(Number(weight))) {
      addEdge(edgeWeightModal.from, edgeWeightModal.to, parseInt(weight), isDirectedMode);
      setStatusMessage(`Edge ${edgeWeightModal.from}->${edgeWeightModal.to} (weight: ${weight}) added`);
    }
  }, [edgeWeightModal, addEdge, isDirectedMode]);

  const handleNodeDoubleClick = useCallback((nodeName: string) => {
    const node = nodes.get(nodeName);
    if (node) {
      const connections = getNodeConnections(nodeName);
      setNodeEditModal({
        isOpen: true,
        nodeData: {
          name: node.name,
          color: node.color || '#e5e7eb',
          connections
        }
      });
    }
  }, [nodes, getNodeConnections]);

  const handleEdgeDoubleClick = useCallback((edge: { from: string; to: string; weight: number }) => {
    setEdgeEditModal({
      isOpen: true,
      edge
    });
  }, []);

  const handleNodeSave = useCallback((name: string, color: string) => {
    if (nodeEditModal.nodeData) {
      updateNode(nodeEditModal.nodeData.name, { name, color });
      setStatusMessage(`Node updated: ${name}`);
    }
  }, [nodeEditModal.nodeData, updateNode]);

  const handleNodeDelete = useCallback(() => {
    if (nodeEditModal.nodeData) {
      deleteNode(nodeEditModal.nodeData.name);
      setStatusMessage(`Node ${nodeEditModal.nodeData.name} deleted`);
    }
  }, [nodeEditModal.nodeData, deleteNode]);

  const handleModeToggle = useCallback(() => {
    const newMode = !isDirectedMode;
    switchGraphMode(newMode);
    setIsDirectedMode(newMode);
    setStatusMessage(`Switched to ${newMode ? 'directed' : 'undirected'} mode`);
  }, [isDirectedMode, switchGraphMode]);

  const handleRunDijkstra = useCallback((mode: 'step' | 'complete') => {
    if (!selectedStartNode) {
      setStatusMessage('Please select a start node first');
      return;
    }
    setCurrentAlgorithm('dijkstra');
    setCurrentMatrix(null);
    runDijkstra(selectedStartNode, mode);
    setStatusMessage(`Dijkstra started from ${selectedStartNode}`);
  }, [selectedStartNode, runDijkstra]);

  const handleRunFloydWarshall = useCallback((mode: 'step' | 'complete') => {
    if (nodes.size === 0) {
      setStatusMessage('Need at least one node to run Floyd-Warshall');
      return;
    }
    setCurrentAlgorithm('floyd-warshall');
    resetDijkstra();
    const result = runFloydWarshall(mode);
    setCurrentMatrix(result);
    setStatusMessage(mode === 'step' ? 'Floyd-Warshall step-by-step started' : 'Floyd-Warshall completed. Minimum distance matrix calculated.');
  }, [nodes.size, runFloydWarshall, resetDijkstra]);

  const handleRunJohnson = useCallback(() => {
    if (nodes.size === 0) {
      setStatusMessage('Need at least one node to run Johnson');
      return;
    }
    setCurrentAlgorithm('johnson');
    resetDijkstra();
    const result = runJohnson();
    setCurrentMatrix(result);
    setStatusMessage('Johnson completed. Minimum distance matrix calculated.');
  }, [nodes.size, runJohnson, resetDijkstra]);

  const handleRunSlowAPSP = useCallback(() => {
    if (nodes.size === 0) {
      setStatusMessage('Need at least one node to run SLOW-APSP');
      return;
    }
    setCurrentAlgorithm('slow-apsp');
    resetDijkstra();
    const result = runSlowAPSP();
    setCurrentMatrix(result);
    setStatusMessage(`SLOW-APSP completed in O(V⁴) time. ${nodes.size - 1} iterations executed.`);
  }, [nodes.size, runSlowAPSP, resetDijkstra]);

  const handleRunFasterAPSP = useCallback(() => {
    if (nodes.size === 0) {
      setStatusMessage('Need at least one node to run FASTER-APSP');
      return;
    }
    setCurrentAlgorithm('faster-apsp');
    resetDijkstra();
    const result = runFasterAPSP();
    setCurrentMatrix(result);
    setStatusMessage('FASTER-APSP completed in O(V³ log V) time using repeated squaring.');
  }, [nodes.size, runFasterAPSP, resetDijkstra]);

  const nodeOptions = Array.from(nodes.keys()).sort();

  return (
    <div className="w-full">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 text-center">
          <h1 className="text-4xl font-light mb-2">
            🚀 Graph Algorithm Visualizer
          </h1>
          <p className="text-blue-100">Create nodes, define connections, and execute multiple algorithms</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-0 min-h-[700px]">
          <div className="xl:col-span-3 p-8 bg-gray-50">
            <GraphCanvas
              ref={canvasRef}
              nodes={nodes}
              edges={edges}
              distances={distances}
              visited={visited}
              unvisited={unvisited}
              currentNode={currentNode}
              currentAlgorithm={currentAlgorithm}
              mode={mode}
              isDirectedMode={isDirectedMode}
              onAddNode={addNode}
              onAddEdge={handleAddEdge}
              onMoveNode={moveNode}
              onModeChange={setMode}
              onTempEdgeStart={setTempEdgeStart}
              onNodeDoubleClick={handleNodeDoubleClick}
              onEdgeDoubleClick={handleEdgeDoubleClick}
              tempEdgeStart={tempEdgeStart}
            />
          </div>

          <div className="p-6 bg-white border-l border-gray-200 overflow-y-auto max-h-[700px]">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    ⚙️ Graph Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Graph Type:</span>
                    <Button
                      onClick={handleModeToggle}
                      variant={isDirectedMode ? 'primary' : 'secondary'}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {isDirectedMode ? <ArrowRight className="w-4 h-4" /> : <ArrowUpDown className="w-4 h-4" />}
                      {isDirectedMode ? 'Directed' : 'Undirected'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    💡 Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1 text-black">
                  <div>• <strong>Left click:</strong> Create node or drag existing nodes</div>
                  <div>• <strong>Right click:</strong> Toggle edge creation mode</div>
                  <div>• <strong>Double click edge:</strong> Edit weight</div>
                  <div>• <strong>Press 'D':</strong> Toggle drag mode</div>
                  <div>• <strong>Syntax:</strong> A→B = 5 (directed), A↔B = 3 (bidirectional)</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    🔗 Define Connections
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={edgesInput}
                    onChange={(e) => setEdgesInput(e.target.value)}
                    placeholder="Examples:&#10;A->B = 4&#10;A<->E = 8&#10;B->C = 2"
                    className="min-h-[120px] font-mono text-sm text-black"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleParseEdges} className="flex-1">
                      Apply Connections
                    </Button>
                    <Button onClick={handleClearGraph} variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    🎯 Single Source Algorithms
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-black ">
                  <Select value={selectedStartNode} onValueChange={setSelectedStartNode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select start node" />
                    </SelectTrigger>
                    <SelectContent>
                      {nodeOptions.map((node) => (
                        <SelectItem key={node} value={node}>
                          {node}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        onClick={() => handleRunDijkstra('step')}
                        disabled={isRunning}
                        className="justify-center py-3"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Dijkstra Step by Step
                      </Button>
                      <Button
                        onClick={() => handleRunDijkstra('complete')}
                        disabled={isRunning}
                        className="justify-center py-3"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Dijkstra Complete
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={currentAlgorithm === 'floyd-warshall' ? floydNextStep : nextStep}
                        disabled={currentAlgorithm === 'floyd-warshall' ? floydStepIndex >= floydSteps.length : currentStepIndex >= algorithmSteps.length}
                        variant="outline"
                        className="py-2"
                      >
                        <StepForward className="w-4 h-4 mr-1" />
                        Next
                      </Button>
                      <Button onClick={resetAll} variant="outline" className="py-2">
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    🌐 All-Pairs Algorithms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        onClick={() => handleRunFloydWarshall('step')} 
                        variant="secondary" 
                        className="py-2"
                        disabled={floydIsRunning}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Floyd-W Step
                      </Button>
                      <Button 
                        onClick={() => handleRunFloydWarshall('complete')} 
                        variant="secondary" 
                        className="py-2"
                        disabled={floydIsRunning}
                      >
                        <Zap className="w-4 h-4 mr-1" />
                        Floyd-W Complete
                      </Button>
                    </div>
                    <Button onClick={handleRunJohnson} variant="secondary" className="py-3">
                      Johnson
                    </Button>
                    <Button onClick={handleRunSlowAPSP} variant="secondary" className="py-3">
                      SLOW-APSP
                    </Button>
                    <Button onClick={handleRunFasterAPSP} variant="secondary" className="py-3">
                      FASTER-APSP
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    📊 Current State
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm">{statusMessage}</div>
                  
                  {currentAlgorithm === 'dijkstra' && distances.size > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm animate-slide-down">
                      <div className="font-bold mb-2">Distances from source:</div>
                      {Array.from(distances.entries()).map(([node, distance]) => {
                        const status = visited.has(node) ? '✅' : currentNode === node ? '🔴' : '⏳';
                        return (
                          <div key={node}>
                            {status} {node}: {distance === Infinity ? '∞' : distance}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {currentAlgorithm === 'floyd-warshall' && floydSteps.length > 0 && floydStepIndex > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm animate-slide-down">
                      <div className="font-bold mb-2">Floyd-Warshall Progress:</div>
                      <div className="text-xs mb-2">Step {floydStepIndex} of {floydSteps.length}</div>
                      <div className="text-blue-600">
                        {floydSteps[floydStepIndex - 1]?.description}
                      </div>
                    </div>
                  )}

                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Full-width matrix display */}
        {currentMatrix && (
          <div className="p-8 border-t border-gray-200 animate-slide-down">
            <MatrixDisplay
              matrix={currentMatrix.matrix}
              nodes={currentMatrix.nodes}
              algorithmName={currentAlgorithm}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <InputModal
        isOpen={edgeWeightModal.isOpen}
        onClose={() => setEdgeWeightModal(prev => ({ ...prev, isOpen: false }))}
        title="Set Edge Weight"
        label={`Weight for edge ${edgeWeightModal.from} → ${edgeWeightModal.to}:`}
        placeholder="Enter weight (e.g., 5)"
        defaultValue={edgeWeightModal.defaultWeight}
        onConfirm={handleConfirmEdgeWeight}
      />

      <NodeEditModal
        isOpen={nodeEditModal.isOpen}
        onClose={() => setNodeEditModal({ isOpen: false, nodeData: null })}
        nodeData={nodeEditModal.nodeData}
        onSave={handleNodeSave}
        onDelete={handleNodeDelete}
        onDeleteEdge={deleteEdge}
      />

      <InputModal
        isOpen={edgeEditModal.isOpen}
        onClose={() => setEdgeEditModal({ isOpen: false, edge: null })}
        title="Edit Edge Weight"
        label={edgeEditModal.edge ? `Weight for edge ${edgeEditModal.edge.from} → ${edgeEditModal.edge.to}:` : ''}
        placeholder="Enter weight (e.g., 5)"
        defaultValue={edgeEditModal.edge?.weight.toString() || '1'}
        onConfirm={(weight) => {
          if (edgeEditModal.edge && !isNaN(Number(weight))) {
            updateEdge(edgeEditModal.edge.from, edgeEditModal.edge.to, parseInt(weight));
            setStatusMessage(`Edge weight updated to ${weight}`);
          }
        }}
      />
    </div>
  );
}