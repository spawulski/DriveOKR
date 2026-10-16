# DriveOKR - Modern OKR Management Platform

DriveOKR is a modern, user-friendly platform for managing Objectives and Key Results (OKRs). Built with React and Node.js, it provides a seamless experience for tracking organizational, departmental, and individual goals.

![DriveOKR Dashboard](placeholder-for-dashboard-screenshot.png)

## Features

- **Comprehensive OKR Management**
  - Create and track organizational, departmental, and individual OKRs
  - Real-time progress tracking
  - Confidence level indicators
  - Quarterly planning support

- **User-Friendly Interface**
  - Clean, modern design
  - Intuitive navigation
  - Progress visualization
  - Responsive layout for all devices

- **Authentication & Authorization**
  - Secure GitHub OAuth integration
  - Role-based access control
  - JWT token authentication

## Tech Stack

### Frontend
- React 18
- Tailwind CSS
- Vite
- Axios for API communication

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Passport.js for authentication

### DevOps
- Docker
- Docker Compose
- Nginx as reverse proxy

## Getting Started

### Prerequisites
- Node.js 24 LTS (24.15.0 or newer in the 24.x line; see `.nvmrc`)
- Docker and Docker Compose
- GitHub OAuth credentials

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/drive-okr.git
cd drive-okr
```

2. Create environment files from the templates and fill in real values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

`.env` files are git-ignored; never commit real secrets.

### Running with Docker

1. Start the application:
```bash
docker-compose up --build
```

2. Access the application:
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:4000`

## Verification

Use Node 24 LTS (`nvm use` if available), then install from the committed lockfiles:

```bash
(cd backend && npm ci && npm audit)
(cd frontend && npm ci && npm audit && npm test -- --run && npm run build)
```

Backend regression tests require a disposable MongoDB server, for example:

```bash
docker run --rm -d --name driveokr-test-mongo -p 127.0.0.1:27018:27017 mongo:8.2
cd backend
TEST_MONGODB_URI=mongodb://127.0.0.1:27018 npm test
# When finished:
docker stop driveokr-test-mongo
```

The API tests start their own backend on a free port, create a randomly named
`driveokr_test_*` database, and drop only that database on completion. They do
not run the destructive seed script or use real GitHub OAuth credentials. The
GitHub authorization redirect is checked, not a live GitHub sign-in.

`npm run dev` in the backend uses Node's built-in watch mode; Jest and nodemon
are no longer needed. CI repeats both audits, API and frontend tests, and the
production build on pull requests and pushes to main.

## Project Structure

```
drive-okr/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── config/
│   │   └── ...
│   └── package.json
├── docker-compose.yml
└── README.md
```

## API Documentation

### Objectives

```
GET /api/objectives
GET /api/objectives/:id
POST /api/objectives
PUT /api/objectives/:id
```

### Key Results

```
GET /api/key-results/objective/:objectiveId
POST /api/key-results
PUT /api/key-results/:id
PATCH /api/key-results/:id/confidence
```

### How to make a user an Admin
```
docker ps
docker exec -it <container_id> bash
mongosh
use okr_platform
db.users.updateOne({email: "user@email.com"},{$set: {isAdmin: true}})
```
## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- Tailwind CSS for the amazing utility-first CSS framework
- The React team for their excellent documentation
- MongoDB team for their robust database solution

## Contact

Stephen Pawulski - [@spops.bsky.social](https://twitter.com/spawulski) - spawulski@gmail.com

Project Link: [https://github.com/spawulski/drive-okr](https://github.com/spawulski/drive-okr)
