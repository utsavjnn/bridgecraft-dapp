
import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center space-x-2">
      <div className="h-6 w-6 relative">
        <div className="absolute inset-0 bg-white rounded-sm rotate-45 scale-[0.7]"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-3 w-3 bg-bridge-bg rounded-sm rotate-45"></div>
        </div>
      </div>
      <span className="text-white font-bold tracking-wider">PHOTON</span>
    </div>
  );
};

export default Logo;
