export type Zone = "shell" | "catalog" | "account";

export const ZONES: Record<
  Zone,
  { label: string; port: number; href: string; nav: string }
> = {
  shell: { label: "shell", port: 3000, href: "/", nav: "Início" },
  catalog: {
    label: "catálogo",
    port: 3001,
    href: "/catalog/pt",
    nav: "Catálogo",
  },
  account: { label: "conta", port: 3002, href: "/account", nav: "Minha conta" },
};

export const ZONE_ORDER: Zone[] = ["shell", "catalog", "account"];
