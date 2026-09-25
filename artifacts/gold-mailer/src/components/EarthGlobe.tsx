/**
 * EarthGlobe — a slowly rotating night-side earth globe with city lights.
 * Dark sphere (#15112A) on a light purple (#F8F5FF) backdrop, centered.
 * 420px on desktop, 300px on mobile. No cards or text overlaid on the globe.
 */
export function EarthGlobe() {
  return (
    <div className="earth-globe-wrap">
      <div className="earth-globe" role="img" aria-label="Rotating earth globe with night lights" />
      <div className="earth-globe-caption">
        <p className="earth-globe-title">~90% completed within 5 minutes</p>
        <p className="earth-globe-median">MEDIAN DELIVERY TIME &bull; ~1 min</p>
        <p className="earth-globe-foot">Measured creation to delivery &middot; last 90 days</p>
      </div>
    </div>
  );
}

export default EarthGlobe;
