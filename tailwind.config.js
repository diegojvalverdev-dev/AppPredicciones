/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        border: "var(--border)",
        primary: "var(--primary)",
        "muted-foreground": "var(--muted-foreground)",
        input: "var(--input)",
        ring: "var(--ring)",
      }
    }
  },
  plugins: [],
};
