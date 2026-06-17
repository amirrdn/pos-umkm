# Stage 1: Build & Compile TypeScript
FROM node:20-slim AS builder

# Install OpenSSL
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Salin package.json dan lockfile terlebih dahulu
COPY package*.json ./

# Salin folder prisma untuk kebutuhan prisma generate
COPY prisma ./prisma/

# Install semua dependensi (termasuk devDependencies)
RUN npm ci

# Salin seluruh kode program
COPY . .

# Jalankan generator Prisma Client
RUN npx prisma generate

# Kompilasi TypeScript ke Javascript di folder dist/
RUN npm run build


# Stage 2: Production Runner
FROM node:20-slim AS runner

# Install OpenSSL
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

# Salin deskripsi paket dan skema database
COPY package*.json ./
COPY prisma ./prisma/

# Install hanya dependensi produksi (tanpa devDependencies)
RUN npm ci --only=production

# Generate kembali client Prisma khusus untuk lingkungan produksi
RUN npx prisma generate

# Salin berkas Javascript hasil kompilasi dari stage builder
COPY --from=builder /app/dist ./dist

# Ekspos port yang digunakan oleh backend Express
EXPOSE 3000

# Jalankan migrasi dan nyalakan aplikasi
CMD ["npm", "run", "start"]
