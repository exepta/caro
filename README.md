# Caro

[![frontend](https://github.com/exepta/caro/actions/workflows/frontend.yml/badge.svg)](https://github.com/exepta/caro/actions/workflows/frontend.yml)
[![backend](https://github.com/exepta/caro/actions/workflows/backend.yml/badge.svg)](https://github.com/exepta/caro/actions/workflows/backend.yml)
[![codecov](https://codecov.io/gh/exepta/caro/graph/badge.svg?token=HRG5FWW6G9)](https://codecov.io/gh/exepta/caro)

### Development setup
To start with development, you need to run docker compose for postgres and redis databases.
The postgres database will be available on port 5432 and redis on port 6379. 
Both of the databases will be used for the backend.

___
**Dev docker**
```bash
    cd infra/
    docker compose -f docker-compose.dev.yml up -d
```

In the postgres database there is now a table called `users`. This looks like this:

| Key           | Value     | Description                                          |
|---------------|-----------|------------------------------------------------------|
| id            | UUID      | General id for identify the correct user.            |
| tag_id        | VARCHAR   | Simple readable id for users to add friends          |
| username      | VARCHAR   | Display name of the user                             |
| first_name    | VARCHAR   | First name of the user                               |
| last_name     | VARCHAR   | Last name of the user                                |
| email         | VARCHAR   | Email address of the user is unique max accounts one |
| password_hash | VARCHAR   | The password but in hash form                        |
| created_at    | TIMESTAMP | Creation date of the account                         |
| update_at     | TIMESTAMP | Last update date of the account                      |
___

### Playwright tests (e2e)

You can use the script below if you are on linux. By arch linux you can have the problem that the default playwright script is not executable.
I mean this `ǹpx playwright install` for the browser installation. 

```bash
    chmod +x ./playwright-test.sh
    ./playwright-test.sh
```

### Frontend tests (unit)

You can run the frontend tests with the following command.

```bash
    cd apps/web
    pnpm test
```

### OpenAPI for Frontend
We use OpenAPI for generating rest access for the backend. You can find the current contract in `rootDir/share/openapi.json`.
Note by using the command `pnpm install` openapi is triggered automatically. If the api folder not exist after install you can
let create him manuel with `pnpm generate:api` or you use the bash below:

```bash
    cd apps/web
    pnpm generate:api
```

### Troubleshooting

1. Make sure you have installed Node 22 or above and you use the packed manager `pnpm`.
   You can install `pnpm` via `corepack enable pnpm`.
2. Docker is absolutely needed for the database and later more things. Make sure you have installed
   docker and docker-compose on your system.

| Operating System   | Link                                                           |
|--------------------|----------------------------------------------------------------|
| Windows 10 / 11    | https://docs.docker.com/desktop/setup/install/windows-install/ |
| Linux Deb / Ubuntu | https://docs.docker.com/engine/install/debian                  |
| Linux Arch         | https://docs.docker.com/desktop/setup/install/linux/archlinux/ |
| Mac Os             | https://docs.docker.com/desktop/setup/install/mac-install/     |