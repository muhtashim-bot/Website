// Recreated wordmark for the prototype. Replace with the official SVG from the brand team before launch.
export function Logo({ className = '', tone = 'green' }: { className?: string; tone?: 'green' | 'white' }) {
  const ink = tone === 'white' ? '#FFFFFF' : '#5E852B';
  const leaf = tone === 'white' ? '#DDFF80' : '#88BB41';
  return (
    <svg viewBox="0 0 150 44" className={className} role="img" aria-label="iFarmer">
      <path d="M9.5 13.5c-1.2-5.6 2.4-10.4 9.8-11.6-0.4 6.8-4.2 10.9-9.8 11.6z" fill={leaf} />
      <path d="M9.6 13.2c2.2-3.2 4.6-5.6 7.6-7.6" stroke={tone === 'white' ? '#022B36' : '#F5F9EC'} strokeWidth="1.1" fill="none" strokeLinecap="round" />
      <rect x="6.6" y="17" width="5.6" height="20" rx="2.8" fill={ink} />
      <text x="16" y="37" fontFamily="Quicksand, ui-rounded, sans-serif" fontWeight="700" fontSize="31" letterSpacing="-0.5" fill={ink}>
        farmer
      </text>
    </svg>
  );
}
