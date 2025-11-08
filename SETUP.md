# Setup Guide - Recommendation Service

## 📋 Prerequisiti

- **Node.js** 20.x o superiore
- **Docker** e **Docker Compose** (per Neo4j e Kafka)

## 🚀 Quick Start

### Opzione 1: Docker Compose (Rec Service in Container)

**Prerequisito:** Neo4j, Kafka e Zookeeper devono essere già in esecuzione (dal progetto SwapIt).

```bash
# 1. Clona/carica il progetto

# 2. Build e avvia il rec-service
npm run docker:build
npm run docker:up

# 3. Verifica che tutto sia attivo
docker ps | grep swapit

# 4. Accedi all'API
curl http://localhost:3002
```

**Servizi attivi:**
- Neo4j Browser: http://localhost:7474 (user: neo4j, password: password)
- Kafka: localhost:9092
- Rec Service API: http://localhost:3002

### Opzione 2: Sviluppo Locale

Per sviluppare con l'applicazione in locale usando Neo4j e Kafka esistenti.

```bash
# 1. Crea file .env
# Su Windows PowerShell:
Copy-Item env.example .env

# Su Linux/Mac:
cp env.example .env

# 2. Installa dipendenze
npm install

# 3. Avvia l'applicazione
npm run start:dev
```

## 🔧 Configurazione

### File .env

Il file `.env` viene creato da `env.example` e contiene:

```env
# Neo4j Configuration
NEO4J_SCHEME=bolt
NEO4J_HOST=localhost        # Usa 'neo4j' quando in Docker Compose
NEO4J_PORT=7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
NEO4J_DATABASE=neo4j

# Kafka Configuration
KAFKA_BROKERS=localhost:9092  # Usa 'kafka:9092' quando in Docker Compose

# Application
PORT=3002
```

**Nota:** Quando usi Docker Compose completo, modifica `.env` per usare:
- `NEO4J_HOST=neo4j`
- `KAFKA_BROKERS=kafka:9092`

## ✅ Verifica Installazione

### Test API

```bash
# Root endpoint
curl http://localhost:3002

# Raccomandazioni (esempio)
curl http://localhost:3002/recommendations/swaps/user123?limit=5
```

### Verifica Neo4j

1. Apri http://localhost:7474
2. Login: `neo4j` / `password`
3. Esegui query test:
   ```cypher
   MATCH (n) RETURN count(n) as totalNodes
   ```

### Verifica Kafka

```bash
# Se hai kafka-console-consumer installato
kafka-console-consumer --bootstrap-server localhost:9092 --topic SkillEvent --from-beginning
```

### Verifica Logs

```bash
# Con Docker Compose
npm run docker:logs

# Sviluppo locale
npm run start:dev
```

## 🔄 Comandi Utili

### Docker Compose (Rec Service)

```bash
npm run docker:build    # Build immagine app
npm run docker:up       # Avvia rec-service
npm run docker:logs     # Logs rec-service
npm run docker:stop     # Stop servizio
npm run docker:restart  # Restart rec-service
npm run docker:down     # Stop e rimuovi container
```

### Development

```bash
npm run start:dev       # Development mode
npm run build           # Build
npm run start:prod      # Production mode
npm run test            # Unit tests
npm run test:e2e        # E2E tests
```

## 🐛 Troubleshooting

### Porta già in uso

```bash
# Verifica porte utilizzate
netstat -ano | findstr :3002  # Windows
lsof -i :3002                 # Mac/Linux

# Cambia PORT nel .env se necessario
PORT=3003
```

### Neo4j non si connette

1. Verifica che Neo4j sia attivo: `docker ps`
2. Controlla logs: `docker logs swapit-neo4j`
3. Verifica credenziali nel `.env`

### Kafka non riceve messaggi

1. Verifica che Kafka sia attivo: `docker ps`
2. Controlla che i topic esistano
3. Verifica logs: `docker logs swapit-kafka`

### Docker build fallisce

```bash
# Pulisci cache e riprova
docker system prune -a
npm run docker:build
```

## 📝 Next Steps

1. Assicurati che il backend SwapIt pubblichi eventi su Kafka
2. Verifica che i topic siano configurati: SkillEvent, FeedbackEvent, SwapProposalEvent
3. Testa le raccomandazioni con dati reali
4. Personalizza l'algoritmo di raccomandazione se necessario

## 🆘 Support

Per problemi o domande, controlla:
- README.md per documentazione completa
- Logs dell'applicazione
- Logs di Docker

