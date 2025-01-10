# Cassini

Cassini is a comprehensive analytics and observability platform designed to provide seamless integration of both user analytics and system monitoring capabilities.

## Project Structure

```
cassini/
├── packages/
│   ├── analytics/       # Analytics SDK
│   ├── observability/   # Observability SDK
│   ├── frontend/        # React frontend application
│   └── backend/         # Go backend services
```

## Features

- **Analytics SDK**: Track user events, sessions, and behaviors

  - Batch processing of events
  - Configurable flush intervals
  - Type-safe event tracking

- **Observability SDK**: Monitor system health and performance

  - Metric recording
  - Distributed tracing
  - Error tracking

- **React Frontend**: Modern dashboard for data visualization

  - Real-time analytics views
  - System health monitoring
  - Customizable dashboards
  - Performance optimized

- **Go Backend**: Scalable backend services
  - High-performance event processing
  - Data aggregation
  - API endpoints for data ingestion and retrieval
  - Storage management

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (v8 or higher)
- Go (v1.22 or higher)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/lucasdoell/cassini.git
cd cassini
```

2. Install dependencies:

```bash
pnpm install
```

3. Build all packages:

```bash
pnpm run build
```

### Development

To start development servers:

```bash
# Start frontend development server
pnpm --filter frontend dev

# Start backend development server
cd packages/backend
go run cmd/server/main.go
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Project Status

Cassini is currently in active development. The API is subject to change until we reach v1.0.0.
