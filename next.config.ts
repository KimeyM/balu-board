import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // node-ical (y sus deps: rrule, luxon) no se empaquetan bien con Turbopack;
  // se dejan como require externo en el runtime del servidor.
  serverExternalPackages: ['node-ical'],
};

export default nextConfig;
