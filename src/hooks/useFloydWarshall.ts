import { useState, useCallback } from 'react';
import { Node, Edge } from './useGraph';

interface FloydWarshallStep {
  k: number;
  i: number;
  j: number;
  matrix: number[][];
  description: string;
  updated: boolean;
}

export const useFloydWarshall = (nodes: Map<string, Node>, edges: Edge[]) => {
  const [matrix, setMatrix] = useState<number[][] | null>(null);
  const [algorithmSteps, setAlgorithmSteps] = useState<FloydWarshallStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const generateFloydWarshallSteps = useCallback(() => {
    if (nodes.size === 0) return [];

    const nodeList = Array.from(nodes.keys()).sort();
    const n = nodeList.length;
    const INF = 999999;
    const steps: FloydWarshallStep[] = [];

    // Initialize distance matrix
    const dist = Array(n).fill(0).map(() => Array(n).fill(INF));

    // Set diagonal to 0
    for (let i = 0; i < n; i++) {
      dist[i][i] = 0;
    }

    // Set edge weights
    for (const edge of edges) {
      const i = nodeList.indexOf(edge.from);
      const j = nodeList.indexOf(edge.to);
      if (i !== -1 && j !== -1) {
        dist[i][j] = edge.weight;
      }
    }

    // Initial step
    steps.push({
      k: -1,
      i: -1,
      j: -1,
      matrix: dist.map(row => [...row]),
      description: 'Initial matrix with direct edges',
      updated: false
    });

    // Floyd-Warshall algorithm with step tracking
    for (let k = 0; k < n; k++) {
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (dist[i][k] + dist[k][j] < dist[i][j]) {
            dist[i][j] = dist[i][k] + dist[k][j];
            
            steps.push({
              k,
              i,
              j,
              matrix: dist.map(row => [...row]),
              description: `Via ${nodeList[k]}: ${nodeList[i]} → ${nodeList[j]} = ${dist[i][j]}`,
              updated: true
            });
          }
        }
      }
      
      // Add step after each k iteration
      steps.push({
        k,
        i: -1,
        j: -1,
        matrix: dist.map(row => [...row]),
        description: `Completed iteration k=${k} (via ${nodeList[k]})`,
        updated: false
      });
    }

    return steps;
  }, [nodes, edges]);

  const runFloydWarshall = useCallback((mode: 'step' | 'complete' = 'complete') => {
    if (nodes.size === 0) return null;

    const nodeList = Array.from(nodes.keys()).sort();
    const steps = generateFloydWarshallSteps();
    setAlgorithmSteps(steps);
    setCurrentStepIndex(0);
    setIsRunning(true);

    if (mode === 'complete') {
      // Run all steps immediately
      setTimeout(() => {
        const finalStep = steps[steps.length - 1];
        if (finalStep) {
          setMatrix(finalStep.matrix);
          setCurrentStepIndex(steps.length);
        }
        setIsRunning(false);
      }, 100);
    } else {
      // Start with initial matrix
      if (steps.length > 0) {
        setMatrix(steps[0].matrix);
      }
      setIsRunning(false);
    }

    const result = { matrix: steps[steps.length - 1]?.matrix || [], nodes: nodeList };
    return result;
  }, [nodes, generateFloydWarshallSteps]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < algorithmSteps.length) {
      const step = algorithmSteps[currentStepIndex];
      setMatrix(step.matrix);
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStepIndex, algorithmSteps]);

  const reset = useCallback(() => {
    setMatrix(null);
    setAlgorithmSteps([]);
    setCurrentStepIndex(0);
    setIsRunning(false);
  }, []);

  return {
    matrix,
    algorithmSteps,
    currentStepIndex,
    isRunning,
    runFloydWarshall,
    nextStep,
    reset,
  };
};