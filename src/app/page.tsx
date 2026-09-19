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
          minHeight: "100dvh",
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
        }}
      >
        <header
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid var(--border)",
            background: "rgba(7, 19, 28, 0.92)",
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
                  fontSize: 11,
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
                  fontSize: 20,
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
            background:
              "radial-gradient(circle at 45% 40%, rgba(29, 111, 138, 0.18), transparent 34%), #081722",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.22,
              backgroundImage:
                "linear-gradient(rgba(174,187,195,.09) 1px, transparent 1px), linear-gradient(90deg, rgba(174,187,195,.09) 1px, transparent 1px)",
              backgroundSize: "42px 42px",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: 18,
              left: 18,
              right: 18,
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                padding: "9px 12px",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-small)",
                background: "rgba(7, 19, 28, 0.82)",
                backdropFilter: "blur(10px)",
                fontSize: 12,
                color: "var(--text-secondary)",
              }}
            >
              Milford Haven · Dale · St Ann&apos;s Head · Freshwater West
            </div>

            <div
              style={{
                padding: "9px 12px",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-small)",
                background: "rgba(7, 19, 28, 0.82)",
                backdropFilter: "blur(10px)",
                fontSize: 12,
                color: "var(--chart-blue-bright)",
                fontWeight: 700,
              }}
            >
              HISTORY
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              padding: 24,
              textAlign: "center",
            }}
          >
            <div style={{ maxWidth: 430 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  margin: "0 auto 18px",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "50%",
                  border: "1px solid var(--border-strong)",
                  background: "rgba(29, 111, 138, 0.12)",
                  color: "var(--chart-blue-bright)",
                  fontSize: 27,
                }}
              >
                ≋
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 650,
                }}
              >
                Chart engine ready
              </h2>

              <p
                style={{
                  margin: "8px auto 0",
                  color: "var(--text-secondary)",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                The live MapLibre chart, bathymetry, catch markers and bass
                prediction layers will occupy this workspace.
              </p>
            </div>
          </div>

          <aside
            style={{
              position: "absolute",
              right: 18,
              bottom: 18,
              width: "min(300px, calc(100% - 36px))",
              padding: 14,
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-medium)",
              background: "var(--panel)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 14px 40px rgba(0,0,0,.24)",
            }}
          >
            <div
              style={{
                marginBottom: 10,
                color: "var(--text-muted)",
                fontSize: 10,
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
                gap: 8,
              }}
            >
              {intelligenceItems.map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: 10,
                    borderRadius: "var(--radius-small)",
                    background: "rgba(255,255,255,.035)",
                  }}
                >
                  <div
                    style={{
                      color: "var(--text-primary)",
                      fontSize: 12,
                      fontWeight: 650,
                    }}
                  >
                    {item.label}
                  </div>

                  <div
                    style={{
                      marginTop: 2,
                      color: "var(--text-muted)",
                      fontSize: 10,
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
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            borderTop: "1px solid var(--border)",
            background: "var(--background-raised)",
          }}
        >
          <button
            type="button"
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
