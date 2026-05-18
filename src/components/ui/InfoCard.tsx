export function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="sonaenhance-hex-card">
      <span className="sonaenhance-hex-card-icon">{icon}</span>
      <div className="sonaenhance-hex-card-text">
        <span className="sonaenhance-hex-card-label">{label}</span>
        <span className="sonaenhance-hex-card-value">{value}</span>
      </div>
    </div>
  )
}
