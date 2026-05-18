export default function LoadingScreen() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        /* Clay court tonunda blur overlay — videonun siyah bg'si bu renge karışır,
           sert siyah kare yerine sıcak bir his verir */
        background: "rgba(100, 30, 8, 0.45)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      <video
        src="/photos/tennis-ball.webm"
        autoPlay
        loop
        muted
        playsInline
        style={{
          /* min() ile hem büyük ekran hem mobil için iyi boyut */
          width: "min(380px, 88vw)",
          height: "auto",
          display: "block",
          /* screen blend: siyah pikseller arka plana karışır, sarı top parlar */
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}
