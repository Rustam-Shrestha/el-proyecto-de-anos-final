// @ts-nocheck
/**
 * Footer Component — Memoized
 *
 * Static footer. Wrapped in React.memo — never needs to re-render.
 */
import React, { memo } from "react";

const Footer = memo(() => {
  return (
    <footer
       className="w-full text-center text-[9px] font-secondary py-2 border-t"
       style={{
         backgroundColor: 'var(--surface-color)',
         color: 'var(--gray-column-text)',
         borderColor: 'var(--border-color)'
       }}
     >
       <div>2024(c) Webapp, Rustam</div>
       <nav aria-label="Footer" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 4 }}>
         <a href="/about">About</a>
         <a href="/contact">Contact</a>
         <a href="/pricing">Pricing</a>
         <a href="/terms">Terms</a>
         <a href="/privacy">Privacy</a>
         <a href="/docs">API docs</a>
       </nav>
     </footer>
   );
});

export default Footer;
