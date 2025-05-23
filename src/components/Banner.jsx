import React from 'react';
import logo from '../assets/fia_logo.png';

export default function Banner({ title }) {
  return (
    <header className="bg-[rgb(1,44,95)] text-white h-16 flex items-center justify-between px-4">
      <div className="flex items-center">
        <img
          src={logo}
          alt="FIA Logo"
          className="h-11 w-auto mr-4 object-contain"
        />
        <h1 className="text-3xl font-FuturaPTMedium">{title}</h1>
      </div>
      <div className="text-white text-sm font-FuturaPTLight self-end pb-2 pr-2 opacity-80">
        v25.5.23
      </div>
    </header>
  );
}
