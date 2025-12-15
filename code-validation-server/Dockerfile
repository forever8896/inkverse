# ink! Contract Checker Server
# Production Dockerfile for Railway deployment

# ==============================================================================
# Stage 1: Build TypeScript
# ==============================================================================

FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# ==============================================================================
# Stage 2: Production Image
# ==============================================================================

FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install base dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    clang \
    libssl-dev \
    pkg-config \
    build-essential \
    protobuf-compiler \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl https://sh.rustup.rs -sSf | bash -s -- -y \
    && /root/.cargo/bin/rustup component add rust-src
ENV PATH="/root/.cargo/bin:${PATH}"

# Install cargo-contract v6 (for checking contracts)
RUN cargo install cargo-contract --version "6.0.0-alpha" --locked

# Create app directory
WORKDIR /app

# Create cache directories
RUN mkdir -p /app/compile_cache/cargo_home \
             /app/compile_cache/target \
             /app/compile_cache/temp

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Pre-warm the cargo cache with a minimal contract
RUN echo '#![cfg_attr(not(feature = "std"), no_std, no_main)]\n\
#[ink::contract]\n\
mod warmup {\n\
    #[ink(storage)]\n\
    pub struct Warmup { value: u32 }\n\
    impl Warmup {\n\
        #[ink(constructor)]\n\
        pub fn new() -> Self { Self { value: 0 } }\n\
        #[ink(message)]\n\
        pub fn get(&self) -> u32 { self.value }\n\
    }\n\
}' > /tmp/lib.rs && \
    echo '[package]\n\
name = "warmup"\n\
version = "0.1.0"\n\
edition = "2021"\n\
[dependencies]\n\
ink = { version = "6.0.0-alpha", default-features = false, features = ["unstable-hostfn"] }\n\
[lib]\n\
path = "lib.rs"\n\
[features]\n\
default = ["std"]\n\
std = ["ink/std"]' > /tmp/Cargo.toml && \
    cd /tmp && \
    CARGO_HOME=/app/compile_cache/cargo_home \
    CARGO_TARGET_DIR=/app/compile_cache/target \
    cargo contract check 2>&1 || true && \
    rm -rf /tmp/lib.rs /tmp/Cargo.toml /tmp/Cargo.lock

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV CARGO_HOME=/app/compile_cache/cargo_home
ENV CARGO_TARGET_DIR=/app/compile_cache/target
ENV TEMP_DIR=/app/compile_cache/temp

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

EXPOSE 3000

CMD ["node", "dist/server.js"]
