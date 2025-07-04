import { useState, useCallback } from 'react';
import { Node, Edge } from './useGraph';

export const useJohnson = (nodes: Map<string, Node>, edges: Edge[]) => {
  const [matrix, setMatrix] = useState<number[][] | null>(null);

  const dijkstraSingleSource = useCallback((source: string) => {
    const distances = new Map<string, number>();
    const unvisited = new Set<string>();
    const adjacencyList = new Map<string, Array<{ node: string; weight: number }>>();

    // Build adjacency list
    for (const nodeName of nodes.keys()) {
      adjacencyList.set(nodeName, []);
      distances.set(nodeName, nodeName === source ? 0 : Infinity);
      unvisited.add(nodeName);
    }

    for (const edge of edges) {
      const neighbors = adjacencyList.get(edge.from) || [];
      neighbors.push({ node: edge.to, weight: edge.weight });
      adjacencyList.set(edge.from, neighbors);
    }

    while (unvisited.size > 0) {
      let minNode: string | null = null;
      let minDistance = Infinity;

      for (const node of unvisited) {
        if (distances.get(node)! < minDistance) {
          minDistance = distances.get(node)!;
          minNode = node;
        }
      }

      if (minNode === null || minDistance === Infinity) break;

      unvisited.delete(minNode);

      const neighbors = adjacencyList.get(minNode) || [];
      for (const neighbor of neighbors) {
        if (unvisited.has(neighbor.node)) {
          const newDistance = distances.get(minNode)! + neighbor.weight;
          if (newDistance < distances.get(neighbor.node)!) {
            distances.set(neighbor.node, newDistance);
          }
        }
      }
    }

    return distances;
  }, [nodes, edges]);

  const runJohnson = useCallback(() => {
    if (nodes.size === 0) return null;

    const nodeList = Array.from(nodes.keys()).sort();
    const n = nodeList.length;
    const INF = 999999;

    // Create distance matrix
    const dist = Array(n).fill(0).map(() => Array(n).fill(INF));

    // Run Dijkstra from each vertex (simplified version)
    for (let i = 0; i < n; i++) {
      const source = nodeList[i];
      const singleSourceDist = dijkstraSingleSource(source);

      for (let j = 0; j < n; j++) {
        const target = nodeList[j];
        const distance = singleSourceDist.get(target);
        dist[i][j] = distance === undefined || distance === Infinity ? INF : distance;
      }
    }

    const result = { matrix: dist, nodes: nodeList };
    setMatrix(dist);
    return result;
  }, [nodes, dijkstraSingleSource]);

  const reset = useCallback(() => {
    setMatrix(null);
  }, []);

  return {
    matrix,
    runJohnson,
    reset,
  };
};