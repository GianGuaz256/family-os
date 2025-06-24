# Family OS - Docker Deployment Guide

This guide will help you deploy the Family OS application using Docker on a self-hosted server.

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your server:

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)
- **Git** (for cloning and updating the repository)
- **Supabase account** with a configured project

### Installing Docker

#### Ubuntu/Debian:
```bash
# Update package index
sudo apt update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin

# Logout and login again or run:
newgrp docker
```

#### CentOS/RHEL:
```bash
# Install Docker
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
```

## 🚀 Quick Deployment

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd family-os-react
```

### 2. Configure Environment Variables
```bash
# Copy the example environment file
cp .env.production.example .env.production

# Edit the environment file with your Supabase credentials
nano .env.production
```

Fill in your Supabase configuration:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Deploy the Application
```bash
# Make the deployment script executable
chmod +x docker-run.sh

# Start the application
./docker-run.sh start
```

The application will be available at `http://your-server-ip:3000`

## 🛠️ Management Commands

The `docker-run.sh` script provides easy management commands:

```bash
# Build the Docker image
./docker-run.sh build

# Start the application
./docker-run.sh start

# Stop the application
./docker-run.sh stop

# Restart the application
./docker-run.sh restart

# View application logs
./docker-run.sh logs

# Check application status
./docker-run.sh status

# Update to latest version (git pull + rebuild + restart)
./docker-run.sh update

# Show help
./docker-run.sh help
```

## 🔧 Manual Docker Commands

If you prefer to use Docker commands directly:

### Build the Image:
```bash
docker build -t family-os:latest .
```

### Run with Docker Compose:
```bash
# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

### Run with Docker (without compose):
```bash
docker run -d \
  --name family-os-app \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  family-os:latest
```

## 🌐 Production Setup

### 1. Reverse Proxy (Nginx)

For production, set up Nginx as a reverse proxy:

```nginx
# /etc/nginx/sites-available/family-os
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/family-os /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 2. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (add to crontab)
0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow SSH (if needed)
sudo ufw allow 22

# Enable firewall
sudo ufw enable
```

## 📊 Monitoring and Logs

### View Application Logs:
```bash
# Real-time logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Logs for specific service
docker-compose logs family-os
```

### Health Check:
```bash
# Check if container is running
docker ps

# Check application health
curl http://localhost:3000
```

### Resource Usage:
```bash
# Container stats
docker stats

# System resources
htop
df -h
```

## 🔄 Updates and Maintenance

### Update the Application:
```bash
# Automated update (recommended)
./docker-run.sh update

# Manual update
git pull
docker-compose down
docker build -t family-os:latest .
docker-compose up -d
```

### Backup Strategies:
Since the application uses Supabase for data storage, your data is automatically backed up by Supabase. However, you may want to:

1. **Environment Variables**: Keep a secure backup of your `.env.production` file
2. **Application Code**: Use Git for version control
3. **Custom Configurations**: Backup any custom Nginx or system configurations

### Database Migrations:
If you need to run database migrations, connect to your Supabase project and run the SQL scripts from the `scripts/` directory.

## 🐛 Troubleshooting

### Common Issues:

1. **Port 3000 already in use:**
   ```bash
   # Find what's using the port
   sudo lsof -i :3000
   
   # Kill the process or change the port in docker-compose.yml
   ```

2. **Environment variables not loading:**
   ```bash
   # Check if .env.production exists and has correct values
   cat .env.production
   
   # Restart the container
   ./docker-run.sh restart
   ```

3. **Container fails to start:**
   ```bash
   # Check logs for errors
   docker-compose logs
   
   # Check container status
   docker ps -a
   ```

4. **Supabase connection issues:**
   - Verify your Supabase URL and keys
   - Check if Supabase project is running
   - Ensure RLS policies are set up correctly

### Performance Optimization:

1. **Resource Limits**: Add resource limits to docker-compose.yml if needed
2. **Nginx Caching**: Configure Nginx to cache static assets
3. **CDN**: Use a CDN for better global performance

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env.production` to version control
2. **Firewall**: Only expose necessary ports (80, 443, 22)
3. **SSL**: Always use HTTPS in production
4. **Updates**: Keep Docker and the application updated
5. **Monitoring**: Set up monitoring and alerting

## 📞 Support

If you encounter issues:

1. Check the application logs: `./docker-run.sh logs`
2. Verify your Supabase configuration
3. Ensure all prerequisites are installed
4. Review this documentation for common solutions

---

## 📝 Configuration Reference

### Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `OPENAI_API_KEY`: (Optional) For card analysis feature
- `NODE_ENV`: Should be set to "production"
- `PORT`: Application port (default: 3000)

### Ports:
- **3000**: Application HTTP port
- **80**: HTTP (if using Nginx)
- **443**: HTTPS (if using SSL)

### Volumes:
- `/etc/localtime`: System timezone synchronization

This deployment setup provides a robust, production-ready environment for your Family OS application! 