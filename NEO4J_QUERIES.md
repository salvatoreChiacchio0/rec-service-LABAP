# Neo4j Graph Visualization Queries

Questo documento contiene query Cypher utili per visualizzare e monitorare come si popola il grafo Neo4j.

## 🔍 Accesso a Neo4j Browser

1. Apri il browser e vai su: **http://localhost:7474**
2. Login con:
   - **Username**: `neo4j`
   - **Password**: `password`

## 📊 Query per Visualizzare il Grafo

### 1. Visualizza Tutto il Grafo
```cypher
MATCH (n)
RETURN n
LIMIT 100
```
Visualizza tutti i nodi e le relazioni (limitato a 100 per performance).

### 2. Visualizza Solo la Struttura (Schema)
```cypher
CALL db.schema.visualization()
```
Mostra tutti i tipi di nodi e relazioni nel database.

### 3. Conta Nodi per Tipo
```cypher
MATCH (n)
RETURN labels(n) as Label, count(*) as Count
ORDER BY Count DESC
```
Mostra quanti nodi ci sono per ogni tipo (User, Skill, ecc.).

### 4. Visualizza Tutti gli User con le loro Skills
```cypher
MATCH (u:User)-[r:OWNS]->(s:Skill)
RETURN u, r, s
```
Mostra tutti gli utenti e le skills che possiedono.

### 5. Visualizza User che Desiderano Skills
```cypher
MATCH (u:User)-[r:DESIRES]->(s:Skill)
RETURN u, r, s
```
Mostra gli utenti e le skills che desiderano imparare.

### 6. Visualizza Relazioni di Rating
```cypher
MATCH (reviewer:User)-[r:RATES]->(reviewed:User)
RETURN reviewer, r, reviewed
```
Mostra tutti i rating tra utenti con i dettagli (rating, review, timestamp).

### 7. Visualizza Swap Completati
```cypher
MATCH (u1:User)-[r:SWAPPED_WITH]->(u2:User)
WHERE r.success = true
RETURN u1, r, u2
```
Mostra tutte le relazioni di swap completati con successo.

### 8. Visualizza un User Specifico e le sue Relazioni
```cypher
MATCH (u:User {uid: 'user_12345'})-[r]-(n)
RETURN u, r, n
```
Sostituisci `'user_12345'` con l'UID dell'utente che vuoi visualizzare.

### 9. Visualizza Skills più Popolari (più OWNS)
```cypher
MATCH (u:User)-[:OWNS]->(s:Skill)
RETURN s.label as Skill, count(u) as OwnerCount
ORDER BY OwnerCount DESC
LIMIT 10
```

### 10. Visualizza Skills più Desiderate
```cypher
MATCH (u:User)-[:DESIRES]->(s:Skill)
RETURN s.label as Skill, count(u) as DesiredByCount
ORDER BY DesiredByCount DESC
LIMIT 10
```

## 📈 Query per Monitorare il Popolamento

### 11. Statistiche Complete del Grafo
```cypher
MATCH (n)
WITH labels(n) as labels, count(*) as count
UNWIND labels as label
RETURN label, sum(count) as total
ORDER BY total DESC
```

### 12. Conta Relazioni per Tipo
```cypher
MATCH ()-[r]->()
RETURN type(r) as RelationshipType, count(*) as Count
ORDER BY Count DESC
```

### 13. User con più Skills
```cypher
MATCH (u:User)-[:OWNS]->(s:Skill)
WITH u, count(s) as skillCount
RETURN u.uid as UserUID, u.name as UserName, skillCount
ORDER BY skillCount DESC
LIMIT 10
```

### 14. User più Valutati
```cypher
MATCH (reviewed:User)<-[r:RATES]-(reviewer:User)
WITH reviewed, avg(r.rating) as avgRating, count(r) as ratingCount
RETURN reviewed.uid as UserUID, reviewed.name as UserName, 
       avgRating, ratingCount
ORDER BY avgRating DESC, ratingCount DESC
LIMIT 10
```

### 15. Visualizza il Grafo Completo di un User (con tutte le connessioni)
```cypher
MATCH path = (u:User {uid: 'user_12345'})-[*1..2]-(connected)
RETURN path
LIMIT 50
```
Mostra l'utente e tutto ciò che è connesso a lui (1-2 gradi di separazione).

## 🔄 Query per Monitorare Eventi in Tempo Reale

### 16. Ultimi Nodi Creati (se hai timestamp)
```cypher
MATCH (u:User)
RETURN u.uid, u.name
ORDER BY id(u) DESC
LIMIT 10
```

### 17. Ultime Skills Aggiunte
```cypher
MATCH (s:Skill)
RETURN s.id, s.label, s.description
ORDER BY s.id DESC
LIMIT 10
```

### 18. Ultimi Rating Creati
```cypher
MATCH (reviewer:User)-[r:RATES]->(reviewed:User)
RETURN reviewer.uid as Reviewer, reviewed.uid as Reviewed, 
       r.rating, r.review, r.timestamp
ORDER BY r.timestamp DESC
LIMIT 10
```

## 🎯 Query per Testare le Raccomandazioni

### 19. Visualizza Potenziali Match (Skills che User A desidera e User B possiede)
```cypher
MATCH (u1:User {uid: 'user_12345'})-[:DESIRES]->(desired:Skill)
MATCH (u2:User)-[:OWNS]->(desired)
WHERE u2.uid <> u1.uid
RETURN u1.uid as UserA, u2.uid as UserB, 
       collect(desired.label) as SkillsMatch
LIMIT 10
```

### 20. Visualizza Match Completi (mutuo interesse)
```cypher
MATCH (u1:User {uid: 'user_12345'})-[:DESIRES]->(desired:Skill)
MATCH (u2:User)-[:OWNS]->(desired)
MATCH (u2)-[:DESIRES]->(wanted:Skill)
MATCH (u1)-[:OWNS]->(wanted)
WHERE u2.uid <> u1.uid
RETURN u1.uid as UserA, u2.uid as UserB,
       collect(DISTINCT desired.label) as UserA_Wants,
       collect(DISTINCT wanted.label) as UserB_Wants
LIMIT 10
```

## 🗑️ Query Utili per Pulizia (Sviluppo)

### 21. Elimina Tutto il Grafo
```cypher
MATCH (n)
DETACH DELETE n
```
⚠️ **ATTENZIONE**: Elimina tutti i nodi e le relazioni!

### 22. Elimina Solo Relazioni
```cypher
MATCH ()-[r]->()
DELETE r
```

### 23. Elimina Solo User
```cypher
MATCH (u:User)
DETACH DELETE u
```

## 📝 Note

- **Nodi User**: Hanno proprietà `uid` (stringa) e `name` (stringa opzionale)
- **Nodi Skill**: Hanno proprietà `id` (numero), `label` (stringa), `description` (stringa opzionale)
- **Relazioni OWNS**: User → Skill (l'utente possiede questa skill)
- **Relazioni DESIRES**: User → Skill (l'utente desidera imparare questa skill)
- **Relazioni RATES**: User → User (con proprietà `rating`, `review`, `timestamp`)
- **Relazioni SWAPPED_WITH**: User → User (con proprietà `timestamp`, `success`)

## 🔄 Come si Popola il Grafo

Il grafo viene popolato automaticamente quando il servizio `rec-service-lab-ap` riceve eventi da Kafka:

1. **SkillEvent** (Create/Update) → Crea/Aggiorna nodo `Skill`
2. **FeedbackEvent** (Rate) → Crea relazione `RATES` tra User
3. **SwapProposalEvent** (Swapped con status ACCEPTED) → Crea relazione `SWAPPED_WITH` tra User

**Nota**: I nodi User e le relazioni OWNS/DESIRES devono essere creati manualmente o tramite altri endpoint (non gestiti dai consumer Kafka attuali).

