const express = require('express');
const router = express.Router();
let { operationsMaster } = require('../data/initialData');

router.get('/', (req, res) => {
  res.json({
    total: operationsMaster.length,
    operations: operationsMaster
  });
});

module.exports = router;
