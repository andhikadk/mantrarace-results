# ============================================
# Single-Stage Production Dockerfile for ECOFEST INDONESIA
# Includes both PHP (FrankenPHP) and Node.js for building frontend
# ============================================
FROM dunglas/frankenphp:php8.4.15

# Accept build argument for skipping Wayfinder generation
ARG SKIP_WAYFINDER_GENERATE=true
ENV SKIP_WAYFINDER_GENERATE=${SKIP_WAYFINDER_GENERATE}

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    unzip \
    nano \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 22.x for building frontend
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions (required by Laravel packages)
RUN install-php-extensions \
    pcntl \
    pdo_mysql \
    gd \
    zip \
    intl \
    redis \
    opcache \
    exif \
    bcmath

# Install Composer
COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy composer files and install PHP dependencies
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader

# Copy package files and install Node dependencies
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Copy Wayfinder generated files (pre-generated locally or in CI/CD)
COPY resources/js/actions ./resources/js/actions
COPY resources/js/routes ./resources/js/routes
COPY resources/js/wayfinder ./resources/js/wayfinder

# Copy application source files
COPY . /app

# Build frontend assets
# Wayfinder plugin will be skipped if SKIP_WAYFINDER_GENERATE=true
RUN npm run build:ssr

# Cleanup Node.js build artifacts to reduce image size (optional)
RUN npm cache clean --force && \
    rm -rf node_modules

# Create required directories with proper permissions
RUN mkdir -p \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    storage/app/public \
    bootstrap/cache \
    && chown -R www-data:www-data \
    storage \
    bootstrap/cache \
    public \
    && chmod -R 775 \
    storage \
    bootstrap/cache

# Define volumes for persistent data and logs
# These will be mounted from host or Docker volumes
VOLUME ["/app/storage/app", "/app/storage/logs"]

# Switch to www-data user for security
USER www-data

# Expose application port
EXPOSE 8700

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD php artisan octane:status || exit 1

# Start FrankenPHP Octane server
CMD ["php", "artisan", "octane:frankenphp", "--host=0.0.0.0", "--port=8700", "--max-requests=500", "--workers=auto"]
