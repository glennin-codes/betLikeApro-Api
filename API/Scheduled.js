const axios = require('axios');

async function getMatches() {
  try {
    const response = await axios.get('https://api.football-data.org/v2/matches?status=SCHEDULED', {
      headers: {
        'X-Auth-Token':'5777078bb3ca4a72a3e01a5fdebac8db'
      }
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error('Unable to fetch matches');
  }
}
