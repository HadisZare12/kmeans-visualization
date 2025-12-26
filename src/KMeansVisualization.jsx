import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';

const KMeansVisualization = () => {
  const svgRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [centroids, setCentroids] = useState([]);
  const [k, setK] = useState(3);
  const [isRunning, setIsRunning] = useState(false);
  const [iteration, setIteration] = useState(0);
  const [converged, setConverged] = useState(false);
  
  const width = 600;
  const height = 250;
  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  // Initialize random points
  useEffect(() => {
    generatePoints();
  }, []);

  const generatePoints = () => {
    const newPoints = [];
    const clusters = 3;
    
    for (let i = 0; i < clusters; i++) {
      const centerX = Math.random() * (width - 200) + 100;
      const centerY = Math.random() * (height - 200) + 100;
      
      for (let j = 0; j < 30; j++) {
        newPoints.push({
          x: centerX + (Math.random() - 0.5) * 100,
          y: centerY + (Math.random() - 0.5) * 100,
          cluster: -1
        });
      }
    }
    
    setPoints(newPoints);
    setCentroids([]);
    setIteration(0);
    setConverged(false);
    setIsRunning(false);
  };

  const initializeCentroids = () => {
    const newCentroids = [];
    for (let i = 0; i < k; i++) {
      const randomPoint = points[Math.floor(Math.random() * points.length)];
      newCentroids.push({
        x: randomPoint.x + (Math.random() - 0.5) * 50,
        y: randomPoint.y + (Math.random() - 0.5) * 50
      });
    }
    setCentroids(newCentroids);
    setIteration(0);
    setConverged(false);
  };

  const distance = (p1, p2) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  const assignClusters = () => {
    const newPoints = points.map(point => {
      let minDist = Infinity;
      let cluster = 0;
      
      centroids.forEach((centroid, idx) => {
        const dist = distance(point, centroid);
        if (dist < minDist) {
          minDist = dist;
          cluster = idx;
        }
      });
      
      return { ...point, cluster };
    });
    
    setPoints(newPoints);
    return newPoints;
  };

  const updateCentroids = (clusteredPoints) => {
    const newCentroids = centroids.map((_, idx) => {
      const clusterPoints = clusteredPoints.filter(p => p.cluster === idx);
      
      if (clusterPoints.length === 0) {
        return centroids[idx];
      }
      
      const sumX = clusterPoints.reduce((sum, p) => sum + p.x, 0);
      const sumY = clusterPoints.reduce((sum, p) => sum + p.y, 0);
      
      return {
        x: sumX / clusterPoints.length,
        y: sumY / clusterPoints.length
      };
    });
    
    // Check convergence
    const hasConverged = centroids.every((c, idx) => 
      Math.abs(c.x - newCentroids[idx].x) < 0.1 && 
      Math.abs(c.y - newCentroids[idx].y) < 0.1
    );
    
    setCentroids(newCentroids);
    setConverged(hasConverged);
    
    if (hasConverged) {
      setIsRunning(false);
    }
  };

  const step = () => {
    if (centroids.length === 0) {
      initializeCentroids();
      return;
    }
    
    const clusteredPoints = assignClusters();
    updateCentroids(clusteredPoints);
    setIteration(prev => prev + 1);
  };

  useEffect(() => {
    let interval;
    if (isRunning && !converged) {
      interval = setInterval(() => {
        step();
      }, 800);
    }
    return () => clearInterval(interval);
  }, [isRunning, converged, points, centroids]);

  const handleStart = () => {
    if (centroids.length === 0) {
      initializeCentroids();
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    generatePoints();
  };

  const handleKChange = (delta) => {
    const newK = Math.max(2, Math.min(6, k + delta));
    setK(newK);
    setCentroids([]);
    setIteration(0);
    setConverged(false);
    setIsRunning(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-5">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-slate-700">
        <div className="mb-4">
          <h1 className="text-2xl text-white mb-1">K-Means Clustering</h1>
          <p className="text-slate-300">Watch the algorithm find optimal cluster centers in real-time</p>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-4 mb-4">
          <svg ref={svgRef} width={width} height={height} className="rounded-lg">
            {/* Draw connections from points to centroids */}
            {points.map((point, idx) => {
              if (point.cluster >= 0 && centroids[point.cluster]) {
                return (
                  <line
                    key={`line-${idx}`}
                    x1={point.x}
                    y1={point.y}
                    x2={centroids[point.cluster].x}
                    y2={centroids[point.cluster].y}
                    stroke={colors[point.cluster % colors.length]}
                    strokeWidth="0.5"
                    opacity="0.2"
                  />
                );
              }
              return null;
            })}
            
            {/* Draw points */}
            {points.map((point, idx) => (
              <circle
                key={`point-${idx}`}
                cx={point.x}
                cy={point.y}
                r="6"
                fill={point.cluster >= 0 ? colors[point.cluster % colors.length] : '#64748b'}
                opacity="0.8"
                className="transition-all duration-500"
              />
            ))}
            
            {/* Draw centroids */}
            {centroids.map((centroid, idx) => (
              <g key={`centroid-${idx}`}>
                <circle
                  cx={centroid.x}
                  cy={centroid.y}
                  r="15"
                  fill={colors[idx % colors.length]}
                  opacity="0.3"
                  className="transition-all duration-500"
                />
                <circle
                  cx={centroid.x}
                  cy={centroid.y}
                  r="8"
                  fill={colors[idx % colors.length]}
                  stroke="white"
                  strokeWidth="2"
                  className="transition-all duration-500"
                />
              </g>
            ))}
          </svg>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2">
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                {isRunning ? <Pause size={20} /> : <Play size={20} />}
                {isRunning ? 'Pause' : centroids.length === 0 ? 'Start' : 'Resume'}
              </button>
              
              <button
                onClick={step}
                disabled={isRunning || converged}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
              >
                Step
              </button>
              
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
              >
                <RotateCcw size={20} />
                Reset
              </button>
            </div>

            <div className="flex items-center gap-3 bg-slate-700/50 px-4 py-2 rounded-lg">
              <span className="text-slate-300 font-medium">K =</span>
              <button
                onClick={() => handleKChange(-1)}
                disabled={isRunning}
                className="p-1 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="text-white font-bold text-xl w-8 text-center">{k}</span>
              <button
                onClick={() => handleKChange(1)}
                disabled={isRunning}
                className="p-1 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white rounded transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm bg-slate-700/30 px-4 py-3 rounded-lg">
            <div className="text-slate-300">
              <span className="font-medium">Iteration:</span> 
              <span className="ml-2 text-white font-bold">{iteration}</span>
            </div>
            <div className="text-slate-300">
              <span className="font-medium">Status:</span> 
              <span className={`ml-2 font-bold ${converged ? 'text-emerald-400' : 'text-blue-400'}`}>
                {converged ? '✓ Converged' : centroids.length === 0 ? 'Ready' : 'Running'}
              </span>
            </div>
            <div className="text-slate-300">
              <span className="font-medium">Points:</span> 
              <span className="ml-2 text-white font-bold">{points.length}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-700/20 rounded-lg border border-slate-600/30">
          <h3 className="text-white font-semibold mb-2">How K-Means Works:</h3>
          <ol className="text-slate-300 text-sm space-y-1 list-decimal list-inside">
            <li>Initialize K random centroids (large circles)</li>
            <li>Assign each point to the nearest centroid (lines show connections)</li>
            <li>Move centroids to the center of their assigned points</li>
            <li>Repeat steps 2-3 until centroids stop moving (convergence)</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default KMeansVisualization;