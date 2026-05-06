# BlockID – Blockchain-based Secure Identity Management

BlockID is a blockchain-based secure identity management system that provides decentralized identity creation, tamper-proof document verification, and secure access control.

The project is designed to solve the problems of centralized identity systems such as single points of failure, data tampering, and lack of transparency.

---

# Features

* Decentralized Identifier (DID) generation
* Blockchain-based immutable identity records
* SHA-256 document verification
* JWT-based authentication
* RSA-PSS digital signature verification
* Proof-of-Work blockchain implementation
* Role-based access control
* Secure password hashing using bcrypt
* MongoDB off-chain storage

---

# Tech Stack

## Frontend

* HTML
* CSS
* JavaScript

## Backend

* Node.js
* Express.js

## Database

* MongoDB
* Mongoose

## Security & Blockchain

* SHA-256
* JWT
* RSA-PSS
* bcrypt
* Custom Proof-of-Work Blockchain

---

# System Architecture

```text
Client Browser
      ↓
Express.js API Server
      ↓
Authentication Middleware (JWT)
      ↓
Business Logic Layer
      ↓
MongoDB + Blockchain Engine
```

---

# Core Modules

## Identity Management

* User registration
* DID generation
* Password hashing

## Blockchain Engine

* Block mining
* Chain validation
* Proof-of-Work implementation

## Document Verification

* Client-side SHA-256 hashing
* Blockchain hash anchoring
* Integrity verification

## Access Control

* Permission-based grants
* Expiry-based access
* Secure API authorization

---

# Installation

## Clone Repository

```bash
git clone https://github.com/your-username/BlockID.git
cd BlockID
```

## Install Dependencies

```bash
npm install
```

## Setup Environment Variables

Create a `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
```

## Start Server

```bash
npm start
```

---

# API Features

* User Registration
* Login Authentication
* DID Generation
* Document Upload & Verification
* Blockchain Validation
* Access Grant Management

---

# Security Features

* bcrypt password hashing
* JWT authentication
* RSA-PSS signature verification
* Client-side document hashing
* Immutable blockchain records
* Zero-knowledge private key handling

---

# Future Improvements

* P2P distributed blockchain network
* W3C DID standard integration
* Verifiable Credentials support
* Mobile application
* Proof-of-Stake consensus
* Advanced role-based permissions

---

# Project Objectives

* Eliminate centralized identity risks
* Provide tamper-proof identity storage
* Enable secure document verification
* Improve privacy and data ownership
* Implement decentralized access control

---

# Author

Harsh Kumar

---

# License

This project is developed for educational and research purposes.
