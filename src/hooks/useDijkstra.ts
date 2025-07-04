import { useState, useCallback } from 'react';
import { Node, Edge } from './useGraph';

interface DijkstraStep {
  type: 'select' | 'update';
  node: string;
  neighbor?: string;
  oldDistance?: number;
  newDistance?: number;
  distances: Map<string, number>;
  unvisited: Set<string>;
  visited: Set<string>;
  description: string;
}

export const useDijkstra = (nodes: Map<string, Node>, edges: Edge[]) => {
  const [distances, setDistances] = useState<Map<string, number>>(new Map());
  const [previous, setPrevious] = useState<Map<string, string | null>>(new Map());
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [unvisited, setUnvisited] = useState<Set<string>>(new Set());
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [algorithmSteps, setAlgorithmSteps] = useState<DijkstraStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const buildAdjacencyList = useCallback(() => {
    const adjacencyList = new Map<string, Array<{ node: string; weight: number }>>();
    
    for (const nodeName of nodes.keys()) {
      adjacencyList.set(nodeName, []);
    }
    
    for (const edge of edges) {
      const neighbors = adjacencyList.get(edge.from) || [];
      neighbors.push({ node: edge.to, weight: edge.weight });
      adjacencyList.set(edge.from, neighbors);
    }
    
    return adjacencyList;
  }, [nodes, edges]);

  const generateDijkstraSteps = useCallback((startNode: string) => {
    const adjacencyList = buildAdjacencyList();
    const tempDistances = new Map<string, number>();
    const tempUnvisited = new Set<string>();
    const tempVisited = new Set<string>();
    const steps: DijkstraStep[] = [];

    // Initialize
    for (const nodeName of nodes.keys()) {
      tempDistances.set(nodeName, nodeName === startNode ? 0 : Infinity);
      tempUnvisited.add(nodeName);
    }

    while (tempUnvisited.size > 0) {
      let minNode: string | null = null;
      let minDistance = Infinity;

      for (const node of tempUnvisited) {
        if (tempDistances.get(node)! < minDistance) {
          minDistance = tempDistances.get(node)!;
          minNode = node;
        }
      }

      if (minNode === null || minDistance === Infinity) break;

      steps.push({
        type: 'select',
        node: minNode,
        distances: new Map(tempDistances),
        unvisited: new Set(tempUnvisited),
        visited: new Set(tempVisited),
        description: `Selecting node ${minNode} with distance ${minDistance === Infinity ? '∞' : minDistance}`,
      });

      tempUnvisited.delete(minNode);
      tempVisited.add(minNode);

      const neighbors = adjacencyList.get(minNode) || [];
      for (const neighbor of neighbors) {
        if (tempUnvisited.has(neighbor.node)) {
          const newDistance = tempDistances.get(minNode)! + neighbor.weight;
          if (newDistance < tempDistances.get(neighbor.node)!) {
            const oldDistance = tempDistances.get(neighbor.node)!;
            tempDistances.set(neighbor.node, newDistance);

            steps.push({
              type: 'update',
              node: minNode,
              neighbor: neighbor.node,
              oldDistance,
              newDistance,
              distances: new Map(tempDistances),
              unvisited: new Set(tempUnvisited),
              visited: new Set(tempVisited),
              description: `Updating ${neighbor.node}: ${oldDistance === Infinity ? '∞' : oldDistance} → ${newDistance}`,
            });
          }
        }
      }
    }

    return steps;
  }, [nodes, buildAdjacencyList]);

  const runDijkstra = useCallback((startNode: string, mode: 'step' | 'complete') => {
    setIsRunning(true);
    setCurrentStepIndex(0);
    
    const steps = generateDijkstraSteps(startNode);
    setAlgorithmSteps(steps);

    // Initialize state
    const initialDistances = new Map<string, number>();
    const initialUnvisited = new Set<string>();
    const initialVisited = new Set<string>();

    for (const nodeName of nodes.keys()) {
      initialDistances.set(nodeName, nodeName === startNode ? 0 : Infinity);
      initialUnvisited.add(nodeName);
    }

    setDistances(initialDistances);
    setUnvisited(initialUnvisited);
    setVisited(initialVisited);
    setCurrentNode(null);

    if (mode === 'complete') {
      // Run all steps immediately
      setTimeout(() => {
        const finalStep = steps[steps.length - 1];
        if (finalStep) {
          setDistances(finalStep.distances);
          setUnvisited(finalStep.unvisited);
          setVisited(finalStep.visited);
          setCurrentNode(finalStep.node);
          setCurrentStepIndex(steps.length);
        }
        setIsRunning(false);
      }, 100);
    } else {
      setIsRunning(false);
    }
  }, [nodes, generateDijkstraSteps]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < algorithmSteps.length) {
      const step = algorithmSteps[currentStepIndex];
      
      setDistances(step.distances);
      setUnvisited(step.unvisited);
      setVisited(step.visited);
      setCurrentNode(step.node);
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStepIndex, algorithmSteps]);

  const reset = useCallback(() => {
    setDistances(new Map());
    setPrevious(new Map());
    setVisited(new Set());
    setUnvisited(new Set());
    setCurrentNode(null);
    setAlgorithmSteps([]);
    setCurrentStepIndex(0);
    setIsRunning(false);
  }, []);

  return {
    distances,
    previous,
    visited,
    unvisited,
    currentNode,
    algorithmSteps,
    currentStepIndex,
    isRunning,
    runDijkstra,
    nextStep,
    reset,
  };
};