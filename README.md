# sf-toolkit

A command-line tool for Silverfin template development.

## What can be used for ?

- Update your templates from the command-line while storing them in git repositories.
- Run your Liquid Tests from the command-line.

# Setup & Basic Usage

## Prerequsites

To use this CLI tool you need to first obtain a Silverfin API access_token

## Install package manager

Install `npm` with Homebrew:

```
brew install node
```

Install `yarn` globally:

```
npm install --global yarn
```

## Set environment variables

You can either add the environment variables locally in the file so you only need to add them once, or define them directly in the terminal. 

### Local file 

Add a .env file in the root directory:

```
touch .env
```

Add the following variables in  .env:

```
SF_FIRM_ID="your firm ID"
SF_ACCESS_TOKEN="your access token"
NODE_ENV="development"
```

### Linux / Mac terminal

```
export SF_FIRM_ID=<firm_id>
export SF_ACCESS_TOKEN=<access_token>
```

### Windows terminal

```
set SF_FIRM_ID=<firm_id>
set SF_ACCESS_TOKEN=<access_token>
```

## Add sf-toolkit package

Create `package.json` by running the following command and run through the prompts:

```
yarn init
```

Install `sf-toolkit` as a dependency of your project:

```
yarn add https://github.com/GetSilverfin/sf-toolkit.git
```

## Create script shortcuts

Inside the `package.json`, add a new `scripts` block:

```
"scripts": {
    "new-recon": "./node_modules/sf_toolkit/bin/cli.js new",
    "import-recon": "./node_modules/sf_toolkit/bin/cli.js import",
    "update-recon": "./node_modules/sf_toolkit/bin/cli.js persistReconciliationText"
  }
```

You can then run these commands starting with `yarn` or `npm run`

## Create new template directory

```
yarn new-recon --handle <handle>
```

## Import existing template

```
yarn import-recon --handle <handle>
```

## Update existing template

```
yarn update-recon --handle <handle>
```
