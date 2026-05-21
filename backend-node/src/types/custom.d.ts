/* Global type shims to help editor resolve path aliases and node globals */

// Allow references to `process` in files without TS complaining in the editor
declare const process: any;

// Wildcard module declaration for path-alias imports like '@/config/..'
declare module '@/*' {
  const value: any;
  export = value;
}

// Also allow plain '@' prefix imports (if used anywhere)
declare module '@' {
  const value: any;
  export = value;
}
