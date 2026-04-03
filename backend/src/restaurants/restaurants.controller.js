class RestaurantsController {
  constructor(restaurantsService) {
    this.restaurantsService = restaurantsService;
  }

  async listRestaurants(req, res) {
    const restaurants = await this.restaurantsService.findAll(req.user);
    res.json(restaurants);
  }
}

module.exports = {
  RestaurantsController,
};
