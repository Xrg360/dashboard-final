"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

// Connect to the backend
const socket = io("http://localhost:5000");

// Define fixed positions for each node
const NODE_POSITIONS = {
  Entrance: { x: 50, y: 50 },
  Verandah: { x: 150, y: 50 },
  "Living Room": { x: 250, y: 50 },
  "Dining Space": { x: 150, y: 150 },
  Kitchen: { x: 250, y: 150 },
  "Master Bedroom": { x: 50, y: 250 },
  Balcony1: { x: 250, y: 250 },
  Bedroom: { x: 50, y: 350 },
  Toilet2: { x: 150, y: 350 },
  Balcony2: { x: 250, y: 350 }
};

// Assign unique colors to users
const COLORS = ["#3498db", "#9b59b6", "#e67e22", "#1abc9c", "#e74c3c", "#2ecc71"];

export default function EvacuationRoute() {
  const [userPaths, setUserPaths] = useState([]);
  const [fireNodes, setFireNodes] = useState(["Kitchen", "Balcony1"]); // Example fire nodes

  useEffect(() => {
    socket.on("update", (data) => {
      const updatedPaths = data.devices
        .map((device, index) => ({
          user: device.device_tag,
          path: device.shortest_path || [],
          color: COLORS[index % COLORS.length]
        }))
        .filter(({ path }) => path.length > 1); // Remove empty paths

      setUserPaths(updatedPaths);
    });

    return () => socket.off("update");
  }, []);

  return (
    <div className="border p-6 bg-gray-50 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        🚀 Evacuation Paths (Per User)
      </h2>

      {/* Render a separate map for each user */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userPaths.length > 0 ? (
          userPaths.map(({ user, path, color }) => (
            <div key={user} className="p-4 border rounded-lg shadow-md bg-white">
              <h3 className="text-lg font-semibold mb-2 text-center" style={{ color }}>
                🔹 {user}
              </h3>
              {path.length > 1 ? (
                <svg width="350" height="350" className="border bg-gray-100 rounded-lg">
                  {/* Draw evacuation path */}
                  {path.map((node, i) => {
                    if (i === 0) return null;
                    const prevNode = path[i - 1];
                    const { x: x1, y: y1 } = NODE_POSITIONS[prevNode] || { x: 0, y: 0 };
                    const { x: x2, y: y2 } = NODE_POSITIONS[node] || { x: 0, y: 0 };

                    return (
                      <line
                        key={`${user}-${prevNode}-${node}`}
                        x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke={color} strokeWidth="3"
                        strokeLinecap="round"
                      />
                    );
                  })}

                  {/* Draw nodes */}
                  {path.map((node, i) => {
                    const { x, y } = NODE_POSITIONS[node] || { x: 0, y: 0 };
                    const isStart = i === 0;
                    const isEnd = i === path.length - 1;
                    const isFireNode = fireNodes.includes(node);

                    return (
                      <g key={`${user}-${node}`}>
                        {/* Node Circle */}
                        <circle
                          cx={x} cy={y} r="12"
                          fill={isFireNode ? "red" : isStart ? "yellow" : isEnd ? "green" : color}
                          stroke={isFireNode ? "black" : "white"}
                          strokeWidth="2"
                          className={isFireNode ? "animate-pulse" : ""}
                        />
                        {/* Node Label (below the node) */}
                        <text
                          x={x} y={y + 20}
                          fontSize="12"
                          fontWeight="bold"
                          fill="black"
                          textAnchor="middle"
                        >
                          {node}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              ) : (
                <p className="text-center text-gray-500 py-4">⚠️ No Path Available</p>
              )}
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-3 py-6">No devices found.</p>
        )}
      </div>
    </div>
  );
}
