class HealthController {
  getStatus(_req, res) {
    res.json({ ok: true });
  }
}

module.exports = {
  HealthController,
};
