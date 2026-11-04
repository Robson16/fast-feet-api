# FastFeet API

![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20.10.0-green)
![License](https://img.shields.io/badge/License-MIT-blue)

An API for managing parcels for **FastFeet**, a fictional delivery company. This project was the **5th Challenge** developed as part of Rocketseat's **Ignite** program in 2023.

## 📝 Description

The **FastFeet API** provides features for managing deliveries, couriers, and recipients. It is built with **Node.js** and the **NestJS** framework, written in **TypeScript**, and implements business rules to validate actions.

## 🎯 Implemented Features

### **User** CRUD

- **Create**:
  - User roles: Administrator, Deliverer, and Recipient.
  - Register new users.
- **Read**:
  - Log in with CPF and password.
  - List a user's deliveries.
- **Update**:
  - Change a user's password.
- **Delete**: Delete users.

### **Parcel** CRUD

- **Create**:
  - Default status: "Awaiting Pickup".
  - Available statuses: Awaiting Pickup, Picked Up, Returned, and Delivered.
- **Read**:
  - List parcels by status or geographic proximity.
  - Filter by neighborhood and deliverer.
- **Update**:
  - Update parcel statuses.
- **Delete**: Delete parcels.

### **Destination** CRUD

- Create, read, update, and delete destinations.

## 🚧 Planned Features

- Add a login endpoint and expose the existing user, parcel, and destination use cases through HTTP.
- Enforce the access-control requirements listed below across all routes.
- Persist parcels and destinations through Prisma repositories.
- Require a photo when marking a parcel as delivered.
- Notify recipients whenever a parcel's status changes.
- Require a photo when marking a parcel as delivered.
- Enforce stricter access controls:
  - Only administrators can manage users and destinations.
  - Only administrators and deliverers can manage parcels.
- Prevent users from accessing other users' data to ensure privacy.
- Add further business rule validations.

## 📜 Business Rules

- Only administrators can perform CRUD operations on users and destinations.
- Only deliverers who picked up a parcel can mark it as delivered.
- Deliveries require a photo.
- Deliverers cannot view parcels assigned to other deliverers.

## 🌐 Application Context

The API is designed for use by web and mobile applications. See the proposed application layout on Figma:  
[FastFeet Layout](https://www.figma.com/file/hn0qGhnSHDVst7oaY3PF72/FastFeet?type=design&node-id=0-1&mode=design)

## 🚀 Technologies

- **Node.js** (>= 20.10.0)
- **NestJS**
- **TypeScript**
- **Prisma**
- **Zod**
- **JWT authentication**
- **Vitest testing**

## 📦 Installation and Usage

### Prerequisites

- **Node.js** (>= 20.10.0)
- **Docker** and **Docker Compose**

### Step by Step

1. **Clone the repository**:

```bash
  git clone https://github.com/Robson16/fast-feet-api.git
  cd fast-feet-api
```

2. **Install the dependencies**:

```bash
  npm install
```

3. **Create your local environment file**:

Copy `.env.example` to `.env`, then set `APP_ADMIN_PASSWORD` to a strong, temporary password. Set the database and JWT variables required by your local environment as well. `JWT_ACCESS_TOKEN_TTL_SECONDS` is optional, defaults to `900` seconds (15 minutes), and accepts values from 60 seconds to 24 hours. Restart the API after changing it. `.env` is ignored by Git; never commit it or share its contents.

4. **Start the database with Docker Compose**:

```bash
  docker-compose up -d
```

5. **Run the database migrations**:

```bash
  npm run prisma:migrate
```

6. **Create the initial administrator**:

```bash
  npm run prisma:seed
```

The seed reads `APP_ADMIN_PASSWORD` from `.env`, hashes it before saving, and creates the initial administrator only when no administrator exists. A successful run prints a confirmation; if an administrator already exists, it prints that no account was created. The seed does not change an existing administrator's password, even if you change `APP_ADMIN_PASSWORD`.

After starting the API, verify the account by signing in at `POST /auth` with the CPF configured in `prisma/seed.ts` and the temporary password, then request `GET /profile` with the returned bearer token and confirm the role is `ADMIN`.

After verifying the initial account, remove the value of `APP_ADMIN_PASSWORD` from your local `.env` (leave the variable empty if you prefer). To rotate the administrator password, sign in and use `PATCH /profile/password`; changing `APP_ADMIN_PASSWORD` and rerunning the seed will not rotate it. For deployed environments, provide the initial secret through the deployment's secret manager rather than committing it to a file.

7. **Start the development server**:

```bash
  npm run dev
```

8. **Open the API at http://localhost:3333** or the Swagger UI at http://localhost:3333/api.

## 🧪 Tests

Run the tests to verify that the API is working:

```bash
npm run test
```

To generate a coverage report:

```bash
npm run test:cov
```

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🤝 Contributions

Feel free to contribute! Share suggestions, report issues, or open pull requests.

Developed with ❤️ by Robson Henrique Rodrigues.
