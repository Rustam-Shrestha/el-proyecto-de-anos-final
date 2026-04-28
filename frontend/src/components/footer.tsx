// @ts-nocheck
/**
 * Footer Component — Memoized
 *
 * Static footer. Wrapped in React.memo — never needs to re-render.
 */
import React, { memo } from "react";

const Footer = memo(() => {
  return (
    <footer className="w-full text-center text-[9px] font-secondary bg-white text-gray-500 py-2">
      <div>2024(c) Webapp, Rustam</div>
      <div>Terms. Privacy. Program Policy</div>
    </footer>
  );
});

export default Footer;
