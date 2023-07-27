const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const convertDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//API 1
//Returns a list of all states in the state table
app.get("/states/", async (request, response) => {
  const getDetailsQuery = `
      SELECT *
      FROM state;`;
  const details = await db.all(getDetailsQuery);
  response.send(
    details.map((eachPlayer) => convertDbObjectToResponseObject(eachPlayer))
  );
});

//API 2
//Returns a state based on the state ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getDetailsQuery = `
      SELECT *
      FROM state
      WHERE state_id = '${stateId}';`;
  const details = await db.get(getDetailsQuery);
  response.send(convertDbObjectToResponseObject(details));
});

//API 2
//Create a district in the district table, district_id is auto-incremented
app.post("/districts/", async (request, response) => {
  const newData = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = newData;
  const createDetailsQuery = `
  INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
  VALUES ('${districtName}','${stateId}','${cases}','${cured}','${active}','${deaths}');`;
  const details = await db.run(createDetailsQuery);
  response.send("District Successfully Added");
});

//API 4
//Returns a district based on the district ID
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDetailsQuery = `
      SELECT *
      FROM district
      WHERE district_id = '${districtId}';`;
  const details = await db.get(getDetailsQuery);
  response.send(convertDbObjectToResponseObject(details));
});

//API 5
//Deletes a district from the district table based on the district ID
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDetailsQuery = `
      DELETE FROM district 
      WHERE district_id = '${districtId}';`;
  const details = await db.run(getDetailsQuery);
  response.send("District Removed");
});

//API 6
//Updates the details of a specific district based on the district ID
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const newData = request.body;
  const { districtName, stateId, cases, cured, active, deaths } = newData;
  const updateDetailsQuery = `
  UPDATE district
  SET district_name='${districtName}',state_id='${stateId}',cases='${cases}',cured='${cured}',active='${active}',deaths='${deaths}'
  WHERE district_id ='${districtId}';`;
  const details = await db.run(updateDetailsQuery);
  response.send("District Details Updated");
});

//API 7
//Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM
      district
    WHERE
      state_id=${stateId};`;
  const stats = await db.get(getStateStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API 8
//Returns an object containing the state name of a district based on the district ID
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id=${districtId};`;
  const state = await db.get(getStateNameQuery);
  response.send(convertDbObjectToResponseObject(state));
});

module.exports = app;
