"use client"
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { io } from "socket.io-client";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

const socket = io("http://localhost:5000"); // Adjust URL based on your server
const EXIT_CAPACITY = { Entrance: 10, Balcony1: 15, Balcony2: 8 }; // Define EXIT_CAPACITY

export default function MonitoringDashboard() {
  const [devices, setDevices] = useState([]);
  const [paths, setPaths] = useState([]);
  const [exits, setExits] = useState({});

  useEffect(() => {
    socket.on("update", (data) => {
      console.log(data);
      setDevices(data.devices);
      setPaths(data.paths);
      setExits(data.exits);
    });

    return () => {
      socket.off("update");
    };
  }, []);

  return (
    <div className="p-6 grid grid-cols-2 gap-6">
      <Card>
        <CardContent>
          <h2 className="text-xl font-bold">Device Movements</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={devices.map((d) => ({ x: d.coordinates.x, y: d.coordinates.y }))}>
              <XAxis dataKey="x" />
              <YAxis dataKey="y" />
              <Tooltip />
              <Line type="monotone" dataKey="y" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="text-xl font-bold">Exit Monitoring</h2>
          {Object.entries(exits).map(([exit, devices]) => (
            <p key={exit} className="text-gray-700">
              {exit}: {devices.length} / {EXIT_CAPACITY[exit]} occupied
            </p>
          ))}
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardContent>
          <h2 className="text-xl font-bold">Active Devices</h2>
          {devices.map((device) => (
            <p key={device.device_tag} className="text-gray-700">
              {device.device_tag} - {device.assigned_exit} (X: {device.coordinates.x}, Y: {device.coordinates.y})
            </p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}