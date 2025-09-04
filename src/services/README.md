# BiteSpeed Identity Reconciliation Service

This service provides a REST API to reconcile user identities based on email and phone number, ensuring a single primary contact per identity cluster and linking all related contacts.

---

## Setup & Installation

1. **Clone the repository**

   ```sh
   git clone <your-repo-url>
   cd bitespeed-backend-task
   ```

2. **Install dependencies**

   ```sh
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory with your database connection string:

   ```
   DATABASE_URL="postgresql://<user>:<password>@<host>:<port>/<db>?schema=public"
   ```

4. **Run database migrations**
   ```sh
   npx prisma migrate deploy
   ```

---

## Running the Service

Start the server:

```sh
npm run dev
```

The API will be available at `http://localhost:4000`.

---

## Sample Requests

### 1. Create a new primary (no existing match)

```sh
curl -X POST http://localhost:4000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"lorraine@hillvalley.edu","phoneNumber":"123456"}'
```

**Response:**

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
```

---

### 2. Add a secondary that shares the phone

```sh
curl -X POST http://localhost:4000/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"mcfly@hillvalley.edu","phoneNumber":"123456"}'
```

**Response:**

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [2]
  }
}
```

---

### 3. Merge two primaries when a bridging request arrives

Suppose you have primary A (id 11) and primary B (id 27).  
A new request with A.email and B.phone will merge both clusters under the oldest primary.

---

## Notes & Edge Cases

- **Validation:** Requests without email or phone are rejected (400).
- **Primary/Secondary:** Only one primary per cluster; others are secondaries.
- **Merging:** Bridging requests merge clusters under the oldest primary.
- **Idempotency:** Repeated requests return consistent data.
- **Normalization:** Emails are lowercased and trimmed; phone numbers are trimmed.

---

## Concurrency

- All reconciliation logic should ideally be wrapped in a transaction to avoid race conditions and ensure data consistency.

---

## Tech Stack

- Node.js, Express
- Prisma ORM
- PostgreSQL (or your configured DB)

---

##
