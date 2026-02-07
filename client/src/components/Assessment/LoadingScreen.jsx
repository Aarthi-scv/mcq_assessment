import React from "react";
import { Cpu } from "lucide-react";

const LoadingScreen = () => {
  return (
    <div className="container flex flex-col justify-center items-center h-screen">
      <Cpu size={48} className="animate-spin text-primary mb-4" />
      <p className="text-secondary">Syncing logic gates...</p>
    </div>
  );
};

export default LoadingScreen;
