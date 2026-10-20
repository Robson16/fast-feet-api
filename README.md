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
  git clone https://github.com/Robson16/challenge-ignite-nodejs-05-fast-feet-api.git
  cd challenge-ignite-nodejs-05-fast-feet-api
```

2. **Install the dependencies**:

```bash
  npm install
```

3. **Start the database with Docker Compose**:

```bash
  docker-compose up -d
```

4. **Run the database migrations**:

```bash
  npm run prisma:migrate
```

5. **Start the development server**:

```bash
  npm run start:dev
```

6. **Open the application at http://localhost:3000**.

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
