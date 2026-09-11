module.exports = {
  apps: [
    {
      name: 'bsale-amazon-sync',
      script: './dist/app.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3004,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      merge_logs: true,
      autorestart: true,
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
