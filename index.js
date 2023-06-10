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
    const races = [];
    const racesResultPromise = [];

    const $races = cheerio.load(htmlRace.data);
    $races(".resultsarchive-table tbody tr").each((_, item) => {
      // Race result overview
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

      // Get race resutl detail html
      const urlRaceResult =
        "https://www.formula1.com" +
        $races(item).find("td:nth-child(2) a").attr("href");
      racesResultPromise.push(axios.get(urlRaceResult));
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

  //   Get drivers
  const driversPromise = [];
  years.forEach((year) => {
    const urlDrivers = `https://www.formula1.com/en/results.html/${year}/drivers.html`;
    driversPromise.push(axios.get(urlDrivers));
  });

  const htmlDrivers = await Promise.all(driversPromise);

  for (let i = 0; i < htmlDrivers.length; i++) {
    const htmlDriver = htmlDrivers[i];
    const drivers = [];
    const driversResultPromise = [];
    const $drivers = cheerio.load(htmlDriver.data);
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

      // Get driver result detail html
      const urlDriverResult =
        "https://www.formula1.com" +
        $drivers(item).find("td:nth-child(3) a").attr("href");
      driversResultPromise.push(axios.get(urlDriverResult));
    });

    const htmlDriversResult = await Promise.all(driversResultPromise);

    htmlDriversResult.forEach((htmlResult, index) => {
      const driverResult = [];
      $result = cheerio.load(htmlResult.data);
      $result(".resultsarchive-table tbody tr").each((_, item) => {
        const result = {};
        result.grandPrix = $result(item)
          .find("td:nth-child(2) a")
          .text()
          .trim();
        result.date = $result(item).find("td:nth-child(3)").text().trim();
        result.car = $result(item).find("td:nth-child(4) a").text().trim();
        result.racePosition = Number(
          $result(item).find("td:nth-child(5)").text().trim()
        );
        result.pts = Number(
          $result(item).find("td:nth-child(6)").text().trim()
        );

        driverResult.push(result);
      });

      drivers[index] = { ...drivers[index], driverResult };
    });

    f1ResultData[years[i]] = { ...f1ResultData[years[i]], drivers };
  }

  // Get teams
  const teamsPromise = [];
  years.forEach((year) => {
    const urlTeams = `https://www.formula1.com/en/results.html/${year}/team.html`;
    teamsPromise.push(axios.get(urlTeams));
  });

  const htmlTeams = await Promise.all(teamsPromise);

  for (let i = 0; i < htmlTeams.length; i++) {
    const htmlTeam = htmlTeams[i];
    const teams = [];
    const teamsResultPromise = [];
    const $teams = cheerio.load(htmlTeam.data);

    $teams(".resultsarchive-table tbody tr").each((_, item) => {
      const team = {};
      team.pos = Number($teams(item).find("td:nth-child(2)").text().trim());
      team.team = $teams(item).find("td:nth-child(3) a").text().trim();
      team.pts = Number($teams(item).find("td:nth-child(4)").text().trim());

      teams.push(team);

      // Get driver result detail html
      const urlTeamResult =
        "https://www.formula1.com" +
        $teams(item).find("td:nth-child(3) a").attr("href");
      teamsResultPromise.push(axios.get(urlTeamResult));
    });

    const htmlTeamsResult = await Promise.all(teamsResultPromise);

    htmlTeamsResult.forEach((htmlResult, index) => {
      const teamResult = [];
      $result = cheerio.load(htmlResult.data);
      $result(".resultsarchive-table tbody tr").each((_, item) => {
        const result = {};
        result.grandPrix = $result(item)
          .find("td:nth-child(2) a")
          .text()
          .trim();
        result.date = $result(item).find("td:nth-child(3)").text().trim();
        result.pts = Number(
          $result(item).find("td:nth-child(4)").text().trim()
        );

        teamResult.push(result);
      });

      teams[index] = { ...teams[index], teamResult };
    });

    f1ResultData[years[i]] = { ...f1ResultData[years[i]], teams };
  }

  // Get DHL fastest lap
  const dhlPromise = [];
  years.forEach((year) => {
    const urlDHL = `https://www.formula1.com/en/results.html/${year}/fastest-laps.html`;
    dhlPromise.push(axios.get(urlDHL));
  });

  const htmlDHLs = await Promise.all(dhlPromise);

  htmlDHLs.forEach((htmlDHL, index) => {
    const $dhls = cheerio.load(htmlDHL.data);
    const dhls = [];

    $dhls(".resultsarchive-table tbody tr").each((_, item) => {
      const dhl = {};
      dhl.grandPrix = $dhls(item).find("td:nth-child(2)").text().trim();
      dhl.driver =
        $dhls(item).find("td:nth-child(3) span:nth-child(1)").text().trim() +
        " " +
        $dhls(item).find("td:nth-child(3) span:nth-child(2)").text().trim();
      dhl.car = $dhls(item).find("td:nth-child(4)").text().trim();
      dhl.time = $dhls(item).find("td:nth-child(5)").text().trim();

      dhls.push(dhl);
    });

    f1ResultData[years[index]] = {
      ...f1ResultData[years[index]],
      dhlFastestLaps: dhls,
    };
  });

  //   Save to json file
  fs.writeFile("f1ResultData.json", JSON.stringify(f1ResultData), (err) => {
    if (err) throw err;
    console.log("saved!!");
  });
}

main();
