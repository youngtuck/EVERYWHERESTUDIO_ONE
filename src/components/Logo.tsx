interface LogoProps {
    size?: number;
    variant?: "dark" | "light";
    onClick?: () => void;
}

const Logo = ({ size = 20, variant = "dark", onClick }: LogoProps) => {
    const isDark = variant === "dark";
    const studioColor = isDark ? "#F5C642" : "#0D1B2A";

    return (
          <button
                  onClick={onClick}
                  type="button"
                  style={{
                            display: "flex",
                            alignItems: "baseline",
                            cursor: onClick ? "pointer" : "default",
                            letterSpacing: "-1px",
                            fontFamily: "'Afacad Flux', sans-serif",
                            background: "none",
                            border: "none",
                            padding: 0,
                            gap: 0,
                  }}
                >
                <span
                          style={{
                                      color: "#4A90D9",
                                      fontWeight: 700,
                                      fontSize: size,
                                      lineHeight: 1,
                                      textTransform: "uppercase" as const,
                          }}
                        >
                        EVERYWHERE
                </span>span>
                <span
                          style={{
                                      color: studioColor,
                                      fontWeight: 300,
                                      fontSize: size,
                                      lineHeight: 1,
                                      textTransform: "uppercase" as const,
                          }}
                        >
                        STUDIO
                  {size >= 24 && (
                                    <span
                                                  style={{
                                                                  color: studioColor,
                                                                  fontSize: size * 0.52,
                                                                  fontWeight: 400,
                                                                  verticalAlign: "top",
                                                                  marginLeft: -1,
                                                                  lineHeight: 1.5,
                                                  }}
                                                >
                                      {"\u2122"}
                                    </span>span>
                        )}
                </span>span>
          </button>button>
        );
};

export default Logo;</button>
