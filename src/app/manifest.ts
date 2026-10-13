import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Organizador de comidas",
    short_name: "Comidas",
    description: "Planificá las comidas de la semana y armá la lista del súper.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF7EE",
    theme_color: "#FFF7EE",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
