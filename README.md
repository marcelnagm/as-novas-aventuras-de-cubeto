# As Novas Aventuras de Cubeto

Aplicativo móvel e web de **histórias interativas narradas** para crianças. Cada história é dividida em mapas e diálogos com áudio, personagens e ilustrações, e o app guarda localmente (AsyncStorage) o ponto em que o leitor parou.

Construído com **Expo / React Native** (iOS, Android e web) e um backend **Node + tRPC** com banco MySQL.

## Principais características

- Navegação por mapas (`data/maps.ts`) e histórias (`data/map1-stories.ts`, `data/map5-stories.ts`) com falas de personagens e áudio em `.wav`
- Interface com **NativeWind** (Tailwind para React Native), animações e feedback tátil
- Autenticação por OAuth e sessão com cookie
- API tipada ponta a ponta com **tRPC** + **TanStack Query**
- Persistência com **Drizzle ORM** (MySQL)

## Stack

| Camada | Tecnologias |
|---|---|
| App | Expo 54, React Native, Expo Router, NativeWind, expo-audio, expo-video |
| Servidor | Node.js, Express, tRPC, Drizzle ORM, MySQL (`mysql2`), `jose` |
| Qualidade | TypeScript, ESLint, Prettier, Vitest |

## Estrutura

```
app/          # telas (Expo Router): abas, OAuth, utilitários de dev
components/   # componentes de interface reutilizáveis
data/         # mapas, histórias e materiais
assets/       # imagens e áudios das histórias
server/       # API (tRPC), banco e armazenamento
drizzle/      # schema e migrações
tests/        # testes (Vitest)
```

## Como rodar

Pré-requisitos: Node.js, **pnpm** e um banco MySQL acessível.

```bash
pnpm install
# crie um .env com: DATABASE_URL, JWT_SECRET e OAUTH_SERVER_URL
pnpm db:push      # gera e aplica as migrações
pnpm dev          # sobe o servidor e o Metro (web em http://localhost:8081)
```

Outros comandos:

```bash
pnpm android      # abre no emulador/dispositivo Android
pnpm ios          # abre no simulador iOS
pnpm test         # testes
pnpm check        # checagem de tipos
pnpm build && pnpm start   # servidor em produção
```

## Autor

Marcel Fadel Nagm — [@marcelnagm](https://github.com/marcelnagm)
