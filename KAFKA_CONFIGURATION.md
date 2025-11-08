# Configurazione Kafka - Allineamento Producer/Consumer

Questo documento descrive la configurazione Kafka allineata tra `swapit-be` (producer) e `rec-service-lab-ap` (consumer).

## 📋 Riepilogo Configurazione

### **Topics Kafka**
I seguenti topic sono utilizzati da entrambi i servizi:

| Topic Name | Producer (swapit-be) | Consumer (rec-service-lab-ap) |
|------------|---------------------|-------------------------------|
| `SkillEvent` | ✅ SkillEventProducer | ✅ SkillConsumer |
| `FeedbackEvent` | ✅ FeedbackEventProducer | ✅ FeedbackConsumer |
| `SwapProposalEvent` | ✅ SwapProposalEventProducer | ✅ SwapProposalConsumer |

### **Consumer Group**
- **Group ID**: `rec-service-lab-ap-group`
- **Client ID**: `rec-service-lab-ap`
- **Auto Create Topics**: `true` (il broker ha `KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"`)

### **Broker Configuration**

#### swapit-be (Producer)
- **Broker interno (Docker network)**: `broker:29092`
- **Broker esterno (host)**: `localhost:9092`
- **Configurazione**: Spring Cloud Stream con StreamBridge

#### rec-service-lab-ap (Consumer)
- **Broker**: `host.docker.internal:9092` (per connettersi da Docker all'host)
- **Configurazione**: NestJS Microservices con Kafka transport

## 🔧 Configurazioni Dettagliate

### swapit-be (Producer)

**File**: `environment/docker-compose.yml`
```yaml
broker:
  image: confluentinc/cp-kafka:7.2.15
  container_name: broker
  ports:
    - "9092:9092"
  environment:
    KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://broker:29092,PLAINTEXT_HOST://localhost:9092
    KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"
```

**File**: `src/main/resources/application.yaml`
```yaml
spring:
  cloud:
    stream:
      kafka:
        binder:
          brokers: ${KAFKA_BROKERS:localhost:9092}
```

**Topics pubblicati**:
- `SkillEvent` (via `SkillEventProducer`)
- `FeedbackEvent` (via `FeedbackEventProducer`)
- `SwapProposalEvent` (via `SwapProposalEventProducer`)

### rec-service-lab-ap (Consumer)

**File**: `src/kafka/kafka.config.ts`
```typescript
export const kafkaConfig: KafkaOptions = {
  transport: Transport.KAFKA,
  options: {
    client: {
      clientId: 'rec-service-lab-ap',
      brokers: kafkaBrokers.split(','),
      retry: {
        retries: 8,
        initialRetryTime: 1000,
      },
    },
    consumer: {
      groupId: 'rec-service-lab-ap-group',
      allowAutoTopicCreation: true,
      heartbeatInterval: 3000,
      sessionTimeout: 30000,
    },
  },
};
```

**File**: `docker-compose.yml`
```yaml
rec-service:
  environment:
    KAFKA_BROKERS: host.docker.internal:9092
```

**Consumers**:
- `SkillConsumer` → `@EventPattern('SkillEvent')`
- `FeedbackConsumer` → `@EventPattern('FeedbackEvent')`
- `SwapProposalConsumer` → `@EventPattern('SwapProposalEvent')`

## ✅ Verifica Configurazione

### 1. Verifica Topic Esistono
```bash
docker exec broker kafka-topics --list --bootstrap-server localhost:9092
```

Dovresti vedere:
- `SkillEvent`
- `FeedbackEvent`
- `SwapProposalEvent`

### 2. Verifica Consumer Group
```bash
docker exec broker kafka-consumer-groups --bootstrap-server localhost:9092 --list
```

Dovresti vedere:
- `rec-service-lab-ap-group`

### 3. Verifica Offset del Consumer
```bash
docker exec broker kafka-consumer-groups --bootstrap-server localhost:9092 \
  --describe --group rec-service-lab-ap-group
```

### 4. Test Pubblicazione/Consumo
```bash
# Pubblica un messaggio di test
docker exec broker kafka-console-producer --bootstrap-server localhost:9092 --topic SkillEvent

# In un altro terminale, verifica che il consumer riceva
docker logs rec-service-lab-ap -f
```

## 🔍 Troubleshooting

### Problema: Consumer non riceve messaggi

1. **Verifica connessione al broker**:
   ```bash
   # Dal container rec-service-lab-ap
   docker exec rec-service-lab-ap ping -c 3 host.docker.internal
   ```

2. **Verifica che i topic esistano**:
   ```bash
   docker exec broker kafka-topics --list --bootstrap-server localhost:9092
   ```

3. **Verifica logs del consumer**:
   ```bash
   docker logs rec-service-lab-ap -f | grep -i kafka
   ```

4. **Verifica che il consumer group sia registrato**:
   ```bash
   docker exec broker kafka-consumer-groups --bootstrap-server localhost:9092 --list
   ```

### Problema: Topic non vengono creati automaticamente

Se i topic non vengono creati automaticamente, creali manualmente:

```bash
docker exec broker kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic SkillEvent \
  --partitions 1 \
  --replication-factor 1

docker exec broker kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic FeedbackEvent \
  --partitions 1 \
  --replication-factor 1

docker exec broker kafka-topics --create \
  --bootstrap-server localhost:9092 \
  --topic SwapProposalEvent \
  --partitions 1 \
  --replication-factor 1
```

## 📊 Monitoraggio

### Statistiche Consumer Group
```bash
docker exec broker kafka-consumer-groups --bootstrap-server localhost:9092 \
  --describe --group rec-service-lab-ap-group --all-topics
```

### Lag del Consumer
```bash
docker exec broker kafka-consumer-groups --bootstrap-server localhost:9092 \
  --describe --group rec-service-lab-ap-group
```

Il campo `LAG` indica quanti messaggi il consumer non ha ancora processato.

## 🎯 Formato Messaggi

Tutti i messaggi sono in formato **CloudEvent**:

```json
{
  "specversion": "1.0",
  "id": "uuid",
  "source": "swapit-be",
  "subject": "Skill",
  "type": "Create|Update|Rate|Swapped",
  "datacontenttype": "application/json",
  "time": "2024-01-01T00:00:00Z",
  "data": {
    // Dati specifici dell'evento
  }
}
```

Il consumer (`rec-service-lab-ap`) gestisce automaticamente il formato CloudEvent tramite `CloudEventInterceptor`.

## ✨ Note Importanti

1. **Consumer Group ID**: Ogni consumer deve avere un group ID unico. Se hai più istanze del consumer, usano lo stesso group ID per il load balancing.

2. **Offset Management**: Il consumer group mantiene l'offset dei messaggi processati. Se riavvii il servizio, riprenderà dai messaggi non ancora processati.

3. **Auto Topic Creation**: Entrambi i servizi hanno `allowAutoTopicCreation: true`, quindi i topic vengono creati automaticamente quando vengono pubblicati i primi messaggi.

4. **Network**: `rec-service-lab-ap` usa `host.docker.internal:9092` per connettersi al broker che è esposto su `localhost:9092` dall'host.

