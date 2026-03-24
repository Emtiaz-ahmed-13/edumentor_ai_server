# EduMentor AI Server

A robust backend for the EduMentor AI platform, built with the **MERN stack** (MongoDB, Express.js, React, Node.js) and structured using a clean **Module Pattern**.

## 🚀 Features

- **Runtime**: Node.js with Express.js framework.
- **Database**: MongoDB with Mongoose ODM.
- **Architecture**: Modular structure for scalability and maintainability.
- **Authentication**: Secure JWT-based authentication (Access & Refresh Tokens).
- **Security**: 
    - Password hashing with `bcrypt`.
    - Cross-Origin Resource Sharing (CORS) enabled.
    - Global Error Handling.
- **Code Quality**: 
    - Consistent API responses.
    - Explicit `try-catch` blocks for clear error handling.

## 🛠 Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

## 📦 Installation

1.  **Clone the repository:**

    ```bash
    git clone <repository-url>
    cd edumentor_ai_server
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**

    Create a `.env` file in the root directory and add the following configuration:

    ```env
    NODE_ENV=development
    PORT=5001
    MONGO_URL=mongodb://localhost:27017/edumentor-db # Or your MongoDB Atlas URI
    BCRYPT_SALT_ROUNDS=12
    JWT_SECRET=your_super_secret_key
    JWT_EXPIRES_IN=1d
    JWT_REFRESH_SECRET=your_super_refresh_secret
    JWT_REFRESH_EXPIRES_IN=365d
    ```

4.  **Run the application:**

    ```bash
    # Development mode (with nodemon)
    npm run dev

    # Production mode
    npm start
    ```

## 📂 Project Structure

The project follows a modular pattern where each feature (e.g., Auth, User) is self-contained.

```
src/
├── app/
│   ├── modules/
│   │   ├── Auth/
│   │   │   ├── auth.controller.js  # Request handlers
│   │   │   ├── auth.service.js     # Business logic
│   │   │   └── auth.route.js       # Route definitions
│   │   └── User/
│   │       └── user.model.js       # Database schema
│   ├── middlewares/
│   │   └── globalErrorHandler.js   # Centralized error handling
│   ├── routes/
│   │   └── index.js                # Main router entry point
│   └── utils/
│       └── sendResponse.js         # Standardized response helper
├── config/                         # Environment configuration
├── helpers/                        # Utility helpers (e.g., JWT)
├── app.js                          # Express app setup
└── server.js                       # Server entry point
```

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/signup` | Register a new user | `{ "name": "John", "email": "john@example.com", "password": "123" }` |
| `POST` | `/api/v1/auth/login` | Login user and get tokens | `{ "email": "john@example.com", "password": "123" }` |

## 🤝 Contributing

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

## 📝 License


## Finalization
Project migration and setup completed. Ready for development.
