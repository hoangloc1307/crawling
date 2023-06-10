const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

async function main() {
  const f1ResultData = {};

  // Get year
  const url = "https://www.formula1.com/en/results.html";
  const years = [];
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);
  $(
    ".resultsarchive-filter-container .resultsarchive-filter-wrap:first-child ul li"
  ).each((_, item) => {
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

  for (let i = 0; i < htmlRaces.length; i++) {
    const htmlRace = htmlRaces[i];
    const $races = cheerio.load(htmlRace.data);
    const races = [];
    const racesResultPromise = [];

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

      // Get race resutl
      const urlRaceResult =
        "https://www.formula1.com" +
        $races(item).find("td:nth-child(2) a").attr("href");
      racesResultPromise.push(axios.get(urlRaceResult));
      races.push(race);
    });

    const htmlRacesResult = await Promise.all(racesResultPromise);

    htmlRacesResult.forEach((htmlResult, index) => {
      const raceResult = {};
      $result = cheerio.load(htmlResult.data);
      raceResult.name = $result("h1.ResultsArchiveTitle")
        .text()
        .trim()
        .replace(/\s{2,}/gim, " ");
      raceResult.date =
        $result("h1 + p.date span:nth-child(1)").text().trim() +
        " - " +
        $result("h1 + p.date span:nth-child(2)").text().trim();
      raceResult.city = $result("h1 + p.date span:nth-child(3)").text().trim();
      raceResult.result = [];

      $result(".resultsarchive-table tbody tr").each((_, item) => {
        const result = {};

        result.pos = $result(item).find("td:nth-child(2)").text().trim();
        result.no = $result(item).find("td:nth-child(3)").text().trim();
        result.driver =
          $result(item)
            .find("td:nth-child(4) span:nth-child(1)")
            .text()
            .trim() +
          " " +
          $result(item).find("td:nth-child(4) span:nth-child(2)").text().trim();
        result.car = $result(item).find("td:nth-child(5)").text().trim();
        result.lap = Number(
          $result(item).find("td:nth-child(6)").text().trim()
        );
        result.time = $result(item).find("td:nth-child(7)").text().trim();
        result.pts = Number(
          $result(item).find("td:nth-child(8)").text().trim()
        );

        raceResult.result.push(result);
      });

      races[index] = { ...races[index], raceResult };
    });

    f1ResultData[years[i]] = { ...f1ResultData[years[i]], races };
  }

  // htmlRaces.forEach((htmlRace, index) => {
  //   const $races = cheerio.load(htmlRace.data);
  //   const races = [];
  //   const racesResultPromise = []

  //   $races(".resultsarchive-table tbody tr").each((_, item) => {
  //     const race = {};

  //     race.grandPrix = $races(item).find("td:nth-child(2) a").text().trim();
  //     race.date = $races(item).find("td:nth-child(3)").text().trim();
  //     race.winner =
  //       $races(item).find("td:nth-child(4) span:nth-child(1)").text().trim() +
  //       " " +
  //       $races(item).find("td:nth-child(4) span:nth-child(2)").text().trim();
  //     race.car = $races(item).find("td:nth-child(5)").text().trim();
  //     race.laps = Number($races(item).find("td:nth-child(6)").text().trim());
  //     race.time = $races(item).find("td:nth-child(7)").text().trim();

  //     // Get race resutl
  //     const urlRaceResult =
  //       "https://www.formula1.com" +
  //       $races(item).find("td:nth-child(2) a").attr("href");
  //     racesResultPromise.push(axios.get(urlRaceResult));
  //     races.push(race);
  //   });

  //   const htmlRacesResult = await

  //   f1ResultData[years[index]] = { races };
  // });

  // //   Get drivers
  // const driversPromise = [];
  // years.forEach((year) => {
  //   const urlDrivers = `https://www.formula1.com/en/results.html/${year}/drivers.html`;
  //   driversPromise.push(axios.get(urlDrivers));
  // });

  // const htmlDrivers = await Promise.all(driversPromise);

  // htmlDrivers.forEach((htmlDriver, index) => {
  //   const $drivers = cheerio.load(htmlDriver.data);
  //   const drivers = [];

  //   $drivers(".resultsarchive-table tbody tr").each((_, item) => {
  //     const driver = {};

  //     driver.pos = Number($drivers(item).find("td:nth-child(2)").text().trim());
  //     driver.driver =
  //       $drivers(item)
  //         .find("td:nth-child(3) a span:nth-child(1)")
  //         .text()
  //         .trim() +
  //       " " +
  //       $drivers(item)
  //         .find("td:nth-child(3) a span:nth-child(2)")
  //         .text()
  //         .trim();
  //     driver.nationality = $drivers(item).find("td:nth-child(4)").text().trim();
  //     driver.car = $drivers(item).find("td:nth-child(5) a").text().trim();
  //     driver.pts = Number($drivers(item).find("td:nth-child(6)").text().trim());

  //     drivers.push(driver);
  //   });

  //   f1ResultData[years[index]].drivers = drivers;
  // });

  // // Get teams
  // const teamsPromise = [];
  // years.forEach((year) => {
  //   const urlTeams = `https://www.formula1.com/en/results.html/${year}/team.html`;
  //   teamsPromise.push(axios.get(urlTeams));
  // });

  // const htmlTeams = await Promise.all(teamsPromise);

  // htmlTeams.forEach((htmlTeam, index) => {
  //   const $teams = cheerio.load(htmlTeam.data);
  //   const teams = [];

  //   $teams(".resultsarchive-table tbody tr").each((_, item) => {
  //     const team = {};
  //     team.pos = Number($teams(item).find("td:nth-child(2)").text().trim());
  //     team.team = $teams(item).find("td:nth-child(3) a").text().trim();
  //     team.pts = Number($teams(item).find("td:nth-child(4)").text().trim());

  //     teams.push(team);
  //   });

  //   f1ResultData[years[index]].teams = teams;
  // });

  // // Get DHL fastest lap
  // const dhlPromise = [];
  // years.forEach((year) => {
  //   const urlDHL = `https://www.formula1.com/en/results.html/${year}/fastest-laps.html`;
  //   dhlPromise.push(axios.get(urlDHL));
  // });

  // const htmlDHLs = await Promise.all(dhlPromise);

  // htmlDHLs.forEach((htmlDHL, index) => {
  //   const $dhls = cheerio.load(htmlDHL.data);
  //   const dhls = [];

  //   $dhls(".resultsarchive-table tbody tr").each((_, item) => {
  //     const dhl = {};
  //     dhl.grandPrix = $dhls(item).find("td:nth-child(2)").text().trim();
  //     dhl.driver =
  //       $dhls(item).find("td:nth-child(3) span:nth-child(1)").text().trim() +
  //       " " +
  //       $dhls(item).find("td:nth-child(3) span:nth-child(2)").text().trim();
  //     dhl.car = $dhls(item).find("td:nth-child(4)").text().trim();
  //     dhl.time = $dhls(item).find("td:nth-child(5)").text().trim();

  //     dhls.push(dhl);
  //   });

  //   f1ResultData[years[index]].dhlFastestLaps = dhls;
  // });

  //   Save to json file
  fs.writeFile("f1ResultData.json", JSON.stringify(f1ResultData), (err) => {
    if (err) throw err;
    console.log("saved!!");
  });
}

main();
