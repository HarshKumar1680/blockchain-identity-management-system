# ⬡ ChainID — Blockchain-Based Secure Identity Management

A full-stack project with 3 evaluation phases. Each phase builds on the previous one.

---

## 📁 Project Structure

```
blockchain-identity/
├── frontend/
│   ├── index.html               ← Landing + Login
│   ├── pages/
│   │   ├── register.html        ← Registration page
│   │   └── dashboard.html       ← User dashboard
│   ├── css/
│   │   ├── global.css           ← Shared styles
│   │   ├── auth.css             ← Landing/Auth styles
│   │   └── dashboard.css        ← Dashboard styles
│   └── js/
│       ├── api.js               ← API helper
│       ├── auth.js              ← Login modal logic
│       ├── landing.js           ← Landing page stats
│       ├── register.js          ← Register form logic
│       └── dashboard.js         ← Dashboard logic
│
└── backend/
    ├── server.js                ← Express app entry
    ├── .env                     ← Environment variables
    ├── package.json
    ├── models/
    │   ├── Block.js             ← Blockchain block model
    │   └── User.js              ← User identity model
    ├── routes/
    │   ├── auth.js              ← /api/auth/*
    │   ├── user.js              ← /api/user/*
    │   └── blockchain.js        ← /api/blockchain/*
    ├── middleware/
    │   └── auth.js              ← JWT protect middleware
    └── utils/
        └── blockchain.js        ← Core blockchain logic
```

---

## 🚀 Setup & Run

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally on port 27017)

### Backend
```bash
cd backend
npm install
npm run dev        # uses nodemon for hot reload
# OR
npm start
```

### Frontend
Open `frontend/index.html` in a browser using Live Server (VS Code extension) or:
```bash
# Install live-server globally
npm install -g live-server
cd frontend
live-server
```

The frontend expects the backend at `http://localhost:5000`.

---

## ✅ PHASE 1 — Core Identity System (Evaluation 1)

### Features Implemented
- **User Registration** — Create an account with full name, username, email, password
- **Password Hashing** — bcryptjs with salt rounds (industry standard)
- **JWT Authentication** — Secure login with JSON Web Tokens (7-day expiry)
- **Blockchain Ledger** — Custom SHA-256 blockchain with Proof-of-Work mining
- **Identity Block** — Each registered user gets their own mined block
- **Decentralized ID (DID)** — Auto-generated `did:chainid:<userId>` identifier
- **Genesis Block** — Chain initialized with a genesis block on first run
- **Chain Verification** — Verify entire chain hash integrity via API
- **Dashboard** — Overview, Identity details, full Blockchain viewer
- **Activity Log** — Tracks login/register events per user

### API Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register new user, mine block |
| POST | /api/auth/login | Login, get JWT token |
| GET | /api/user/me | Get current user + activities |
| GET | /api/blockchain/chain | Get full chain |
| GET | /api/blockchain/stats | Block count, user count, validity |
| GET | /api/blockchain/verify | Verify chain integrity |
| GET | /api/blockchain/block/:index | Get single block |
| GET | /api/health | Health check |

---

## 📄 PHASE 2 — Document Verification (Evaluation 2)

> Files to ADD/UPDATE for Phase 2:

### New Files to Create
```
frontend/pages/documents.html        ← Document upload & verify UI
frontend/css/documents.css           ← Document page styles
frontend/js/documents.js             ← Document page logic

backend/models/Document.js           ← Document hash model
backend/routes/documents.js          ← /api/documents/*
```

### Files to UPDATE
```
backend/server.js                    ← Add: app.use('/api/documents', documentRoutes)
backend/models/User.js               ← Add: documents array field
frontend/pages/dashboard.html        ← Uncomment Documents nav item, add page section
frontend/js/dashboard.js             ← Add: loadDocuments() function
```

### Phase 2 Features to Build
1. **Document Upload** — User uploads a file (PDF, image, etc.)
2. **SHA-256 Hashing** — File is hashed client-side using Web Crypto API
3. **Hash on Blockchain** — Document hash + metadata mined into a new block
4. **Verification** — Re-upload a file to verify it matches the recorded hash
5. **Document History** — View all documents registered by a user
6. **Tamper Detection** — Alert if hash doesn't match (file modified)

### Phase 2 New API Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/documents/register | Hash + register document on chain |
| POST | /api/documents/verify | Verify document against chain hash |
| GET | /api/documents/mine | Get all documents for logged-in user |
| GET | /api/documents/:id | Get single document record |

---

## 🔗 PHASE 3 — Decentralized Access Control (Evaluation 3)

> Files to ADD/UPDATE for Phase 3:

### New Files to Create
```
frontend/pages/access-control.html   ← Grant/revoke access UI
frontend/css/access-control.css      ← Access control styles
frontend/js/access-control.js        ← Access control logic

backend/models/AccessGrant.js        ← Access permission model
backend/routes/access.js             ← /api/access/*
backend/utils/crypto.js              ← Key pair generation helpers
```

### Files to UPDATE
```
backend/server.js                    ← Add: app.use('/api/access', accessRoutes)
backend/models/User.js               ← Add: publicKey, privateKey fields
frontend/pages/dashboard.html        ← Uncomment Access Control nav item
frontend/js/dashboard.js             ← Add: loadAccessControl() function
```

### Phase 3 Features to Build
1. **Key Pair Generation** — RSA public/private key per user on registration
2. **Grant Access** — Share identity/document access with another user (by DID)
3. **Revoke Access** — Remove previously granted access permissions
4. **Access Log** — Blockchain record of all access grants/revocations
5. **Verify Permission** — Check if a DID has permission to view data
6. **Access Requests** — Request access from another identity
7. **Consent Management** — Accept/reject incoming access requests

### Phase 3 New API Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/access/grant | Grant access to a DID |
| POST | /api/access/revoke | Revoke access from a DID |
| GET | /api/access/granted | List who I've granted access to |
| GET | /api/access/received | List who has granted me access |
| POST | /api/access/verify | Check if DID has access |
| POST | /api/access/request | Request access from another user |

---

## 🔐 Security Notes
- Passwords are hashed with bcryptjs (12 salt rounds) — never stored plain
- JWTs expire in 7 days — refresh by logging in again
- Blockchain uses SHA-256 hashing with Proof-of-Work
- DIDs follow the W3C DID specification format
- All protected routes require `Authorization: Bearer <token>` header

---

## 🧪 Testing the API (with curl)

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"John Doe","username":"johndoe","email":"john@test.com","password":"Password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","password":"Password123"}'

# Get blockchain (use token from login)
curl http://localhost:5000/api/blockchain/chain \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Verify chain
curl http://localhost:5000/api/blockchain/verify
```
