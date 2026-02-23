/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#020617",
        surface: "#0f172a",
        panel: "#111827",
        line: "#1f2937",
        accent: "#38bdf8",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(56, 189, 248, 0.15), 0 20px 50px rgba(2, 6, 23, 0.55)"
      },
      backgroundImage: {
        grid: "radial-gradient(circle at center, rgba(148, 163, 184, 0.11) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};
