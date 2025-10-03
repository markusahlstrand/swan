# Installation

Get Swan up and running on your machine in just a few steps.

## Prerequisites

Before installing Swan, make sure you have the following:

- **Node.js** v18 or higher
- **pnpm** v8 or higher (recommended package manager)
- **Git** for version control

## Installation Methods

### Using pnpm (Recommended)

```bash
pnpm create swan-app my-project
cd my-project
pnpm install
```

### Using npm

```bash
npm create swan-app my-project
cd my-project
npm install
```

### Using yarn

```bash
yarn create swan-app my-project
cd my-project
yarn install
```

## Development Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/swan.git
   cd swan
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Start development server**

   ```bash
   pnpm dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000` to see your Swan application.

## Verification

To verify your installation is working correctly:

```bash
swan --version
```

You should see the version number printed to your console.

## Next Steps

Now that Swan is installed, you can:

- Explore the [API documentation](/api/)
- Check out example projects
- Join our community discussions

## Troubleshooting

### Common Issues

**Node.js version error**
Make sure you're using Node.js v18 or higher:

```bash
node --version
```

**Permission errors**
On macOS/Linux, you might need to use `sudo` for global installations:

```bash
sudo pnpm install -g swan-cli
```

**Port already in use**
If port 3000 is busy, specify a different port:

```bash
pnpm dev --port 3001
```
