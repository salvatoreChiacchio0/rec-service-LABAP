# Quick Start Guide

## ⚡ Avvio Rapido

### Prerequisiti Verificati ✅

Assicurati che questi servizi siano attivi:
```bash
docker ps | findstr "swapit-neo4j broker zookeeper"
```

Dovresti vedere:
- `swapit-neo4j` (Neo4j)
- `broker` (Kafka)
- `zookeeper` (Zookeeper)

### Opzione 1: Avvio in Docker (Consigliato per produzione)

```bash
# 1. Build dell'immagine
npm run docker:build

# 2. Avvia il container
npm run docker:up

# 3. Verifica logs
npm run docker:logs

# 4. Test API
curl http://localhost:3002
```

### Opzione 2: Avvio Locale (Consigliato per sviluppo)

```bash
# 1. Crea file .env (se non esiste)
Copy-Item env.example .env

# 2. Avvia in modalità watch
npm run start:dev
```

### Problema Comune: Errore Connessione Kafka

Se vedi errori del tipo:
```
ERROR [Connection] Connection error: ECONNREFUSED
```

**Soluzione**: Kafka richiede listener espliciti. La configurazione usa già `localhost:9092` che è corretto per connessioni esterne.

**Verifica**:
```bash
# Test connessione Kafka
docker exec broker kafka-broker-api-versions --bootstrap-server localhost:9092
```

Se funziona, il problema è nell'app. Controlla i logs:
```bash
npm run docker:logs
# o per sviluppo locale
npm run start:dev
```

## 🔍 Debug

### Verifica Connettività

```bash
# Kafka
docker exec broker kafka-topics --list --bootstrap-server localhost:9092

# Neo4j
curl http://localhost:7474
# Nel browser: http://localhost:7474
```

### Restart Servizi

```bash
# Restart solo rec-service
npm run docker:restart

# Restart completo (se necessario)
docker restart swapit-neo4j broker zookeeper
```

### Logs Dettagliati

```bash
# Rec Service
docker logs rec-service-lab-ap -f

# Kafka
docker logs broker -f

# Neo4j
docker logs swapit-neo4j -f
```

## 📊 Test Raccomandazioni

Dopo che l'app è attiva:

```bash
# Root endpoint
curl http://localhost:3002

# Raccomandazioni
curl http://localhost:3002/recommendations/swaps/user123?limit=5
```

## 🐛 Note Importanti

1. **Porta**: Il servizio usa la porta **3002** per evitare conflitti
2. **Kafka**: Usa listener `PLAINTEXT_HOST://localhost:9092` per connessioni esterne
3. **Neo4j**: Usa autenticazione `neo4j/password` di default
4. **Network**: In Docker, usa `host.docker.internal` per accedere ai servizi host


