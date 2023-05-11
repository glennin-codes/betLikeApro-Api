const axios = require("axios");
const fs = require("fs");

const apiKey = "5777078bb3ca4a72a3e01a5fdebac8db";
const baseUrl = "https://api.football-data.org/v4/";

const leagues = ["CL", "BL1", "FL1", "SA", "PPL", "PD", "BSA"];
const allMatches = [];

const fetchMatches = async (league) => {
  try {
    const url = `${baseUrl}competitions/${league}/matches`;
    const response = await axios.get(url, {
      headers: { "X-Auth-Token": apiKey },
    });
    const { matches } = response.data;
    allMatches.push(...matches);
    console.log(`Fetched ${matches.length} matches for ${league}`);
  } catch (error) {
    console.error(`Error fetching matches for ${league}: ${error.message}`);
  }
};

const fetchAllMatches = async (req, res) => {
  for (const league of leagues) {
    await fetchMatches(league);
  }
  fs.writeFileSync("matches.json", JSON.stringify(allMatches, null, 2));
  res.send(`Fetched a total of ${allMatches.length} matches.`);
  console.log(`Fetched a total of ${allMatches.length} matches.`);
};

module.exports = fetchAllMatches;
