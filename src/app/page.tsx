import GraphVisualizer from '@/components/GraphVisualizer';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-purple-800">
      <div className="container mx-auto px-4 py-8">
        <GraphVisualizer />
      </div>
    </main>
  );
}
