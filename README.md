blip
====

Is a one page javascript app the runs on a simple node web server. That pulls data cross domain from the blip (Tidepool) api.

## Dependencies

You need node and npm.

    > npm install .
    
## Running it

Runs on env.PORT or 8081

    > npm start

## Config

Path to api is set in pagacke.json config section. Reads dev block unless env.PROD is set.