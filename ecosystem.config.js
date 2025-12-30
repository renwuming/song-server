module.exports = {
  apps: [
    {
      name: 'song',
      script: 'dist/main.js',
      //   exec_mode: 'cluster_mode',
      //   instances: 0,
    },
    {
      name: 'song-dev',
      script: 'nest start',
      env: { PORT: 6788, NODE_ENV: 'staging' },
    },
  ],
};
