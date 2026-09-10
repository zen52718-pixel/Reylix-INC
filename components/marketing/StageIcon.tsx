/**
 * The six stage icons, from the handoff: 24×24 stroke-based outlines at a single 1.75
 * weight, drawn rather than borrowed from an emoji or a mixed icon set.
 */
const PATHS: Record<string, string> = {
  Discover: 'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.35-4.35',
  Capture: 'M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M3 7l9 4 9-4',
  Qualify: 'M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  Engage: 'M21 11.5a8.5 8.5 0 11-4.24 7.37L3 21l2.13-4.24A8.5 8.5 0 1121 11.5z',
  'Follow Up': 'M3 12a9 9 0 1 0 2.64-6.36M3 4v5h5M12 8v4l3 3',
  Convert: 'M5 21V3l14 9-14 9z',
};

export function StageIcon({ title }: { title: string }) {
  const d = PATHS[title];
  if (!d) return null;
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}
