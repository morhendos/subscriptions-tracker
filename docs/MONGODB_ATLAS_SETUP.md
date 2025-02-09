# MongoDB Atlas Setup Guide

## Overview
This guide outlines the steps to set up MongoDB Atlas for the Subscription Tracker application.

## Prerequisites
- MongoDB Atlas account
- Access to the application's deployment environment
- Admin rights to configure network and security settings

## Steps

### 1. Cluster Setup
1. Create a new project in MongoDB Atlas
2. Create a new cluster:
   - Select M10 or higher for production
   - Choose the region closest to your application servers
   - Enable backup
   - Configure additional storage if needed

### 2. Security Configuration
1. Network Access:
   ```shell
   # Allow access from application IPs
   - Add application server IPs to IP whitelist
   - For dynamic IPs, use VPC peering
   ```

2. Database Users:
   ```shell
   # Create application user
   - Create a dedicated user for the application
   - Use role: readWrite on subscription-tracker database
   
   # Create admin user (optional)
   - Create admin user for maintenance
   - Use role: dbAdmin, backup
   ```

3. Authentication:
   ```shell
   # Enable authentication methods
   - SCRAM-SHA-256 (default)
   - X.509 (optional for enhanced security)
   ```

### 3. Backup Configuration
1. Configure backup schedule:
   ```yaml
   Continuous Backup:
     enabled: true
     pointInTimeRecovery: true
   
   Scheduled Backups:
     frequency: hourly
     retentionPeriod: 
       hourly: 24 hours
       daily: 7 days
       weekly: 4 weeks
       monthly: 12 months
   ```

2. Test restore procedures:
   ```shell
   # Regular testing schedule
   - Monthly: Full restore test
   - Weekly: Point-in-time recovery test
   ```

### 4. Monitoring Setup
1. Configure alerts:
   ```yaml
   Metrics:
     - connectionsUtilization: >80%
     - cpuUtilization: >75%
     - opsLatency: >100ms
     - replicationLag: >10s

   Notifications:
     channels:
       - email: team@company.com
       - slack: #mongodb-alerts
   ```

2. Set up integration with logging service:
   ```yaml
   Logging:
     service: CloudWatch/DataDog
     retention: 30 days
     metrics:
       - slow queries
       - connection events
       - authentication failures
   ```

### 5. Performance Optimization
1. Index strategy:
   ```javascript
   // Required indexes
   db.subscriptions.createIndex({ "userId": 1 });
   db.subscriptions.createIndex({ "nextBillingDate": 1 });
   db.subscriptions.createIndex({ "createdAt": 1 });
   
   // Compound indexes
   db.subscriptions.createIndex({ "userId": 1, "status": 1 });
   db.subscriptions.createIndex({ "userId": 1, "nextBillingDate": 1 });
   ```

2. Configure performance settings:
   ```yaml
   ReadPreference:
     mode: primaryPreferred
     maxStalenessSeconds: 90
   
   WriteConcern:
     w: majority
     j: true
     wtimeout: 2500
   ```

### 6. Environment Variables
1. Set required variables:
   ```shell
   # Connection
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.<id>.mongodb.net/<database>
   MONGODB_DB=subscription-tracker
   
   # Monitoring
   MONGODB_METRICS_INTERVAL=60
   MONGODB_ALERT_POOL_THRESHOLD=80
   MONGODB_ALERT_SLOW_QUERY=100
   
   # Backup
   MONGODB_BACKUP_ENABLED=true
   MONGODB_BACKUP_TYPE=scheduled
   ```

### 7. Connection Testing
1. Test connection:
   ```javascript
   // Use the health check endpoint
   GET /api/health/db
   
   // Expected response
   {
     "status": "healthy",
     "latency": <number>,
     "metrics": {
       "connections": <number>,
       "poolSize": <number>,
       "utilizationPercentage": <number>
     }
   }
   ```

## Maintenance Procedures

### Daily Checks
- Monitor connection pool utilization
- Check slow query logs
- Verify backup completion
- Review error logs

### Weekly Tasks
- Review performance metrics
- Check index usage stats
- Verify backup integrity
- Update security patches

### Monthly Tasks
- Full restore testing
- Review and optimize indexes
- Check for MongoDB updates
- Review access patterns

## Troubleshooting

### Common Issues
1. Connection Timeouts:
   ```shell
   # Check
   - Network connectivity
   - IP whitelist
   - DNS resolution
   ```

2. High Latency:
   ```shell
   # Verify
   - Index usage
   - Query patterns
   - Network routes
   ```

3. Authentication Failures:
   ```shell
   # Check
   - Credentials
   - User permissions
   - Network security groups
   ```

## Emergency Procedures

### Database Recovery
1. Point-in-time recovery:
   ```shell
   # Steps
   1. Identify recovery point
   2. Initiate restore
   3. Verify data integrity
   4. Switch application connection
   ```

2. Full restore:
   ```shell
   # Steps
   1. Stop application
   2. Initiate full restore
   3. Verify restore completion
   4. Update connection string
   5. Restart application
   ```

## Monitoring Integration

### Metrics to Track
```yaml
Essential Metrics:
  - Query response time
  - Connection pool utilization
  - Cache hit ratio
  - Replication lag
  - Write concern errors
  - Authentication failures
```

### Alert Configuration
```yaml
Critical Alerts:
  - Connection failures
  - Replication issues
  - Backup failures
  - Security events

Warning Alerts:
  - High latency
  - Pool utilization
  - Slow queries
  - Storage usage
```