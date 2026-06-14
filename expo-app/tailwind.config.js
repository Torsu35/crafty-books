/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./src/**/*.{js,jsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Trust & Finance — navy + white
        background: "#F7F8FC",
        foreground: "#0F1F3D",
        card: "#FFFFFF",
        "card-foreground": "#0F1F3D",
        primary: "#0F1F3D",
        "primary-foreground": "#FFFFFF",
        "primary-glow": "#2A4A8A",
        secondary: "#E9EEF7",
        "secondary-foreground": "#0F1F3D",
        muted: "#EEF1F7",
        "muted-foreground": "#5B6A86",
        accent: "#2F5BC6",
        "accent-foreground": "#FFFFFF",
        success: "#10A35A",
        "success-foreground": "#FFFFFF",
        warning: "#E2A03F",
        "warning-foreground": "#3A2A00",
        destructive: "#D43A3A",
        "destructive-foreground": "#FFFFFF",
        border: "#DBE0EC",
        ring: "#2F5BC6"
      },
      fontFamily: {
        mono: ["Menlo", "monospace"]
      }
    }
  },
  plugins: []
};