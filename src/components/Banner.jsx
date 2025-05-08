import React from 'react';
import logo from '../assets/fia_logo.png';

export default function Banner({ title }) {
  return (
    <header className="bg-[rgb(1,44,95)] text-white h-16 flex items-center px-4">
      <img
        src={logo}
        alt="FIA Logo"
        className="h-11 w-auto mr-4 object-contain"
      />
      <h1 className="text-3xl font-FuturaPTMedium">{title}</h1>
    </header>
  );
}
