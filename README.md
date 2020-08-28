# esn-frontend-inbox

Webmail application for OpenPaaS

## Development

### Configuration

First, you want to ensure that the application grid component is provided with the necessary information about the apps via the environment variable `APP_GRID_ITEMS`:

```sh
cp .env.example .env
```

- **APP_GRID_ITEMS**: A stringified JSON representation of the apps to show in the application grid. It has the following shape:
  ```json
  [
    { "name": "Inbox", "url": "http://localhost:9900/#/unifiedinbox/inbox" },
    { "name": "Calendar", "url": "http://localhost:9900/#/calendar" },
    ...
  ]
  ```

Then, launch the dev server on http://localhost:9900:

```sh
OPENPAAS_URL=https://dev.open-paas.org npm run serve
```

- **OPENPAAS_URL**: The OpenPaaS URL to be used by the current SPA application. Defaults to `http://localhost:8080`.

The development server can also be used to serve minified SPA to check that everything is OK:

```sh
OPENPAAS_URL=https://dev.open-paas.org npm run serve:prod
```

### Authentication

Authentication is provided by a dedicated SPA [esn-frontend-login-app](https://github.com/OpenPaaS-Suite/esn-frontend-login) which is defined in the project `devDependencies`.
In order to make it work with the webpack-dev-server launched by the `npm run serve` command, you will have to generate it like this:

```sh
cd ./node_modules/esn-frontend-login && npm install && npm run build
```

### Serve

Go to http://localhost:9900/inbox/ to open the SPA

## Build

Generates minified SPA in the `./dist` folder:

```sh
npm run build:prod
```

Regarding **APP_GRID_ITEMS**, you can also provide it as a system variable for production purposes, e.g.:

```sh
APP_GRID_ITEMS="[{ \"name\": \"Calendar\", \"url\": \"https://dev.open-paas.org/calendar/\" }, { \"name\": \"Contacts\", \"url\": \"https://dev.open-paas.org/contacts/\" }, { \"name\": \"Inbox\", \"url\": \"http://dev.open-paas.org/inbox/\" }, { \"name\": \"Admin\", \"url\": \"https://dev.open-paas.org/admin/\" }, { \"name\": \"LinShare\", \"url\": \"https://user.linshare-4-0.integration-linshare.org/\" }]" npm run build:prod
```

## Running tests

You can run tests by executing the following command:

```sh
npm run test
```

Note that there is a 10000ms timeout by default. If you want to change that, simply pass the **TEST_TIMEOUT** environment variable:

```sh
TEST_TIMEOUT=2000 npm run test
```
