import BassMap from "@/components/BassMap";

const intelligenceItems = [
  { label: "Tide", value: "Awaiting live data" },
  { label: "Sea", value: "Awaiting live data" },
  { label: "Wind", value: "Awaiting live data" },
  { label: "Light", value: "Awaiting live data" },
];

export default function HomePage() {
  return (
    <main className="app-shell">
      <section
        style={{
          height: "100dvh",
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          overflow: "hidden",
        }}
      >
        <header
          style={{
            position: "relative",
            zIndex: 20,
            padding: "14px 18px",
            borderBottom: "1px solid var(--border)",
            background: "rgba(7, 19, 28, 0.96)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  color: "var(--brass)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                Pembrokeshire Bass Intelligence
              </div>

              <h1
                style={{
                  margin: "3px 0 0",
                  fontSize: 19,
                  lineHeight: 1.1,
                  fontWeight: 700,
                }}
              >
                Milford Haven Bass Chart
              </h1>
            </div>

            <div
              title="Private fishing records are stored locally"
              style={{
                width: 10,
                height: 10,
                flex: "0 0 auto",
                borderRadius: "50%",
                background: "var(--sea-green)",
                boxShadow: "0 0 12px rgba(78, 136, 123, 0.65)",
              }}
            />
          </div>
        </header>

        <section
          style={{
            position: "relative",
            minHeight: 0,
            overflow: "hidden",
            background: "#07131c",
          }}
        >
          <BassMap />

          <div
            style={{
              position: "absolute",
              zIndex: 10,
              top: 14,
              left: 14,
              maxWidth: "calc(100% - 90px)",
              padding: "8px 11px",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-small)",
              background: "rgba(7, 19, 28, 0.84)",
              backdropFilter: "blur(10px)",
              color: "var(--text-secondary)",
              fontSize: 11,
              pointerEvents: "none",
              boxShadow: "0 6px 20px rgba(0,0,0,.18)",
            }}
          >
            Milford Haven · Dale · St Ann&apos;s Head · Freshwater West
          </div>

          <div
            style={{
              position: "absolute",
              zIndex: 10,
              top: 58,
              left: 14,
              padding: "7px 10px",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-small)",
              background: "rgba(7, 19, 28, 0.84)",
              backdropFilter: "blur(10px)",
              color: "var(--chart-blue-bright)",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.12em",
              pointerEvents: "none",
            }}
          >
            HISTORY
          </div>

          <aside
            style={{
              position: "absolute",
              zIndex: 10,
              right: 14,
              bottom: 14,
              width: "min(300px, calc(100% - 28px))",
              padding: 12,
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-medium)",
              background: "rgba(7, 19, 28, 0.9)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 14px 40px rgba(0,0,0,.3)",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                marginBottom: 9,
                color: "var(--text-muted)",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Environmental intelligence
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 7,
              }}
            >
              {intelligenceItems.map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: "8px 9px",
                    borderRadius: "var(--radius-small)",
                    background: "rgba(255,255,255,.04)",
                  }}
                >
                  <div
                    style={{
                      color: "var(--text-primary)",
                      fontSize: 11,
                      fontWeight: 650,
                    }}
                  >
                    {item.label}
                  </div>

                  <div
                    style={{
                      marginTop: 2,
                      color: "var(--text-muted)",
                      fontSize: 9,
                    }}
                  >
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <nav
          aria-label="Primary"
          style={{
            position: "relative",
            zIndex: 20,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderTop: "1px solid var(--border)",
            background: "var(--background-raised)",
          }}
        >
          <button
            type="button"
            aria-pressed="true"
            style={{
              minHeight: 58,
              border: 0,
              borderRight: "1px solid var(--border)",
              background: "rgba(29, 111, 138, 0.13)",
              color: "var(--chart-blue-bright)",
              fontWeight: 750,
              letterSpacing: "0.08em",
              cursor: "pointer",
            }}
          >
            HISTORY
          </button>

          <button
            type="button"
            aria-pressed="false"
            style={{
              minHeight: 58,
              border: 0,
              background: "transparent",
              color: "var(--text-secondary)",
              fontWeight: 750,
              letterSpacing: "0.08em",
              cursor: "pointer",
            }}
          >
            PREDICT
          </button>
        </nav>
      </section>
    </main>
  );
}
