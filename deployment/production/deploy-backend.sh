#!/bin/bash
# Production Backend Deployment Script
# Wholexale.com B2B Marketplace

set -e

# Configuration
APP_NAME="wholexale-backend"
APP_DIR="/var/www/wholexale"
BACKUP_DIR="/var/backups/wholexale"
LOG_FILE="/var/log/wholexale/deploy.log"
NODE_VERSION="18"
PORT=3000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
    echo "[ERROR] $1" >> "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
    echo "[WARNING] $1" >> "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
    fi
}

# Install system dependencies
install_dependencies() {
    log "Installing system dependencies..."
    
    # Update package list
    apt-get update
    
    # Install Node.js
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
    
    # Install PM2 globally
    npm install -g pm2
    
    # Install Nginx
    apt-get install -y nginx
    
    # Install MongoDB
    wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | apt-key add -
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-5.0.list
    apt-get update
    apt-get install -y mongodb-org
    
    # Install Redis
    apt-get install -y redis-server
    
    # Install Certbot for SSL
    apt-get install -y certbot python3-certbot-nginx
    
    log "System dependencies installed successfully"
}

# Setup application directory
setup_app_directory() {
    log "Setting up application directory..."
    
    # Create directories
    mkdir -p "$APP_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
    
    # Set permissions
    chown -R www-data:www-data "$APP_DIR"
    chmod -R 755 "$APP_DIR"
    
    log "Application directory setup completed"
}

# Setup environment
setup_environment() {
    log "Setting up environment..."
    
    # Copy environment file if it doesn't exist
    if [[ ! -f "$APP_DIR/.env" ]]; then
        if [[ -f ".env.production" ]]; then
            cp .env.production "$APP_DIR/.env"
            log "Environment file copied from .env.production"
        else
            error "No environment file found. Please create .env.production"
        fi
    fi
    
    # Load environment variables
    set -a
    source "$APP_DIR/.env"
    set +a
    
    # Validate required environment variables
    required_vars=("MONGODB_URI" "REDIS_URL" "JWT_SECRET" "ENCRYPTION_KEY")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            error "Required environment variable $var is not set"
        fi
    done
    
    log "Environment setup completed"
}

# Backup current deployment
backup_current_deployment() {
    log "Creating backup of current deployment..."
    
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_path="$BACKUP_DIR/backup_$timestamp"
    
    # Stop PM2 processes
    pm2 stop "$APP_NAME" 2>/dev/null || true
    
    # Create backup
    cp -r "$APP_DIR" "$backup_path"
    
    # Backup database
    mongodump --uri="$MONGODB_URI" --out="$backup_path/database"
    
    log "Backup created at $backup_path"
    
    # Clean old backups (keep last 5)
    find "$BACKUP_DIR" -name "backup_*" -type d -mtime +5 -exec rm -rf {} +
}

# Deploy application
deploy_application() {
    log "Deploying application..."
    
    # Pull latest code
    if [[ -d ".git" ]]; then
        git fetch origin
        git reset --hard origin/main
    else
        error "Git repository not found"
    fi
    
    # Install dependencies
    npm ci --production
    
    # Build application
    npm run build
    
    # Run database migrations
    npm run migrate
    
    # Set permissions
    chown -R www-data:www-data "$APP_DIR"
    chmod -R 755 "$APP_DIR"
    
    log "Application deployment completed"
}

# Setup PM2
setup_pm2() {
    log "Setting up PM2..."
    
    # Create PM2 ecosystem file
    cat > "$APP_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: $PORT
    },
    error_file: '/var/log/wholexale/app-error.log',
    out_file: '/var/log/wholexale/app-out.log',
    log_file: '/var/log/wholexale/app.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024'
  }]
};
EOF

    # Start PM2 processes
    cd "$APP_DIR"
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
    
    log "PM2 setup completed"
}

# Setup Nginx
setup_nginx() {
    log "Setting up Nginx..."
    
    # Create Nginx configuration
    cat > "/etc/nginx/sites-available/wholexale" << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # WebSocket proxy for real-time features
    location /socket.io/ {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:$PORT/health;
        access_log off;
    }
    
    # Static files
    location /static/ {
        alias $APP_DIR/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ \.(env|log)$ {
        deny all;
    }
}
EOF

    # Enable site
    ln -sf "/etc/nginx/sites-available/wholexale" "/etc/nginx/sites-enabled/"
    
    # Remove default site
    rm -f "/etc/nginx/sites-enabled/default"
    
    # Test configuration
    nginx -t
    
    # Reload Nginx
    systemctl reload nginx
    
    log "Nginx setup completed"
}

# Setup SSL certificate
setup_ssl() {
    log "Setting up SSL certificate..."
    
    domain="your-domain.com"
    
    # Get certificate
    certbot --nginx -d "$domain" -d "www.$domain" --non-interactive --agree-tos --email admin@your-domain.com
    
    # Setup auto-renewal
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    log "SSL certificate setup completed"
}

# Start services
start_services() {
    log "Starting services..."
    
    # Start and enable MongoDB
    systemctl start mongod
    systemctl enable mongod
    
    # Start and enable Redis
    systemctl start redis-server
    systemctl enable redis-server
    
    # Start and enable Nginx
    systemctl start nginx
    systemctl enable nginx
    
    log "Services started successfully"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Check if application is responding
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "http://localhost:$PORT/health" > /dev/null; then
            log "Health check passed"
            return 0
        fi
        
        warning "Health check attempt $attempt failed, waiting..."
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
}

# Rollback function
rollback() {
    log "Rolling back to previous deployment..."
    
    # Get latest backup
    latest_backup=$(find "$BACKUP_DIR" -name "backup_*" -type d | sort | tail -1)
    
    if [[ -z "$latest_backup" ]]; then
        error "No backup found for rollback"
    fi
    
    # Stop PM2
    pm2 stop "$APP_NAME"
    
    # Restore from backup
    rm -rf "$APP_DIR"
    cp -r "$latest_backup" "$APP_DIR"
    
    # Restore database
    mongorestore --uri="$MONGODB_URI" "$latest_backup/database"
    
    # Start PM2
    cd "$APP_DIR"
    pm2 start ecosystem.config.js
    
    log "Rollback completed"
}

# Main deployment function
main() {
    log "Starting production deployment of Wholexale Backend"
    
    check_root
    install_dependencies
    setup_app_directory
    setup_environment
    
    # Create backup before deploying
    backup_current_deployment
    
    # Deploy application
    deploy_application
    setup_pm2
    setup_nginx
    
    # Setup SSL (only if domain is configured)
    if [[ -n "$DOMAIN" ]]; then
        setup_ssl
    fi
    
    # Start services
    start_services
    
    # Perform health check
    health_check
    
    log "Production deployment completed successfully!"
    
    # Show status
    pm2 status
    systemctl status nginx --no-pager
    systemctl status mongod --no-pager
    systemctl status redis-server --no-pager
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "health")
        health_check
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health}"
        exit 1
        ;;
esac
