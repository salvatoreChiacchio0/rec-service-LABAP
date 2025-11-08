# Recommendation Service Lab AP

Servizio di raccomandazione per SwapIt che utilizza Neo4j e Kafka per fornire swap consigliati basati su analisi di grafo.

> 📖 **Setup rapido**: Vedi [SETUP.md](SETUP.md) per istruzioni dettagliate di installazione

## ⚠️ Prerequisiti

Prima di avviare questo servizio, assicurati che siano **già in esecuzione**:
- ✅ **Neo4j** (porta 7687)
- ✅ **Kafka** (porta 9092)
- ✅ **Zookeeper** (porta 2181)

Questi servizi vengono normalmente avviati dal progetto SwapIt principale.

**Nota:** Il rec-service è configurato per usare la porta **3002**.

## Descrizione

Questo microservizio si occupa di:
- Ascoltare eventi Kafka dal backend SwapIt (SkillEvent, FeedbackEvent, SwapProposalEvent)
- Costruire e mantenere un grafo Neo4j delle relazioni tra utenti, skills e scambi
- Fornire raccomandazioni di swap basate su algoritmi di analisi grafico

## Architettura

### Kafka Topics Consumati
- **SkillEvent**: Eventi di creazione/aggiornamento skills
- **FeedbackEvent**: Valutazioni tra utenti
- **SwapProposalEvent**: Scambi completati tra utenti

### Grafo Neo4j

**Nodes:**
- `User`: Utenti del sistema
- `Skill`: Competenze/abilità

**Relationships:**
- `OWNS`: Utente possiede una skill
- `DESIRES`: Utente desidera una skill
- `RATES`: Utente valuta un altro utente
- `SWAPPED_WITH`: Utenti che hanno effettuato uno swap

## Tecnologie

- **NestJS**: Framework Node.js
- **Neo4j**: Database a grafo
- **Kafka**: Message broker per eventi
- **TypeScript**: Linguaggio di programmazione

## Configurazione

### Variabili d'Ambiente

Crea un file `.env` nella root del progetto:

```env
# Neo4j Configuration
NEO4J_SCHEME=bolt
NEO4J_HOST=localhost
NEO4J_PORT=7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your_password
NEO4J_DATABASE=neo4j

# Kafka Configuration
KAFKA_BROKERS=localhost:9092

# Application
PORT=3002
```

## Installazione

> **Importante:** Neo4j, Kafka e Zookeeper devono essere già in esecuzione (dal progetto SwapIt principale)

### Con Docker (Consigliato)

```bash
# Build e avvia il rec-service
npm run docker:build
npm run docker:up

# Visualizza i logs del rec-service
npm run docker:logs

# Stop il servizio
npm run docker:down
```

Il rec-service si connetterà automaticamente a Neo4j e Kafka già in esecuzione.

### Sviluppo Locale

```bash
# Installa dipendenze
npm install

# Crea file .env da .env
# Windows PowerShell:
Copy-Item .env .env

# Linux/Mac:
cp .env .env

# Avvia in modalità sviluppo
npm run start:dev
```

### Production

```bash
npm run start:prod
```

### Comandi Docker Utili

```bash
npm run docker:build    # Build immagine
npm run docker:up       # Avvia rec-service
npm run docker:logs     # Logs rec-service
npm run docker:stop     # Stop servizio
npm run docker:restart  # Restart rec-service
npm run docker:down     # Stop e rimuovi container
```

## API Endpoints

### GET /recommendations/swaps/:userUid

Ottiene raccomandazioni di swap per un utente specifico.

**Parameters:**
- `userUid` (string): UID dell'utente
- `limit` (query, optional): Numero massimo di raccomandazioni (default: 10)

**Response:**
```json
[
  {
    "recommendedUserUid": "user123",
    "recommendedUserName": "Mario Rossi",
    "skillsTheyOffer": ["JavaScript", "React"],
    "skillsTheyWant": ["Python", "Machine Learning"],
    "score": 35.5
  }
]
```

**Example:**
```bash
curl http://localhost:3002/recommendations/swaps/user123?limit=5
```

## Algoritmo di Raccomandazione

Il sistema utilizza un sistema a cascata con 3 livelli di fallback:

### Livello 1: Raccomandazioni Intelligenti (Priorità Massima)

Calcola uno score per ogni potenziale swap basato su:

1. **Matching Skills** (peso: 10x): Skills che l'utente desidera e l'altro utente possiede
2. **Rating Medio** (peso: 2x): Valutazione media dell'utente raccomandato
3. **Swaps Precedenti** (peso: 5x): Numero di scambi di successo passati

Formula:
```
score = (matchingSkills × 10) + (avgRating × 2) + (successfulSwaps × 5)
```

### Livello 2: Utenti Più Popolari (Fallback)

Se non ci sono raccomandazioni intelligenti, il sistema restituisce gli utenti più popolari basati su:
- Rating medio ricevuto
- Numero di valutazioni ricevute
- Numero di swap di successo completati

Formula:
```
popularityScore = (avgRating × 2) + ratingCount + (successfulSwaps × 3)
```

### Livello 3: Utenti Recenti (Ultimo Fallback)

Se non ci sono risultati nei primi due livelli, vengono restituiti qualsiasi utenti recenti con le loro skills.

## Struttura Progetto

```
src/
├── config/              # Configurazioni
│   └── neo4j.config.ts
├── neo4j/               # Neo4j integration
│   ├── neo4j.service.ts
│   └── neo4j.module.ts
├── graph/               # Graph domain
│   ├── entities/        # Node types
│   ├── relationships/   # Relationship types
│   ├── graph.repository.ts
│   └── graph.module.ts
├── kafka/               # Kafka integration
│   ├── consumers/       # Event consumers
│   ├── dto/             # Data transfer objects
│   ├── kafka.config.ts
│   └── kafka.module.ts
└── recommendations/     # Recommendation API
    ├── recommendations.controller.ts
    ├── recommendations.service.ts
    └── recommendations.module.ts
```

## Sviluppo

### Test

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Build

```bash
npm run build
```

## Note Importanti

- Assicurati che Neo4j e Kafka siano in esecuzione prima di avviare il servizio
- Il servizio creerà automaticamente i nodi e le relazioni nel grafo basandosi sugli eventi Kafka
- Le raccomandazioni vengono calcolate in tempo reale ad ogni richiesta

## License

UNLICENSED
