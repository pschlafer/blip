blip
====

Is a one page javascript app the runs on a simple node web server. That pulls data cross domain from the blip (Tidepool) api.

## Dependencies

You need node and npm.

    > npm install .
    
## Running it

Runs on env.PORT or 8081

    > npm start

Run on localhost 8081 against local db

    > npm run-script start-local 


## Clean up users data

I created a small admin tool for MVP weekend to clean up users data. To help them and yourselves when you get stuck.

		http://[blipdomain]/cleanup

There is not authentication so dont share it. Its only meant for MVP weekend.

## Config

Path to api is set in pagacke.json config section. Reads dev block unless env.PROD is set.