# Caro

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