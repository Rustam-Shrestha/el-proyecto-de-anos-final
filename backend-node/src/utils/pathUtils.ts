import path from 'path';
import process from 'node:process';

export function getRelativePath(filePath: string): string {
  const relative = path.relative(process.cwd(), filePath);
  return relative.replace(/\\/g, '/');
}

export function resolveAbsolutePath(relativePath: string): string {
  if (path.isAbsolute(relativePath)) return relativePath;
  return path.resolve(process.cwd(), relativePath);
}
