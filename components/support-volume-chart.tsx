export type VolumePoint = {
  label: string;
  vdiAuthentication: number;
  groupwareAccess: number;
};

function linePoints(values: number[], maximum: number, width = 720, height = 152) {
  const horizontalPadding = 10;
  const verticalPadding = 12;
  return values
    .map((value, index) => {
      const x = horizontalPadding + (index / Math.max(values.length - 1, 1)) * (width - horizontalPadding * 2);
      const y = height - verticalPadding - (value / maximum) * (height - verticalPadding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function SupportVolumeChart({ points }: { points: VolumePoint[] }) {
  const vdi = points.map((point) => point.vdiAuthentication);
  const groupware = points.map((point) => point.groupwareAccess);
  const maximum = Math.max(...vdi, ...groupware, 1);
  const tickIndexes = [0, Math.floor(points.length / 2), points.length - 1];

  return (
    <div className="support-volume-chart">
      <div className="chart-legend" aria-label="Chart legend">
        <span><i className="legend-line vdi" />VDI authentication</span>
        <span><i className="legend-line groupware" />Collaboration Platform access</span>
      </div>
      <svg viewBox="0 0 720 152" role="img" aria-labelledby="support-volume-title support-volume-description">
        <title id="support-volume-title">Daily support volume by cohort</title>
        <desc id="support-volume-description">Daily synthetic ticket counts for VDI authentication and Collaboration Platform access during the current 30-day measurement window.</desc>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line key={ratio} className="chart-gridline" x1="10" x2="710" y1={12 + ratio * 128} y2={12 + ratio * 128} />
        ))}
        <polyline className="chart-line groupware" points={linePoints(groupware, maximum)} />
        <polyline className="chart-line vdi" points={linePoints(vdi, maximum)} />
      </svg>
      <div className="chart-axis" aria-hidden="true">
        {tickIndexes.map((index) => <span key={points[index]?.label}>{points[index]?.label}</span>)}
      </div>
    </div>
  );
}
