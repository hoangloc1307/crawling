const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

const url = "https://www.formula1.com/en/results.html";

const f1ResultData = {};

async function main() {
  const { data: html } = await axios.get(url);
  const years = [];
  const $ = cheerio.load(html);
  $(
    ".resultsarchive-filter-container .resultsarchive-filter-wrap:first-child ul li"
  ).each((_, item) => {
    // Get year
    const year = $(item).find("span").text();
    years.push(year);
  });

  //   Get races
  const racesPromise = [];
  years.forEach((year) => {
    const urlRaces = `https://www.formula1.com/en/results/jcr:content/resultsarchive.html/${year}/races.html`;
    racesPromise.push(axios.get(urlRaces));
  });

  const htmlRaces = await Promise.all(racesPromise);

  htmlRaces.forEach((htmlRace, index) => {
    const $races = cheerio.load(htmlRace.data);
    const races = [];
    $races(".resultsarchive-table tbody tr").each((_, item) => {
      const race = {};
      race.grandPrix = $races(item).find("td:nth-child(2) a").text().trim();
      race.date = $races(item).find("td:nth-child(3)").text().trim();
      race.winner =
        $races(item).find("td:nth-child(4) span:nth-child(1)").text().trim() +
        " " +
        $races(item).find("td:nth-child(4) span:nth-child(2)").text().trim();
      race.car = $races(item).find("td:nth-child(5)").text().trim();
      race.laps = Number($races(item).find("td:nth-child(6)").text().trim());
      race.time = $races(item).find("td:nth-child(7)").text().trim();
      races.push(race);
    });
    f1ResultData[years[index]] = { races };
  });

  //   Get drivers
  const driversPromise = [];
  years.forEach((year) => {
    const urlDrivers = `https://www.formula1.com/en/results.html/${year}/drivers.html`;
    driversPromise.push(axios.get(urlDrivers));
  });

  const htmlDrivers = await Promise.all(driversPromise);

  htmlDrivers.forEach((htmlDriver, index) => {
    const $drivers = cheerio.load(htmlDriver.data);
    const drivers = [];
    $drivers(".resultsarchive-table tbody tr").each((_, item) => {
      const driver = {};
      driver.pos = Number($drivers(item).find("td:nth-child(2)").text().trim());
      driver.driver =
        $drivers(item)
          .find("td:nth-child(3) a span:nth-child(1)")
          .text()
          .trim() +
        " " +
        $drivers(item)
          .find("td:nth-child(3) a span:nth-child(2)")
          .text()
          .trim();
      driver.nationality = $drivers(item).find("td:nth-child(4)").text().trim();
      driver.car = $drivers(item).find("td:nth-child(5) a").text().trim();
      driver.pts = Number($drivers(item).find("td:nth-child(6)").text().trim());
      drivers.push(driver);
    });
    f1ResultData[years[index]].drivers = drivers;
  });

  //   Save to json file
  fs.writeFile("f1ResultData.json", JSON.stringify(f1ResultData), (err) => {
    if (err) throw err;
    console.log("saved!!");
  });
}

main();
