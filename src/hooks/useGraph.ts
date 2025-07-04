import { useState, useCallback } from 'react';

export interface Node {
  x: number;
  y: number;
  name: string;
  color?: string;
}

export interface Edge {
  from: string;
  to: string;
  weight: number;
}

export type Mode = 'create' | 'edge' | 'edge_target' | 'drag';

export const useGraph = () => {
  const [nodes, setNodes] = useState<Map<string, Node>>(new Map());
  const [edges, setEdges] = useState<Edge[]>([]);
  const [mode, setMode] = useState<Mode>('create');
  const [tempEdgeStart, setTempEdgeStart] = useState<string | null>(null);

  const addNode = useCallback((x: number, y: number, customName?: string) => {
    const name = customName || String.fromCharCode(65 + nodes.size);
    setNodes(prev => new Map(prev).set(name, { x, y, name, color: '#e5e7eb' }));
    return name;
  }, [nodes.size]);

  const updateNode = useCallback((nodeName: string, updates: Partial<Node>) => {
    setNodes(prev => {
      const newNodes = new Map(prev);
      const existing = newNodes.get(nodeName);
      if (existing) {
        newNodes.set(nodeName, { ...existing, ...updates });
      }
      return newNodes;
    });
  }, []);

  const moveNode = useCallback((nodeName: string, x: number, y: number) => {
    updateNode(nodeName, { x, y });
  }, [updateNode]);

  const deleteNode = useCallback((nodeName: string) => {
    setNodes(prev => {
      const newNodes = new Map(prev);
      newNodes.delete(nodeName);
      return newNodes;
    });
    
    // Remove all edges connected to this node
    setEdges(prev => prev.filter(edge => edge.from !== nodeName && edge.to !== nodeName));
  }, []);

  const updateEdge = useCallback((from: string, to: string, newWeight: number) => {
    setEdges(prev => prev.map(edge => 
      edge.from === from && edge.to === to 
        ? { ...edge, weight: newWeight }
        : edge
    ));
  }, []);

  const deleteEdge = useCallback((from: string, to: string) => {
    setEdges(prev => prev.filter(edge => 
      !(edge.from === from && edge.to === to) && 
      !(edge.from === to && edge.to === from) // Also remove reverse edge if it exists
    ));
  }, []);

  const getNodeConnections = useCallback((nodeName: string) => {
    const connections: Array<{ node: string; weight: number; bidirectional: boolean }> = [];
    const processedPairs = new Set<string>();

    for (const edge of edges) {
      if (edge.from === nodeName || edge.to === nodeName) {
        const otherNode = edge.from === nodeName ? edge.to : edge.from;
        const pairKey = [nodeName, otherNode].sort().join('-');
        
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);
          
          // Check if there's a reverse edge (bidirectional)
          const reverseEdge = edges.find(e => 
            (e.from === otherNode && e.to === nodeName) || 
            (e.from === nodeName && e.to === otherNode && e !== edge)
          );
          
          const isBidirectional = !!reverseEdge && reverseEdge.weight === edge.weight;
          
          connections.push({
            node: otherNode,
            weight: edge.weight,
            bidirectional: isBidirectional
          });
        }
      }
    }

    return connections;
  }, [edges]);

  const switchGraphMode = useCallback((newIsDirected: boolean) => {
    if (newIsDirected) {
      // Converting from undirected to directed - split bidirectional edges
      const newEdges: Edge[] = [];
      const processedPairs = new Set<string>();

      for (const edge of edges) {
        const pairKey = [edge.from, edge.to].sort().join('-');
        
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);
          
          // Check if there's a reverse edge
          const reverseEdge = edges.find(e => e.from === edge.to && e.to === edge.from);
          
          if (reverseEdge) {
            // Bidirectional - create both directions
            newEdges.push(edge);
            newEdges.push(reverseEdge);
          } else {
            // Already directed
            newEdges.push(edge);
          }
        }
      }
      
      setEdges(newEdges);
    } else {
      // Converting from directed to undirected - merge directional edges
      const edgeMap = new Map<string, Edge>();
      
      for (const edge of edges) {
        const pairKey = [edge.from, edge.to].sort().join('-');
        const reverseKey = `${edge.to}-${edge.from}`;
        
        if (!edgeMap.has(pairKey)) {
          edgeMap.set(pairKey, edge);
        }
      }
      
      setEdges(Array.from(edgeMap.values()));
    }
  }, [edges]);

  const addEdge = useCallback((from: string, to: string, weight: number, isDirected = true) => {
    const edge: Edge = { from, to, weight };
    setEdges(prev => {
      const newEdges = [...prev, edge];
      // For undirected graphs, add the reverse edge if it doesn't exist
      if (!isDirected && !prev.find(e => e.from === to && e.to === from)) {
        newEdges.push({ from: to, to: from, weight });
      }
      return newEdges;
    });
  }, []);

  const generateEdgesText = useCallback(() => {
    const edgeMap = new Map<string, Edge>();
    
    // Group bidirectional edges
    for (const edge of edges) {
      const reverseKey = `${edge.to}-${edge.from}`;
      const forwardKey = `${edge.from}-${edge.to}`;
      
      if (edgeMap.has(reverseKey)) {
        // Found reverse edge, make it bidirectional
        const reverseEdge = edgeMap.get(reverseKey)!;
        if (reverseEdge.weight === edge.weight) {
          edgeMap.delete(reverseKey);
          edgeMap.set(forwardKey, { ...edge, bidirectional: true } as any);
        } else {
          edgeMap.set(forwardKey, edge);
        }
      } else {
        edgeMap.set(forwardKey, edge);
      }
    }

    const lines: string[] = [];
    for (const edge of edgeMap.values()) {
      const symbol = (edge as any).bidirectional ? '<->' : '->';
      lines.push(`${edge.from}${symbol}${edge.to} = ${edge.weight}`);
    }
    
    return lines.join('\n');
  }, [edges]);

  const clearGraph = useCallback(() => {
    setNodes(new Map());
    setEdges([]);
    setMode('create');
    setTempEdgeStart(null);
  }, []);

  const parseEdges = useCallback((input: string) => {
    const lines = input.split('\n').filter(line => line.trim());
    const newEdges: Edge[] = [];

    for (const line of lines) {
      // Bidirectional: A<->B = 5
      let match = line.match(/(\w+)\s*<->\s*(\w+)\s*=\s*(\d+)/);
      if (match) {
        const [, from, to, weight] = match;
        if (nodes.has(from) && nodes.has(to)) {
          const w = parseInt(weight);
          newEdges.push({ from, to, weight: w });
          newEdges.push({ from: to, to: from, weight: w });
        }
        continue;
      }

      // Directed: A->B = 5
      match = line.match(/(\w+)\s*->\s*(\w+)\s*=\s*(\d+)/);
      if (match) {
        const [, from, to, weight] = match;
        if (nodes.has(from) && nodes.has(to)) {
          const w = parseInt(weight);
          newEdges.push({ from, to, weight: w });
        }
      }
    }

    setEdges(newEdges);
  }, [nodes]);

  return {
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
  };
};