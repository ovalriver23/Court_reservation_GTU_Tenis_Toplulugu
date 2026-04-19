export default function CourtLines() {
  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        backgroundImage: "url('/court.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#A3472E",
      }}
      aria-hidden="true"
    />
  );
}
