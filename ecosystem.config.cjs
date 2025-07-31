module.exports = {
  apps: [{
    name: 'topleague-backend',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_file: './env.ionos'
  }]
}; 