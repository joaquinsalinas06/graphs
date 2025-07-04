import { useState, useCallback } from 'react';
import { Node, Edge } from './useGraph';

export const useFasterAPSP = (nodes: Map<string, Node>, edges: Edge[]) => {
  const [matrix, setMatrix] = useState<number[][] | null>(null);

  const matrixMultiply = useCallback((A: number[][], B: number[][], INF: number) => {
    const n = A.length;
    const C = Array(n).fill(0).map(() => Array(n).fill(INF));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        for (let k = 0; k < n; k++) {
          C[i][j] = Math.min(C[i][j], A[i][k] + B[k][j]);
        }
      }
    }

    return C;
  }, []);

  const runFasterAPSP = useCallback(() => {
    if (nodes.size === 0) return null;

    const nodeList = Array.from(nodes.keys()).sort();
    const n = nodeList.length;
    const INF = 999999;

    // Initialize L(1) = W
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

    // FASTER-APSP: repeated squaring
    let r = 1;
    while (r < n - 1) {
      const newL = matrixMultiply(L, L, INF);
      L = newL;
      r = 2 * r;
    }

    const result = { matrix: L, nodes: nodeList };
    setMatrix(L);
    return result;
  }, [nodes, edges, matrixMultiply]);

  const reset = useCallback(() => {
    setMatrix(null);
  }, []);

  return {
    matrix,
    runFasterAPSP,
    reset,
  };
};