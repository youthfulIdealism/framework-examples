# How to use this repository

This repository exists to provide basic examples on using [Framework](https://github.com/youthfulIdealism/framework). Each folder within `./src/` provides a scenario that is intended to teach you how to use some specific aspect of Framework. Each example builds on the last, so it's highly reccomended to start with `./src/0_basic` and move through the examples one-by-one. You will need to have MongoDB installed. For three of the examples, you will need to have set up a [replica set](https://www.mongodb.com/docs/manual/tutorial/deploy-replica-set/) in order to run the example. This is because MongoDB transactions need a replica set to work.

To use this repository:
- Run `npm install` to install the dependencies
- Open one of the folders in `./src/` so that you can look at the code
- Replace the mongoDB database URL with the URL of your local test database
- Run `npm run-script build` to compile the typescript into javascript
- Run `node ./dist/<FOLDER_NAME>/index.js` to run the code