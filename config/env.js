'use strict';

const path = require('path');

// Shared by the server and Sequelize CLI; injected variables take precedence.
require('dotenv').config({
  path: path.resolve(__dirname, '..', '.env'),
  quiet: true
});
