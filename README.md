# esn-frontend-inbox

Webmail application for OpenPaaS

## Development

Launch the dev server on http://localhost:9900:

```sh
OPENPAAS_URL=https://dev.open-paas.org npm run serve
```

- **OPENPAAS_URL**: The OpenPaaS URL to be used by the current SPA application. Defaults to `http://localhost:8080`.

The development server can also be used to serve minified SPA to check that everything is OK:

```sh
OPENPAAS_URL=https://dev.open-paas.org npm run serve:prod
```

## Build

Generates minified SPA in the `./dist` folder:

```sh
npm run build:prod
```
