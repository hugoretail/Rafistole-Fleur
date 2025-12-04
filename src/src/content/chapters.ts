export type Chapter = {
  id: string;
  title: string;
  vibe: string;
  body: string;
  action: string;
  color: string;
  metric: string;
};

export const chapters: Chapter[] = [
  {
    id: "atelier",
    title: "Atelier Rafistole",
    vibe: "On reanime les machines, on ne les jette pas",
    body:
      "Clubs de reparations, pieces mutualisees, open source impose: une ecole peut devenir fablab de sobriete et publier ses hacks pour tout le reseau.",
    action: "Lancer une repair mob",
    color: "#f96fb0",
    metric: "-37% de rachat de materiel",
  },
  {
    id: "commons",
    title: "Communs Nerds",
    vibe: "Les services tournent local, ouverts, partageables",
    body:
      "Serveurs libres qui chauffent la serre, clouds en pair a pair, budgets visibles. Les eleves gouvernent leurs outils comme un potager numerique.",
    action: "Cartographier les services a relocaliser",
    color: "#8de36a",
    metric: "72% d'outils souverains",
  },
  {
    id: "fanfare",
    title: "Fanfare des Octets",
    vibe: "On transforme les datas en festival pedagogique",
    body:
      "Capteurs sobres, visualisations poetiques et defis coop: chaque economie d'energie declenche un sample lumineux dans la scene 3D.",
    action: "Programmer une fete low-tech",
    color: "#ffd369",
    metric: "13 ateliers inter-ecoles",
  },
];
