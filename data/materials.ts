export type StoryMaterial = {
  personagem?: number;
  acessorios?: number;
};

/** Imagens de personagem e acessórios, indexadas pelo id da história (ex.: "m2h1"). */
export const storyMaterials: Record<string, StoryMaterial> = {
  m1h1: {
    personagem: require("../assets/material/m1h1-personagem.jpg"),
    acessorios: require("../assets/material/m1h1-acessorios.jpg"),
  },
  m1h2: {
    personagem: require("../assets/material/m1h2-personagem.jpg"),
    acessorios: require("../assets/material/m1h2-acessorios.jpg"),
  },
  m1h3: {
    personagem: require("../assets/material/m1h3-personagem.jpg"),
  },
  m1h4: {
    personagem: require("../assets/material/m1h4-personagem.jpg"),
  },
  m2h1: {
    personagem: require("../assets/material/m2h1-personagem.jpg"),
    acessorios: require("../assets/material/m2h1-acessorios.jpg"),
  },
  m2h2: {
    personagem: require("../assets/material/m2h2-personagem.jpg"),
    acessorios: require("../assets/material/m2h2-acessorios.jpg"),
  },
  m3h1: {
    personagem: require("../assets/material/m3h1-personagem.jpg"),
    acessorios: require("../assets/material/m3h1-acessorios.jpg"),
  },
  m3h2: {
    personagem: require("../assets/material/m3h2-personagem.jpg"),
    acessorios: require("../assets/material/m3h2-acessorios.jpg"),
  },
  m3h3: {
    personagem: require("../assets/material/m3h3-personagem.jpg"),
    acessorios: require("../assets/material/m3h3-acessorios.jpg"),
  },
  m3h4: {
    personagem: require("../assets/material/m3h4-personagem.jpg"),
    acessorios: require("../assets/material/m3h4-acessorios.jpg"),
  },
  m4h1: {
    personagem: require("../assets/material/m4h1-personagem.jpg"),
    acessorios: require("../assets/material/m4h1-acessorios.jpg"),
  },
  m4h2: {
    personagem: require("../assets/material/m4h2-personagem.jpg"),
    acessorios: require("../assets/material/m4h2-acessorios.jpg"),
  },
  m4h3: {
    personagem: require("../assets/material/m4h3-personagem.jpg"),
    acessorios: require("../assets/material/m4h3-acessorios.jpg"),
  },
  m4h4: {
    personagem: require("../assets/material/m4h4-personagem.jpg"),
    acessorios: require("../assets/material/m4h4-acessorios.jpg"),
  },
  m5h1: {
    personagem: require("../assets/material/m5h1-personagem.jpg"),
    acessorios: require("../assets/material/m5h1-acessorios.jpg"),
  },
  m5h2: {
    personagem: require("../assets/material/m5h2-personagem.jpg"),
    acessorios: require("../assets/material/m5h2-acessorios.jpg"),
  },
  m5h3: {
    personagem: require("../assets/material/m5h3-personagem.jpg"),
    acessorios: require("../assets/material/m5h3-acessorios.jpg"),
  },
  m5h4: {
    personagem: require("../assets/material/m5h4-personagem.jpg"),
    acessorios: require("../assets/material/m5h4-acessorios.jpg"),
  },
};
