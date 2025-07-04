import React, { forwardRef, useEffect, useRef, useCallback } from 'react';

interface Node {
  x: number;
  y: number;
  name: string;
  color?: string;
}

interface Edge {
  from: string;
  to: string;
  weight: number;
}

interface GraphCanvasProps {
  nodes: Map<string, Node>;
  edges: Edge[];
  distances: Map<string, number>;
  visited: Set<string>;
  unvisited: Set<string>;
  currentNode: string | null;
  currentAlgorithm: string;
  mode: 'create' | 'edge' | 'edge_target' | 'drag';
  isDirectedMode: boolean;
  onAddNode: (x: number, y: number) => string;
  onAddEdge: (from: string, to: string) => void;
  onMoveNode: (nodeName: string, x: number, y: number) => void;
  onModeChange: (mode: 'create' | 'edge' | 'edge_target' | 'drag') => void;
  onTempEdgeStart: (node: string | null) => void;
  onNodeDoubleClick: (nodeName: string) => void;
  onEdgeDoubleClick: (edge: Edge) => void;
  tempEdgeStart: string | null;
}

export const GraphCanvas = forwardRef<HTMLCanvasElement, GraphCanvasProps>(
  ({ 
    nodes, 
    edges, 
    distances, 
    visited, 
    unvisited, 
    currentNode, 
    currentAlgorithm, 
    mode, 
    isDirectedMode,
    onAddNode, 
    onAddEdge, 
    onMoveNode,
    onModeChange, 
    onTempEdgeStart,
    onNodeDoubleClick,
    onEdgeDoubleClick,
    tempEdgeStart 
  }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const [dragState, setDragState] = React.useState<{
      isDragging: boolean;
      dragNode: string | null;
      startPos: { x: number; y: number } | null;
    }>({ isDragging: false, dragNode: null, startPos: null });

    const getModeText = () => {
      switch (mode) {
        case 'create':
          return `Mode: Create Nodes (${isDirectedMode ? 'Directed' : 'Undirected'})`;
        case 'edge':
          return 'Mode: Create Edge - Select source node';
        case 'edge_target':
          return 'Mode: Create Edge - Select target node';
        case 'drag':
          return 'Mode: Drag Nodes';
        default:
          return `Mode: Create Nodes (${isDirectedMode ? 'Directed' : 'Undirected'})`;
      }
    };

    const getModeColor = () => {
      switch (mode) {
        case 'create':
          return 'rgba(59, 130, 246, 0.9)';
        case 'edge':
          return 'rgba(34, 197, 94, 0.9)';
        case 'edge_target':
          return 'rgba(245, 158, 11, 0.9)';
        case 'drag':
          return 'rgba(168, 85, 247, 0.9)';
        default:
          return 'rgba(59, 130, 246, 0.9)';
      }
    };

    const getNodeAt = useCallback((x: number, y: number): string | null => {
      for (const [name, node] of nodes) {
        const dx = x - node.x;
        const dy = y - node.y;
        if (dx * dx + dy * dy <= 25 * 25) {
          return name;
        }
      }
      return null;
    }, [nodes]);

    const getEdgeAt = useCallback((x: number, y: number): Edge | null => {
      for (const edge of edges) {
        const fromNode = nodes.get(edge.from);
        const toNode = nodes.get(edge.to);
        if (fromNode && toNode) {
          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2;
          const dx = x - midX;
          const dy = y - midY;
          if (dx * dx + dy * dy <= 20 * 20) {
            return edge;
          }
        }
      }
      return null;
    }, [edges, nodes]);


    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const clickedNode = getNodeAt(x, y);

      if (e.button === 0) { // Left click
        if (mode === 'create') {
          if (clickedNode) {
            // Start dragging
            setDragState({
              isDragging: true,
              dragNode: clickedNode,
              startPos: { x, y }
            });
          } else {
            onAddNode(x, y);
          }
        } else if (mode === 'edge') {
          if (clickedNode) {
            onTempEdgeStart(clickedNode);
            onModeChange('edge_target');
          }
        } else if (mode === 'edge_target') {
          if (clickedNode && clickedNode !== tempEdgeStart) {
            onAddEdge(tempEdgeStart!, clickedNode);
          }
          onModeChange('create');
          onTempEdgeStart(null);
        }
      }
    }, [mode, getNodeAt, onAddNode, onTempEdgeStart, onModeChange, tempEdgeStart, onAddEdge]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!dragState.isDragging || !dragState.dragNode) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      onMoveNode(dragState.dragNode, x, y);
    }, [dragState, onMoveNode]);

    const handleMouseUp = useCallback(() => {
      setDragState({
        isDragging: false,
        dragNode: null,
        startPos: null
      });
    }, []);

    const handleRightClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const newMode = mode === 'edge' ? 'create' : 'edge';
      onModeChange(newMode);
      onTempEdgeStart(null);
    }, [mode, onModeChange, onTempEdgeStart]);

    const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const clickedNode = getNodeAt(x, y);
      const edge = getEdgeAt(x, y);

      if (clickedNode) {
        onNodeDoubleClick(clickedNode);
      } else if (edge) {
        onEdgeDoubleClick(edge);
      }
    }, [getNodeAt, getEdgeAt, onNodeDoubleClick, onEdgeDoubleClick]);

    const draw = useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw edges
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 2;

      for (const edge of edges) {
        const fromNode = nodes.get(edge.from);
        const toNode = nodes.get(edge.to);

        if (fromNode && toNode) {
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.stroke();

          // Draw arrow
          const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
          const arrowLength = 15;
          const arrowAngle = Math.PI / 6;

          const endX = toNode.x - 25 * Math.cos(angle);
          const endY = toNode.y - 25 * Math.sin(angle);

          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - arrowLength * Math.cos(angle - arrowAngle),
            endY - arrowLength * Math.sin(angle - arrowAngle)
          );
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - arrowLength * Math.cos(angle + arrowAngle),
            endY - arrowLength * Math.sin(angle + arrowAngle)
          );
          ctx.stroke();

          // Draw weight
          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2;
          ctx.fillStyle = '#374151';
          ctx.font = 'bold 14px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(edge.weight.toString(), midX, midY - 8);
        }
      }

      // Draw nodes
      for (const [name, node] of nodes) {
        // Determine node color based on algorithm state
        let fillColor = node.color || '#e5e7eb';
        let strokeColor = '#6b7280';

        if (currentNode === name) {
          fillColor = '#ef4444';
          strokeColor = '#dc2626';
        } else if (visited.has(name)) {
          fillColor = '#10b981';
          strokeColor = '#059669';
        } else if (unvisited.has(name)) {
          fillColor = '#3b82f6';
          strokeColor = '#2563eb';
        } else if (dragState.dragNode === name) {
          fillColor = '#a855f7';
          strokeColor = '#9333ea';
        }

        ctx.fillStyle = fillColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 25, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        // Draw node label
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(name, node.x, node.y + 6);

        // Draw distance if Dijkstra is running
        if (currentAlgorithm === 'dijkstra' && distances.has(name)) {
          const distance = distances.get(name)!;
          ctx.fillStyle = '#6366f1';
          ctx.font = 'bold 12px Inter, sans-serif';
          ctx.fillText(
            distance === Infinity ? '∞' : distance.toString(),
            node.x,
            node.y - 35
          );
        }
      }
    }, [nodes, edges, distances, visited, unvisited, currentNode, currentAlgorithm, dragState]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      contextRef.current = ctx;

      // Set canvas size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      draw();
    }, [draw]);

    useEffect(() => {
      draw();
    }, [draw]);

    return (
      <div className="relative">
        <div
          className="absolute top-3 right-3 px-4 py-2 rounded-full text-white text-sm font-semibold z-10 transition-colors duration-300"
          style={{ backgroundColor: getModeColor() }}
        >
          {getModeText()}
        </div>
        
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onContextMenu={handleRightClick}
          onDoubleClick={handleDoubleClick}
          className="border-2 border-dashed border-gray-300 rounded-2xl bg-white cursor-crosshair shadow-lg hover:border-blue-400 hover:scale-[1.002] transition-all duration-300"
          style={{ width: '100%', height: '600px' }}
        />
      </div>
    );
  }
);

GraphCanvas.displayName = 'GraphCanvas';