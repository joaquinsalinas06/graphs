import { useState, useCallback } from 'react';
import { Node, Edge } from './useGraph';

export const useSlowAPSP = (nodes: Map<string, Node>, edges: Edge[]) => {
  const [matrix, setMatrix] = useState<number[][] | null>(null);

  const runSlowAPSP = useCallback(() => {
    if (nodes.size === 0) return null;

    const nodeList = Array.from(nodes.keys()).sort();
    const n = nodeList.length;
    const INF = 999999;

    // Initialize L(0)
    let L = Array(n).fill(0).map(() => Array(n).fill(INF));

    for (let i = 0; i < n; i++) {
      L[i][i] = 0;
    }

    for (const edge of edges) {
      const i = nodeList.indexOf(edge.from);
      const j = nodeList.indexOf(edge.to);
      if (i !== -1 && j !== -1) {
        L[i][j] = edge.weight;
      }
    }

    // SLOW-APSP: n-1 iterations
    for (let r = 1; r < n; r++) {
      const newL = Array(n).fill(0).map(() => Array(n).fill(INF));

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          newL[i][j] = L[i][j];
          for (let k = 0; k < n; k++) {
            if (L[i][k] + L[k][j] < newL[i][j]) {
              newL[i][j] = L[i][k] + L[k][j];
            }
          }
        }
      }
      L = newL;
    }

    const result = { matrix: L, nodes: nodeList };
    setMatrix(L);
    return result;
  }, [nodes, edges]);

  const reset = useCallback(() => {
    setMatrix(null);
  }, []);

  return {
    matrix,
    runSlowAPSP,
    reset,
  };
};