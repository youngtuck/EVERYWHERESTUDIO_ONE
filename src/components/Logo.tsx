interface LogoProps {
  size?: "sm" | "md" | "lg";
  onDark?: boolean;
}

const Logo = ({ size = "md", onDark = false }: LogoProps) => {
  const sizes = {
    sm: { main: 13, tm: 8 },
    md: { main: 16, tm: 10 },
    lg: { main: 22, tm: 13 },
  };

  const s = sizes[size];

  return (
    <span
      style={{
        fontFamily: "'Afacad Flux', sans-serif",
        fontSize: s.main,
        letterSpacing: "-0.5px",
        lineHeight: 1,
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
    >
      <span style={{ fontWeight: 700, color: "#4A90D9" }}>EVERYWHERE</span>
      <span style={{ fontWeight: 300, color: "#F5C642" }}>STUDIO</span>
      <span
        style={{
          fontWeight: 400,
          color: "#F5C642",
          fontSize: s.tm,
          verticalAlign: "top",
          marginLeft: 1,
          lineHeight: 1.2,
        }}
      >
        ™
      </span>
    </span>
  );
};

export default Logo;
