# envsync

> Sync `.env` files securely across team members using encrypted git notes

---

## Installation

```bash
npm install -g envsync
```

---

## Usage

Initialize envsync in your project and share encrypted environment variables through git notes — no extra infrastructure required.

```bash
# Initialize envsync in your repo
envsync init

# Encrypt and push your .env to git notes
envsync push

# Pull and decrypt your team's .env
envsync pull

# Rotate the encryption key
envsync rotate-key
```

Your `.env` file is encrypted using AES-256 before being stored as a git note, meaning it travels alongside your repository without ever being committed to your history.

**Example workflow:**

```bash
# One-time setup (generates a shared team key)
envsync init --key-file ./team.key

# Push your local .env
envsync push --env .env.production

# A teammate pulls it down
envsync pull --env .env.production
```

> **Note:** Share the encryption key with teammates via a secure channel (e.g., a password manager). Never commit the key file to your repository.

---

## Requirements

- Node.js >= 16
- Git >= 2.x

---

## License

[MIT](./LICENSE) © envsync contributors