blip
====

Is a one page javascript app the runs on a simple node web server. That pulls data cross domain from the blip (Tidepool) api.

# How to run blip Web server

Run web server on root folder.

## Dependencies

You need node and npm.

    > npm install .
    
## Running it

    > npm start
    Blip server listening on port 8081

# How to run blip API server

It's in the api subdirectory.

## Dependencies

You need node and npm.

    > npm install .
    
## Running it

    > npm start
    Blip API server listening on port 8082

Now open http://localhost:8081 and you should see the login screen and should be able to authenticate with facebook. To logout from Facebook to try again open the console and type FB.logout();
