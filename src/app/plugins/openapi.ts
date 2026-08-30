import swagger from "@elysiajs/swagger";

export const openapiPlugin = swagger({
  path: "/swagger",
  documentation: {
    info: {
      title: "Masjid Display API",
      version: "2.0.0",
      description: "Backend API for the Masjid Display Android TV app.",
    },
  },
});
