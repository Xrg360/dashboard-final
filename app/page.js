"use client"
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { io } from "socket.io-client";
import {

  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";
import EvacuationRoute from "@/components/ui/evac";

import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const socket = io("http://localhost:5000");

// Define node layout coordinates based on your floor plan
const NODE_LAYOUT = [
  [{ name: "Entrance" }, { name: "Verandah" }, { name: "Living Room" }],
  [{ name: "Stair Hall" }, { name: "Dining Space" }, { name: "Kitchen" }],
  [{ name: "Master Bedroom" }, { name: "Toilet" }, { name: "Balcony1" }],
  [{ name: "Bedroom" }, { name: "Toilet2" }, { name: "Balcony2" }]
];

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState({
    devices: [],
    exits: {},
    congestion: {},
    fireNodes: new Set(),
    exitCapacity: {},
    performance: {
      avgPathLength: 0,
      locationUpdates: 0,
      congestionRate: 0
    }
  });

  useEffect(() => {
    socket.on("update", (data) => {
      setMetrics(prev => ({
        ...data,
        fireNodes: new Set(data.fire_nodes || []),
        exitCapacity: data.exit_capacity || {},
        performance: {
          avgPathLength: calculateAvgPathLength(data.devices),
          locationUpdates: prev.performance.locationUpdates + 1,
          congestionRate: calculateCongestionRate(data.congestion)
        }
      }));
    });

    return () => socket.off("update");
  }, []);

  const calculateAvgPathLength = (devices) => {
    if (!devices.length) return 0;
    const total = devices.reduce((sum, device) =>
      sum + (device.shortest_path?.length || 0), 0);
    return (total / devices.length).toFixed(2);
  };

  const calculateCongestionRate = (congestion) => {
    const totalNodes = Object.keys(congestion).length;
    const congestedNodes = Object.values(congestion).filter(count => count > 0).length;
    return ((congestedNodes / totalNodes) * 100).toFixed(1);
  };

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Performance Metrics Header */}
      <Card className="col-span-3">
        <CardContent className="grid grid-cols-4 gap-4 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Active Devices</h3>
            <div className="text-2xl font-bold">{metrics.devices.length}</div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Avg Path Length</h3>
            <div className="text-2xl font-bold">{metrics.performance.avgPathLength}</div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Congestion Rate</h3>
            <div className="text-2xl font-bold">{metrics.performance.congestionRate}%</div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Fire Alerts</h3>
            <div className="text-2xl font-bold text-red-600">
              {metrics.fireNodes.size}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Building Layout Visualization */}
      <Card className="col-span-2">
        <CardContent>
          <h2 className="text-xl font-bold mb-4">Building Layout & Status</h2>
          <div className="grid grid-cols-3 gap-2">
            {NODE_LAYOUT.map((row, i) => (
              <div key={i} className="flex gap-2">
                {row.map((cell, j) => {
                  const nodeName = cell.name;
                  const isFire = metrics.fireNodes.has(nodeName);
                  const congestionLevel = metrics.congestion[nodeName] || 0;

                  return (
                    <div
                      key={nodeName}
                      className={`p-4 w-full text-center rounded-lg border
                        ${isFire ? 'bg-red-100 border-red-300' :
                          congestionLevel > 0 ? 'bg-yellow-100 border-yellow-300' :
                            'bg-green-50 border-green-200'}`}
                    >
                      <div className="text-sm font-medium">{nodeName}</div>
                      <div className="text-xs">
                        {isFire ? 'FIRE!' : congestionLevel > 0 ? `${congestionLevel} users` : 'Clear'}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Exit Capacity Visualization */}
      <Card>
        <CardContent>
          <h2 className="text-xl font-bold mb-4">Exit Capacity</h2>
          {Object.entries(metrics.exits).map(([exit, devices]) => (
            <div key={exit} className="mb-4">
              <div className="flex justify-between mb-1">
                <span>{exit}</span>
                <span className="text-sm">
                  {devices.length}/{metrics.exitCapacity[exit]}
                </span>
              </div>
              <Progress
                value={(devices.length / metrics.exitCapacity[exit]) * 100}
                className="h-2"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Active Fire Alerts */}
      {metrics.fireNodes.size > 0 && (
        <Card className="col-span-3 bg-red-50 border-red-200">
          <CardContent className="py-4">
            <h2 className="text-xl font-bold text-red-600 mb-2">Active Fire Alerts</h2>
            <div className="flex gap-2">
              {Array.from(metrics.fireNodes).map(node => (
                <span key={node} className="px-3 py-1 bg-red-100 rounded-full text-red-700">
                  🔥 {node}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device Activity Table */}
      <Card className="col-span-3">
        <CardContent>
          <h2 className="text-xl font-bold mb-4">Active Device Details</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Device ID</TableHead>
                <TableHead>Current Node</TableHead>
                <TableHead>Assigned Exit</TableHead>
                <TableHead>Path Progress</TableHead>
                <TableHead>Coordinates</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.devices.map(device => (
                <TableRow key={device.device_tag}>
                  <TableCell>{device.device_tag}</TableCell>
                  <TableCell>{device.user_location}</TableCell>
                  <TableCell>{device.assigned_exit}</TableCell>
                  <TableCell>
                    {device.shortest_path?.join(' → ') || 'N/A'}
                  </TableCell>
                  <TableCell>({device.coordinates.x.toFixed(1)}, {(device.coordinates.y).toFixed(1)})</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card className="col-span-3">
        <CardContent>
          <EvacuationRoute />
        </CardContent>
      </Card>
    </div>
  );
}