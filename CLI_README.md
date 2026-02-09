# Wholexale CLI Tool

A powerful command-line interface for managing the Wholexale B2B Marketplace project.

## Installation

First, make sure you have Node.js installed (version 14 or higher). Then:

```bash
# Navigate to the project root
cd e:/Wholexale

# Install dependencies
npm install

# Make the CLI executable (optional but recommended)
npm link
```

## Usage

```bash
# Show help information
wholexale --help

# Show version
wholexale --version

# Display project information
wholexale info
```

## Commands

### Development Commands

```bash
# Start development server (default port: 8083)
wholexale dev
wholexale dev --port 8084
wholexale dev -p 8084

# Clear cache and start development server
wholexale dev --clear
wholexale dev -c

# Start Android development
wholexale android
wholexale android --port 8084
wholexale android -p 8084

# Start web development
wholexale web
wholexale web --port 8084
```

### Build Commands

```bash
# Build Android APK for staging environment
wholexale build:apk

# Build Android APK for production environment
wholexale build:apk --env production

# Wait for build to complete
wholexale build:apk --wait
wholexale build:apk -env production --wait

# Build Android App Bundle
wholexale build:bundle
wholexale build:bundle --env production
```

### Admin Web Commands

```bash
# Start admin web development server (default port: 3000)
wholexale admin:dev
wholexale admin:dev --port 3001

# Build admin web application
wholexale admin:build

# Start admin web production server
wholexale admin:start
wholexale admin:start --port 3001
```

### AI/ML Commands

```bash
# Train AI models
wholexale ai:train
wholexale ai:train --model compliance
wholexale ai:train --model all --epochs 100 --batch 64

# Validate AI models
wholexale ai:validate
wholexale ai:validate --model feature

# Benchmark AI model performance
wholexale ai:benchmark
wholexale ai:benchmark --model similarity --runs 20
```

### Project Management Commands

```bash
# Install all project dependencies
wholexale install

# Clean project dependencies and build artifacts
wholexale clean
wholexale clean --deps  # Clean dependencies only
wholexale clean --build # Clean build artifacts only
wholexale clean --all   # Clean everything

# Display project information
wholexale info
```

### Server Commands

```bash
# Start local API server (default port: 8000)
wholexale server:start
wholexale server:start --port 8001

# Check server status
wholexale server:status
```

### Logs Commands

```bash
# Show device logs (requires adb installed)
wholexale logs --device

# Show server logs
wholexale logs --server

# Show admin web logs
wholexale logs --admin

# Show last 100 lines of logs
wholexale logs --device --tail 100
```

## Example Workflows

### First Time Setup

```bash
# Clone the repository
git clone <repository-url>
cd e:/Wholexale

# Install dependencies
wholexale install

# Start development server
wholexale dev
```

### Development Cycle

```bash
# Start coding with hot reload
wholexale dev

# Test on Android
wholexale android

# Check project information
wholexale info

# Run AI training
wholexale ai:train --epochs 50
```

### Production Build

```bash
# Clean previous build artifacts
wholexale clean --build

# Build production APK
wholexale build:apk --env production --wait

# Build admin web app
wholexale admin:build
```

## Troubleshooting

### Common Issues

1. **Command not found**: If you get "wholexale is not recognized" error:
   - Try `node cli.js` instead of `wholexale`
   - Or run `npm link` again
   - Or use `npx wholexale`

2. **Port already in use**: Use `--port` option to specify a different port

3. **Dependency issues**: Run `wholexale clean --deps && wholexale install`

4. **Build errors**: Try `wholexale clean --all && wholexale install`

### Getting Help

```bash
# Show help for all commands
wholexale --help

# Show help for specific command
wholexale help dev
wholexale dev --help
```

## Contributing

To contribute to the CLI tool, modify the `cli.js` file and submit a pull request.

## License

Same as the Wholexale project.
